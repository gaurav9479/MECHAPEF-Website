import Registration from '../models/registration.model.js';
import Event from '../models/event.model.js';
import User from '../models/user.model.js';
import APIResponse from '../utils/APIResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES, REGISTRATION_TYPES } from '../constants/index.js';

export const registerForEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { registrationType, teamName, teamMemberIds } = req.body;

    if (!registrationType) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Registration type is required');
    }

    const event = await Event.findById(eventId);
    if (!event) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.EVENT_NOT_FOUND);
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
            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST,
                `Maximum team size is ${event.maxTeamSize}`
            );
        }
        const members = await User.find({ _id: { $in: teamMemberIds } });
        if (members.length !== teamMemberIds.length) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.INVALID_TEAM_MEMBERS);
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

    const registration = new Registration({
        eventId,
        registeredBy: req.user.userId,
        registrationType,
        teamName: teamName || null,
        teamMembers,
        paymentStatus: event.registrationFee > 0 ? 'Pending' : 'NotApplicable'
    });

    await registration.save();
    await registration.populate('eventId', 'title');
    await registration.populate('registeredBy', 'name email');

    event.totalRegistrations = await Registration.getEventRegistrationCount(eventId);
    await event.save();

    return res
        .status(HTTP_STATUS.CREATED)
        .json(
            new APIResponse(HTTP_STATUS.CREATED, { registration }, SUCCESS_MESSAGES.REGISTRATION_SUCCESS)
        );
});


export const getUserRegistrations = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const registrations = await Registration.find({
        registeredBy: req.user.userId,
        deletedAt: null
    })
        .sort({ registeredAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .populate('eventId', 'title startTime venue category');

    const totalCount = await Registration.countDocuments({
        registeredBy: req.user.userId,
        deletedAt: null
    });

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

    const registration = await Registration.findByIdAndUpdate(
        req.params.id,
        {
            attendanceMarked: attended,
            attendanceMarkedAt: attended ? new Date() : null,
            attendanceMarkedBy: attended ? req.user.userId : null
        },
        { new: true }
    ).populate('eventId', 'title');

    if (!registration) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
    }

    return res
        .status(HTTP_STATUS.OK)
        .json(new APIResponse(HTTP_STATUS.OK, { registration }, 'Attendance marked successfully'));
});

/**
 * Get event registrations (Admin only)
 * GET /api/events/:eventId/registrations
 */
export const getEventRegistrations = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { page = 1, limit = 20, attendanceMarked } = req.query;

    const filter = {
        eventId,
        deletedAt: null
    };

    if (attendanceMarked !== undefined) {
        filter.attendanceMarked = attendanceMarked === 'true';
    }

    const registrations = await Registration.find(filter)
        .sort({ registeredAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .populate('registeredBy', 'name email')
        .populate('eventId', 'title');

    const totalCount = await Registration.countDocuments(filter);

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
    if (registration.registeredBy.toString() !== req.user.userId.toString() && req.user.role !== 'SuperAdmin') {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.FORBIDDEN);
    }

    registration.deletedAt = new Date();
    await registration.save();

    return res
        .status(HTTP_STATUS.OK)
        .json(new APIResponse(HTTP_STATUS.OK, {}, 'Registration cancelled successfully'));
});
