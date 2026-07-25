import Registration from '../models/registration.model.js';
import Event from '../models/event.model.js';
import User from '../models/user.model.js';
import APIResponse from '../utils/APIResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES, REGISTRATION_TYPES } from '../constants/index.js';
import { enqueueRegistration, isRegistrationQueueEnabled } from '../queues/registrationQueue.js';

// Shared helper — used by both direct write and Redis fallback path
const saveRegistrationDirectly = async (payload, eventTitle) => {
    const registration = new Registration(payload);
    await registration.save();

    await Promise.all([
        registration.populate('eventId', 'title'),
        registration.populate('registeredBy', 'name email'),
        Event.findByIdAndUpdate(payload.eventId, { $inc: { totalRegistrations: 1 } }),
        User.findByIdAndUpdate(
            payload.registeredBy,
            { $addToSet: { participatedEventNames: eventTitle } }
        )
    ]);

    return registration;
};

// Get the current user's registration for a specific event
export const getMyRegistrationForEvent = asyncHandler(async (req, res) => {
    const { id: eventId } = req.params;
    const userId = req.user.userId;

    const registration = await Registration.findOne({
        eventId,
        registeredBy: userId,
        deletedAt: null
    }).select('_id registrationType teamName attended paymentStatus createdAt');

    if (!registration) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(
            new APIResponse(HTTP_STATUS.NOT_FOUND, null, 'Not registered for this event')
        );
    }

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, registration, 'Registration found')
    );
});

export const registerForEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { registrationType, teamName, teamMemberIds, customData } = req.body;

    if (!registrationType) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Registration type is required');
    }

    const event = await Event.findById(eventId);
    if (!event) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.EVENT_NOT_FOUND);
    }

    // Check branch and year eligibility for registerer
    const userObj = await User.findById(req.user.userId);
    if (!userObj) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    if (event.eligibleBranches && event.eligibleBranches.length > 0) {
        if (!userObj.branch) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Please update your branch in your profile before registering');
        }
        const isEligible = event.eligibleBranches.some(b => 
            b.toLowerCase().trim() === userObj.branch.toLowerCase().trim()
        );
        if (!isEligible) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Your branch (${userObj.branch}) is not eligible for this event`);
        }
    }

    if (event.eligibleYears && event.eligibleYears.length > 0) {
        if (!userObj.yearOfStudy) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Please update your year of study in your profile before registering');
        }
        if (!event.eligibleYears.includes(userObj.yearOfStudy)) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Your year of study (${userObj.yearOfStudy}) is not eligible for this event`);
        }
    }

    if (new Date() > event.registrationDeadline) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.REGISTRATION_CLOSED);
    }

    const existingRegistration = await Registration.findOne({
        eventId,
        registeredBy: req.user.userId,
        deletedAt: null
    });

    if (existingRegistration) {
        throw new ApiError(HTTP_STATUS.CONFLICT, ERROR_MESSAGES.ALREADY_REGISTERED);
    }

    let teamMembers = [];
    if (registrationType === REGISTRATION_TYPES.TEAM) {
        if (!teamName) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Team name is required for team registration');
        }

        if (!teamMemberIds || teamMemberIds.length === 0) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_TEAM_MEMBERS);
        }

        if (teamMemberIds.length + 1 > event.maxTeamSize) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Maximum team size is ${event.maxTeamSize}`);
        }

        const members = await User.find({ _id: { $in: teamMemberIds } });
        if (members.length !== teamMemberIds.length) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.INVALID_TEAM_MEMBERS);
        }

        // Check branch and year eligibility for team members
        if (event.eligibleBranches && event.eligibleBranches.length > 0) {
            const ineligibleMember = members.find(m => {
                if (!m.branch) return true; // branch not set
                return !event.eligibleBranches.some(b => b.toLowerCase().trim() === m.branch.toLowerCase().trim());
            });
            if (ineligibleMember) {
                throw new ApiError(
                    HTTP_STATUS.BAD_REQUEST, 
                    `Team member ${ineligibleMember.name} (Branch: ${ineligibleMember.branch || 'Not Set'}) is not eligible for this event.`
                );
            }
        }

        if (event.eligibleYears && event.eligibleYears.length > 0) {
            const ineligibleYearMember = members.find(m => {
                if (!m.yearOfStudy) return true; // year not set
                return !event.eligibleYears.includes(m.yearOfStudy);
            });
            if (ineligibleYearMember) {
                throw new ApiError(
                    HTTP_STATUS.BAD_REQUEST, 
                    `Team member ${ineligibleYearMember.name} (Year: ${ineligibleYearMember.yearOfStudy || 'Not Set'}) is not eligible for this event.`
                );
            }
        }

        const registeredMembers = await Registration.find({
            eventId,
            'teamMembers.userId': { $in: teamMemberIds },
            deletedAt: null
        });

        if (registeredMembers.length > 0) {
            throw new ApiError(HTTP_STATUS.CONFLICT, 'Some team members are already registered for this event');
        }

        teamMembers = members.map(member => ({
            userId: member._id,
            name: member.name,
            email: member.email
        }));
    }

    const payload = {
        eventId,
        registeredBy: req.user.userId,
        registrationType,
        teamName: teamName || null,
        teamMembers,
        paymentStatus: event.registrationFee > 0 ? 'Pending' : 'NotApplicable',
        customData: customData || {}
    };

    // Try queue first — if Redis is up, enqueue and return early
    if (isRegistrationQueueEnabled()) {
        try {
            await enqueueRegistration(payload);
            return res
                .status(HTTP_STATUS.ACCEPTED)
                .json(
                    new APIResponse(
                        HTTP_STATUS.ACCEPTED,
                        null,
                        'Registration queued. Please check your Profile in 1-2 minutes for your Ticket.'
                    )
                );
        } catch (error) {
            // Redis is down or free tier expired — fall through to direct write
            console.error('[RegistrationQueue] Redis unavailable, falling back to direct DB write:', error.message);
        }
    }

    // Direct write — runs when:
    // 1. Redis is not configured (REDIS_URL not set)
    // 2. Redis was configured but is now down (free tier expired, outage, etc.)
    try {
        const registration = await saveRegistrationDirectly(payload, event.title);
        return res
            .status(HTTP_STATUS.CREATED)
            .json(
                new APIResponse(
                    HTTP_STATUS.ACCEPTED,
                    null,
                    'Registration queued. Please check your Profile in 1-2 minutes for your Ticket.'
                )
            );
    } catch (error) {
        if (error.code === 11000) {
            throw new ApiError(HTTP_STATUS.CONFLICT, ERROR_MESSAGES.ALREADY_REGISTERED);
        }
        throw error;
    }

    const registration = new Registration(payload);
    await registration.save();

    await Promise.all([
        registration.populate('eventId', 'title'),
        registration.populate('registeredBy', 'name email'),
        Event.findByIdAndUpdate(eventId, { $inc: { totalRegistrations: 1 } }),
        User.findByIdAndUpdate(
            req.user.userId,
            { $addToSet: { participatedEventNames: event.title } }
        )
    ]);

    return res
        .status(HTTP_STATUS.CREATED)
        .json(
            new APIResponse(HTTP_STATUS.CREATED, { registration }, SUCCESS_MESSAGES.REGISTRATION_SUCCESS)
        );
});


export const getUserRegistrations = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const [registrations, totalCount] = await Promise.all([
        Registration.find({ registeredBy: req.user.userId, deletedAt: null })
            .sort({ registeredAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)
            .populate('eventId', 'title startTime venue category'),
        Registration.countDocuments({ registeredBy: req.user.userId, deletedAt: null })
    ]);

    return res
        .status(HTTP_STATUS.OK)
        .json(
            new APIResponse(HTTP_STATUS.OK, {
                registrations,
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit)
                }
            }, 'User registrations retrieved')
        );
});

export const markAttendance = asyncHandler(async (req, res) => {
    const { attended } = req.body;

    if (attended === undefined) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Attended status is required');
    }

    // Load registration first to detect previous attendance state
    const registration = await Registration.findById(req.params.id).populate('eventId', 'title');

    if (!registration) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
    }

    // If trying to mark attended=true but already marked, return a friendly flag
    if (attended && registration.attendanceMarked) {
        return res
            .status(HTTP_STATUS.OK)
            .json(new APIResponse(HTTP_STATUS.OK, { registration, alreadyMarked: true }, 'Attendance was already marked'));
    }

    // Otherwise update the attendance fields
    registration.attendanceMarked = attended;
    registration.attendanceMarkedAt = attended ? new Date() : null;
    registration.attendanceMarkedBy = attended ? req.user.userId : null;
    await registration.save();

    return res
        .status(HTTP_STATUS.OK)
        .json(new APIResponse(HTTP_STATUS.OK, { registration, alreadyMarked: false }, 'Attendance marked successfully'));
});

export const getEventRegistrations = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { page = 1, limit = 20, attendanceMarked } = req.query;

    const filter = { eventId, deletedAt: null };
    if (attendanceMarked !== undefined) {
        filter.attendanceMarked = attendanceMarked === 'true';
    }

    const [registrations, totalCount] = await Promise.all([
        Registration.find(filter)
            .sort({ registeredAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .populate('registeredBy', 'name email')
            .populate('eventId', 'title'),
        Registration.countDocuments(filter)
    ]);

    return res
        .status(HTTP_STATUS.OK)
        .json(
            new APIResponse(HTTP_STATUS.OK, {
                registrations,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalCount,
                    totalPages: Math.ceil(totalCount / parseInt(limit))
                }
            }, 'Event registrations retrieved')
        );
});

export const cancelRegistration = asyncHandler(async (req, res) => {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
    }

    if (registration.registeredBy.toString() !== req.user.userId.toString() && req.user.role !== 'super-admin') {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.FORBIDDEN);
    }

    registration.deletedAt = new Date();
    await registration.save();

    return res
        .status(HTTP_STATUS.OK)
        .json(new APIResponse(HTTP_STATUS.OK, {}, 'Registration cancelled successfully'));
});

export const verifyRegistration = asyncHandler(async (req, res) => {
    const { isVerified } = req.body;

    if (isVerified === undefined) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'isVerified status is required');
    }

    const registration = await Registration.findByIdAndUpdate(
        req.params.id,
        { isVerified },
        { new: true }
    ).populate('eventId', 'title');

    if (!registration) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
    }

    return res
        .status(HTTP_STATUS.OK)
        .json(new APIResponse(HTTP_STATUS.OK, { registration }, `Registration ${isVerified ? 'verified' : 'unverified'} successfully`));
});

export const exportRegistrationsCSV = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.EVENT_NOT_FOUND);
    }

    const registrations = await Registration.find({ eventId, deletedAt: null })
        .populate('registeredBy', 'name email collegeRegNo phoneNumber branch yearOfStudy');

    if (registrations.length === 0) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'No registrations found for this event');
    }

    const customFieldsSet = new Set();
    registrations.forEach(reg => {
        if (reg.customData) {
            Object.keys(reg.customData).forEach(key => customFieldsSet.add(key));
        }
    });
    const customFields = Array.from(customFieldsSet);

    const escapeCSV = (val) => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    let csvString = 'Name,Email,College Reg No,Phone Number,Branch,Year of Study,Registration Type,Team Name,Verified,';
    csvString += customFields.join(',') + '\n';

    registrations.forEach(reg => {
        const user = reg.registeredBy || {};
        const row = [
            escapeCSV(user.name),
            escapeCSV(user.email),
            escapeCSV(user.collegeRegNo),
            escapeCSV(user.phoneNumber),
            escapeCSV(user.branch),
            escapeCSV(user.yearOfStudy),
            escapeCSV(reg.registrationType),
            escapeCSV(reg.teamName),
            escapeCSV(reg.isVerified ? 'Yes' : 'No')
        ];

        customFields.forEach(field => {
            row.push(escapeCSV(reg.customData ? reg.customData[field] : ''));
        });

        csvString += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=event-${eventId}-registrations.csv`);
    res.status(HTTP_STATUS.OK).send(csvString);
});