import Registration from '../models/registration.model.js';
import Event from '../models/event.model.js';
import User from '../models/user.model.js';
import APIResponse from '../utils/APIResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES, REGISTRATION_TYPES } from '../constants/index.js';
import { enqueueRegistration, isRegistrationQueueEnabled } from '../queues/registrationQueue.js';
import { syncWithGoogleSheet } from '../utils/googleSheetsWebhook.js';
import fs from 'fs';
import path from 'path';


const backupFilePath = path.join(process.cwd(), 'registrations_backup.log');

const BRANCH_CODES = {
    '0': 'Biotechnology',
    '1': 'Civil Engineering',
    '2': 'Chemical Engineering',
    '3': 'Computer Science and Engineering',
    '4': 'Electronics and Communication Engineering',
    '5': 'Electrical Engineering',
    '6': 'Mechanical Engineering',
    '7': 'Production and Industrial Engineering',
    '8': 'Electronics and Computational Mechanics',
    '9': 'Materials Engineering'
};

const getStudentInfoFromRegNo = (collegeRegNo) => {
    const enrollmentYear = Number(collegeRegNo.slice(0, 4));
    const branchCode = collegeRegNo.charAt(4);

    return {
        enrollmentYear,
        yearOfStudy: Number.isNaN(enrollmentYear) ? undefined : 2027 - enrollmentYear,
        branch: enrollmentYear === 2026 && branchCode === '9'
            ? 'Mechanical Engineering'
            : BRANCH_CODES[branchCode]
    };
};

export const appendBackupLog = (action, payload) => {
    try {
        const logEntry = JSON.stringify({
            timestamp: new Date().toISOString(),
            action,
            payload
        }) + '\n';
        fs.appendFileSync(backupFilePath, logEntry);
    } catch (err) {
        console.error('[Backup Log] CRITICAL: Failed to write registration backup to disk:', err.message);
    }
};


const saveRegistrationDirectly = async (payload, eventTitle) => {
    const registration = new Registration(payload);
    await registration.save();

    await Promise.all([
        registration.populate('eventId', 'title'),
        registration.populate('registeredBy', 'name email collegeRegNo phoneNumber branch yearOfStudy'),
        Event.findByIdAndUpdate(payload.eventId, { $inc: { totalRegistrations: 1 } }),
        User.findByIdAndUpdate(
            payload.registeredBy,
            { $addToSet: { participatedEventNames: eventTitle } }
        )
    ]);



    syncWithGoogleSheet(registration.registeredBy, eventTitle, payload);

    appendBackupLog('COMPLETED_REGISTRATION', registration.toObject());

    return registration;
};


export const getMyRegistrationForEvent = asyncHandler(async (req, res) => {
    const { id: eventId } = req.params;
    const userId = req.user.userId;

    let registration = await Registration.findOne({
        eventId,
        registeredBy: userId,
        deletedAt: null
    }).select('_id registrationType registrationStatus teamName teamMembers customData attended paymentStatus createdAt');

    if (!registration) {
        registration = await Registration.findOne({
            eventId,
            'teamMembers.userId': userId,
            'teamMembers.status': 'Confirmed',
            deletedAt: null
        }).select('_id registrationType registrationStatus teamName teamMembers customData attended paymentStatus createdAt');
    }

    if (!registration || registration.registrationStatus === 'Draft') {
        return res.status(HTTP_STATUS.OK).json(
            new APIResponse(HTTP_STATUS.OK, { isRegistered: false }, 'Not registered for this event')
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

    if (!event.isRegistrationOpen) {
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


        if (event.eligibleBranches && event.eligibleBranches.length > 0) {
            const ineligibleMember = members.find(m => {
                if (!m.branch) return true;
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
                if (!m.yearOfStudy) return true;
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
            email: member.email,
            collegeRegNo: member.collegeRegNo || 'N/A'
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


    appendBackupLog('RAW_PEAK_HOUR_PAYLOAD', payload);


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

            console.error('[RegistrationQueue] Redis unavailable, falling back to direct DB write:', error.message);
        }
    }

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
});


export const getUserRegistrations = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const [registrations, totalCount] = await Promise.all([
        Registration.find({ registeredBy: req.user.userId, deletedAt: null })
            .sort({ registeredAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)
            .populate('eventId', 'title startTime venue category enableQRScanning ticketStages'),
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
    const { attended, stageName, isManualOverride } = req.body;

    if (attended === undefined) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Attended status is required');
    }


    const registration = await Registration.findById(req.params.id).populate('eventId', 'title ticketStages enableQRScanning attendanceMethod');

    if (!registration) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
    }


    if (!isManualOverride && registration.eventId?.enableQRScanning === false && registration.eventId?.attendanceMethod !== 'id-card') {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, 'QR ticket scanning is disabled for this event. Use manual attendance marking.');
    }

    const eventStages = registration.eventId?.ticketStages || ['Stage 1: Check-in'];
    const activeStage = stageName || eventStages[0] || 'Stage 1: Check-in';

    if (attended) {

        const existingStageIndex = (registration.completedStages || []).findIndex(
            s => s.stageName.toLowerCase() === activeStage.toLowerCase()
        );

        if (existingStageIndex !== -1) {
            return res
                .status(HTTP_STATUS.OK)
                .json(new APIResponse(HTTP_STATUS.OK, {
                    registration,
                    alreadyMarked: true,
                    stageName: activeStage,
                    completedStages: registration.completedStages
                }, `Ticket already scanned for "${activeStage}"`));
        }


        const COOLDOWN_MS = 10 * 60 * 1000;
        let lastScannedAt = registration.attendanceMarkedAt ? new Date(registration.attendanceMarkedAt).getTime() : 0;
        if (registration.completedStages && registration.completedStages.length > 0) {
            const latestStageScan = Math.max(...registration.completedStages.map(s => new Date(s.scannedAt).getTime()));
            if (latestStageScan > lastScannedAt) lastScannedAt = latestStageScan;
        }

        if (lastScannedAt > 0) {
            const timeSinceLastScan = Date.now() - lastScannedAt;
            if (timeSinceLastScan < COOLDOWN_MS) {
                const remainingMs = COOLDOWN_MS - timeSinceLastScan;
                const remainingMins = Math.floor(remainingMs / (60 * 1000));
                const remainingSecs = Math.floor((remainingMs % (60 * 1000)) / 1000);

                return res
                    .status(HTTP_STATUS.OK)
                    .json(new APIResponse(HTTP_STATUS.OK, {
                        registration,
                        cooldownActive: true,
                        remainingMins,
                        remainingSecs,
                        stageName: activeStage,
                        completedStages: registration.completedStages
                    }, `Scan Cooldown: Ticket was scanned recently. Please wait ${remainingMins}m ${remainingSecs}s before scanning next stage.`));
            }
        }


        if (!registration.completedStages) registration.completedStages = [];
        registration.completedStages.push({
            stageName: activeStage,
            scannedAt: new Date(),
            scannedBy: req.user.userId
        });

        registration.attendanceMarked = true;
        registration.attendanceMarkedAt = new Date();
        registration.attendanceMarkedBy = req.user.userId;
        await registration.save();

        return res
            .status(HTTP_STATUS.OK)
            .json(new APIResponse(HTTP_STATUS.OK, {
                registration,
                alreadyMarked: false,
                stageName: activeStage,
                completedStages: registration.completedStages
            }, `"${activeStage}" verified successfully!`));
    } else {

        registration.attendanceMarked = false;
        registration.attendanceMarkedAt = null;
        registration.attendanceMarkedBy = null;
        registration.completedStages = [];
        await registration.save();

        return res
            .status(HTTP_STATUS.OK)
            .json(new APIResponse(HTTP_STATUS.OK, { registration, alreadyMarked: false }, 'Attendance reset successfully'));
    }
});

export const markAttendanceByCollegeRegNo = asyncHandler(async (req, res, next) => {
    const collegeRegNo = decodeURIComponent(req.params.collegeRegNo).trim().toUpperCase();
    const studentInfo = getStudentInfoFromRegNo(collegeRegNo);

    const participant = await User.findOne({ collegeRegNo }).select('_id');
    const participantMatches = [{ 'teamMembers.collegeRegNo': collegeRegNo }];
    if (participant) {
        participantMatches.push(
            { registeredBy: participant._id },
            { 'teamMembers.userId': participant._id }
        );
    }

    const registration = await Registration.findOne({
        eventId: req.params.eventId,
        deletedAt: null,
        $or: participantMatches
    });

    if (!registration) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, `No registration found for ID "${collegeRegNo}" in this event`);
    }

    req.scannedStudentInfo = studentInfo;
    req.params.id = registration._id.toString();
    return next ? markAttendance(req, res, next) : undefined;
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
            .populate('registeredBy', 'name email collegeRegNo phoneNumber branch yearOfStudy')
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

    const filter = {
        eventId,
        deletedAt: null,
        registrationStatus: { $ne: 'Draft' }
    };

    if (req.query.verifiedOnly === 'true') {
        filter.isVerified = true;
    }

    const registrations = await Registration.find(filter)
        .populate('registeredBy', 'name email collegeRegNo phoneNumber branch yearOfStudy');

    if (registrations.length === 0) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'No confirmed registrations found for this event');
    }

    const customFieldsSet = new Set();


    if (event.customFormFields && Array.isArray(event.customFormFields)) {
        event.customFormFields.forEach(f => {
            if (f.fieldName) customFieldsSet.add(f.fieldName);
        });
    }


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

    const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);
    const maxMembers = (event.maxTeamSize && event.maxTeamSize > 1) ? (event.maxTeamSize - 1) : 0;


    let headers = [
        'Leader Name',
        'Leader Email',
        'Leader College Reg No',
        'Leader Phone Number',
        'Leader Branch',
        'Leader Year of Study',
        'Registration Status',
        'Registration Type',
        'Team Name',
        'Verified'
    ];


    for (let i = 1; i <= maxMembers; i++) {
        headers.push(`Teammate ${i + 1} Name`);
        headers.push(`Teammate ${i + 1} Reg No`);
        headers.push(`Teammate ${i + 1} Email`);
    }


    headers = headers.concat(customFields);

    let csvString = headers.map(escapeCSV).join(',') + '\n';

    registrations.forEach(reg => {
        const user = reg.registeredBy || {};


        const confirmedMembers = reg.teamMembers?.filter(m => m.status === 'Confirmed') || [];


        const effectiveIsVerified = reg.isVerified || isDeadlinePassed;

        const row = [
            escapeCSV(user.name),
            escapeCSV(user.email),
            escapeCSV(user.collegeRegNo),
            escapeCSV(user.phoneNumber),
            escapeCSV(user.branch),
            escapeCSV(user.yearOfStudy),
            escapeCSV(reg.registrationStatus || 'Confirmed'),
            escapeCSV(reg.registrationType),
            escapeCSV(reg.teamName),
            escapeCSV(effectiveIsVerified ? 'Yes' : 'No')
        ];


        for (let i = 0; i < maxMembers; i++) {
            const member = confirmedMembers[i];
            row.push(escapeCSV(member ? member.name : ''));
            row.push(escapeCSV(member ? member.collegeRegNo : ''));
            row.push(escapeCSV(member ? member.email : ''));
        }


        customFields.forEach(field => {
            let val = reg.customData ? reg.customData[field] : '';
            if (val && typeof val === 'object' && val.url) {
                val = val.url;
            }
            row.push(escapeCSV(val));
        });

        csvString += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=event-${eventId}-registrations.csv`);
    res.status(HTTP_STATUS.OK).send(csvString);
});



export const createDraftTeamRegistration = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { teamName, customData } = req.body;
    const userId = req.user.userId;

    const event = await Event.findById(eventId);
    if (!event) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');
    if (event.registrationMode !== 'JoinRequests') {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'This event does not support Type 2 (JoinRequests) registration');
    }
    if (!teamName) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Team name is required');

    const user = await User.findById(userId);
    if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');

    if (event.eligibleBranches?.length > 0 && user.branch) {
        const eligible = event.eligibleBranches.some(b => b.toLowerCase().trim() === user.branch.toLowerCase().trim());
        if (!eligible) throw new ApiError(HTTP_STATUS.FORBIDDEN, `Your branch (${user.branch}) is not eligible for this event`);
    }
    if (event.eligibleYears?.length > 0 && user.yearOfStudy) {
        if (!event.eligibleYears.includes(user.yearOfStudy)) {
            throw new ApiError(HTTP_STATUS.FORBIDDEN, `Your year (${user.yearOfStudy}) is not eligible for this event`);
        }
    }

    const existing = await Registration.findOne({ eventId, registeredBy: userId, deletedAt: null });
    if (existing) throw new ApiError(HTTP_STATUS.CONFLICT, 'You are already registered/have a draft for this event');

    const registration = new Registration({
        eventId,
        registeredBy: userId,
        registrationType: 'Team',
        registrationStatus: 'Draft',
        teamName,
        teamMembers: [],
        joinRequests: [],
        paymentStatus: event.registrationFee > 0 ? 'Pending' : 'NotApplicable',
        customData: customData || {}
    });

    await registration.save();
    await Event.findByIdAndUpdate(eventId, { $inc: { totalRegistrations: 1 } });

    return res.status(HTTP_STATUS.CREATED).json(
        new APIResponse(HTTP_STATUS.CREATED, { registration }, 'Draft team created! Share your Reg No so others can find and request to join your team.')
    );
});


/**
 * GET /events/:eventId/teams?regNo=20249013
 * Public search — find teams in a JoinRequests event by leader reg no.
 * Returns only teams with available slots (not full, not finalized).
 */
export const searchTeamsForEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { regNo } = req.query;

    const event = await Event.findById(eventId);
    if (!event) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');
    if (event.registrationMode !== 'JoinRequests') {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'This event does not use JoinRequests mode');
    }

    let query = {
        eventId,
        registrationStatus: 'Draft',
        registrationType: 'Team',
        deletedAt: null
    };

    if (regNo) {

        const leader = await User.findOne({ collegeRegNo: regNo.trim() });
        if (!leader) {
            return res.status(HTTP_STATUS.NOT_FOUND).json(
                new APIResponse(HTTP_STATUS.NOT_FOUND, null, 'No user found with that Registration Number')
            );
        }
        query.registeredBy = leader._id;
    }

    const teams = await Registration.find(query)
        .populate('registeredBy', 'name collegeRegNo')
        .select('teamName teamMembers joinRequests registeredBy');

    const result = teams.map(t => ({
        _id: t._id,
        teamName: t.teamName,
        leaderName: t.registeredBy?.name,
        leaderRegNo: t.registeredBy?.collegeRegNo,
        currentSize: t.teamMembers.filter(m => m.status === 'Confirmed').length + 1,
        maxSize: event.maxTeamSize,
        slotsLeft: event.maxTeamSize - (t.teamMembers.filter(m => m.status === 'Confirmed').length + 1),
        hasPendingRequestFromUser: t.joinRequests?.some(r => r.userId?.toString() === req.user.userId?.toString() && r.status === 'Pending')
    })).filter(t => t.slotsLeft > 0);



    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, result, 'Teams found')
    );
});


/**
 * GET /events/:eventId/check-user/:regNo
 * Check if a user (by regNo) is eligible to join an event and isn't already registered.
 * Used by the leader to search & invite members (Standard mode fallback via invites).
 */
export const checkUserEligibilityForEvent = asyncHandler(async (req, res) => {
    const { eventId, regNo } = req.params;

    const event = await Event.findById(eventId);
    if (!event) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');

    const user = await User.findOne({ collegeRegNo: regNo.trim() });
    if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(
            new APIResponse(HTTP_STATUS.NOT_FOUND, null, 'No user found with that Registration Number')
        );
    }


    if (event.eligibleBranches?.length > 0 && user.branch) {
        const eligible = event.eligibleBranches.some(b => b.toLowerCase().trim() === user.branch.toLowerCase().trim());
        if (!eligible) {
            return res.status(HTTP_STATUS.FORBIDDEN).json(
                new APIResponse(HTTP_STATUS.FORBIDDEN, null, `${user.name}'s branch (${user.branch}) is not eligible for this event`)
            );
        }
    }

    if (event.eligibleYears?.length > 0 && user.yearOfStudy) {
        if (!event.eligibleYears.includes(user.yearOfStudy)) {
            return res.status(HTTP_STATUS.FORBIDDEN).json(
                new APIResponse(HTTP_STATUS.FORBIDDEN, null, `${user.name}'s year (${user.yearOfStudy}) is not eligible for this event`)
            );
        }
    }

    const alreadyRegistered = await Registration.findOne({
        eventId,
        $or: [
            { registeredBy: user._id },
            { 'teamMembers.userId': user._id, 'teamMembers.status': 'Confirmed' }
        ],
        deletedAt: null
    });

    if (alreadyRegistered) {
        return res.status(HTTP_STATUS.CONFLICT).json(
            new APIResponse(HTTP_STATUS.CONFLICT, null, `${user.name} is already registered for this event`)
        );
    }

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, {
            userId: user._id,
            name: user.name,
            collegeRegNo: user.collegeRegNo,
            branch: user.branch,
            yearOfStudy: user.yearOfStudy
        }, `${user.name} is eligible and available!`)
    );
});


/**
 * POST /registrations/:teamRegId/send-join-request
 * A non-leader user sends a join request to a Draft team.
 * Body: {} (user is taken from req.user)
 */
export const sendJoinRequest = asyncHandler(async (req, res) => {
    const { teamRegId } = req.params;
    const userId = req.user.userId;

    const registration = await Registration.findById(teamRegId);
    if (!registration) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Team registration not found');
    if (registration.registrationStatus !== 'Draft') {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'This team is already finalized and not accepting requests');
    }

    const event = await Event.findById(registration.eventId);
    if (!event) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');

    const user = await User.findById(userId);
    if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');


    if (registration.registeredBy.toString() === userId.toString()) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'You cannot send a join request to your own team');
    }


    const alreadyMember = registration.teamMembers.find(
        m => m.userId?.toString() === userId && m.status === 'Confirmed'
    );
    if (alreadyMember) throw new ApiError(HTTP_STATUS.CONFLICT, 'You are already a member of this team');


    const pendingRequest = registration.joinRequests.find(
        r => r.userId?.toString() === userId && r.status === 'Pending'
    );
    if (pendingRequest) throw new ApiError(HTTP_STATUS.CONFLICT, 'You already have a pending join request for this team');

    const confirmedCount = registration.teamMembers.filter(m => m.status === 'Confirmed').length + 1;
    if (confirmedCount >= event.maxTeamSize) {
        throw new ApiError(HTTP_STATUS.CONFLICT, 'This team is already full');
    }

    const existingReg = await Registration.findOne({
        eventId: registration.eventId,
        $or: [
            { registeredBy: userId },
            { 'teamMembers.userId': userId, 'teamMembers.status': 'Confirmed' }
        ],
        deletedAt: null
    });
    if (existingReg) {
        throw new ApiError(HTTP_STATUS.CONFLICT, 'You are already registered for this event');
    }

    registration.joinRequests.push({
        userId,
        name: user.name,
        email: user.email,
        collegeRegNo: user.collegeRegNo,
        status: 'Pending'
    });

    await registration.save();

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, null, 'Join request sent! The team leader will review it.')
    );
});


/**
 * POST /registrations/:teamRegId/respond-join
 * Team leader accepts or rejects an incoming join request.
 * Body: { requesterId: "userId", action: "Accept" | "Reject" }
 */
export const respondToJoinRequest = asyncHandler(async (req, res) => {
    const { teamRegId } = req.params;
    const { requesterId, action } = req.body;
    const userId = req.user.userId;

    if (!['Accept', 'Reject'].includes(action)) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Action must be Accept or Reject');
    }

    const registration = await Registration.findById(teamRegId);
    if (!registration) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Team registration not found');


    if (registration.registeredBy.toString() !== userId.toString()) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Only the team leader can respond to join requests');
    }

    if (registration.registrationStatus !== 'Draft') {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'This team is already finalized');
    }

    const event = await Event.findById(registration.eventId);
    if (!event) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');

    const requestIdx = registration.joinRequests.findIndex(
        r => r.userId?.toString() === requesterId && r.status === 'Pending'
    );
    if (requestIdx === -1) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'No pending join request found from this user');
    }

    if (action === 'Accept') {
        const confirmedCount = registration.teamMembers.filter(m => m.status === 'Confirmed').length + 1;
        if (confirmedCount >= event.maxTeamSize) {
            throw new ApiError(HTTP_STATUS.CONFLICT, 'Team is already full');
        }

        const existingReg = await Registration.findOne({
            eventId: registration.eventId,
            $or: [
                { registeredBy: requesterId },
                { 'teamMembers.userId': requesterId, 'teamMembers.status': 'Confirmed' }
            ],
            deletedAt: null
        });
        if (existingReg && existingReg._id.toString() !== teamRegId) {
            throw new ApiError(HTTP_STATUS.CONFLICT, 'This user is already part of another team for this event');
        }

        const requester = registration.joinRequests[requestIdx];

        registration.joinRequests[requestIdx].status = 'Accepted';
        registration.teamMembers.push({
            userId: requester.userId,
            name: requester.name,
            email: requester.email,
            collegeRegNo: requester.collegeRegNo,
            status: 'Confirmed'
        });
    } else {
        registration.joinRequests[requestIdx].status = 'Rejected';
    }

    await registration.save();

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, null, `Join request ${action}ed successfully`)
    );
});


/**
 * POST /registrations/:teamRegId/add-member
 * Leader directly endorses/adds a team member by entering their 8-digit College Reg No.
 * Body: { collegeRegNo: "20249013" }
 */
export const addMemberByRegNo = asyncHandler(async (req, res) => {
    const { teamRegId } = req.params;
    const { collegeRegNo } = req.body;
    const userId = req.user.userId;

    if (!collegeRegNo || collegeRegNo.trim().length !== 8) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Valid 8-digit Registration Number is required');
    }

    const registration = await Registration.findById(teamRegId);
    if (!registration) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Team registration not found');


    if (registration.registeredBy.toString() !== userId.toString()) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Only the team leader can add team members');
    }

    if (registration.registrationStatus !== 'Draft') {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'This team is already finalized');
    }

    const event = await Event.findById(registration.eventId);
    if (!event) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');

    const confirmedCount = registration.teamMembers.filter(m => m.status === 'Confirmed').length + 1;
    if (confirmedCount >= event.maxTeamSize) {
        throw new ApiError(HTTP_STATUS.CONFLICT, `Team capacity reached (${event.maxTeamSize} max)`);
    }

    const targetUser = await User.findOne({ collegeRegNo: collegeRegNo.trim() });
    if (!targetUser) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'No user found with that Registration Number');
    }

    if (targetUser._id.toString() === userId.toString()) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'You are already the leader of this team');
    }

    if (event.eligibleBranches?.length > 0 && targetUser.branch) {
        const eligible = event.eligibleBranches.some(b => b.toLowerCase().trim() === targetUser.branch.toLowerCase().trim());
        if (!eligible) {
            throw new ApiError(HTTP_STATUS.FORBIDDEN, `${targetUser.name}'s branch (${targetUser.branch}) is not eligible for this event`);
        }
    }

    if (event.eligibleYears?.length > 0 && targetUser.yearOfStudy) {
        if (!event.eligibleYears.includes(targetUser.yearOfStudy)) {
            throw new ApiError(HTTP_STATUS.FORBIDDEN, `${targetUser.name}'s year (${targetUser.yearOfStudy}) is not eligible for this event`);
        }
    }

    const alreadyInTeam = registration.teamMembers.some(
        m => m.userId?.toString() === targetUser._id.toString() && m.status === 'Confirmed'
    );
    if (alreadyInTeam) {
        throw new ApiError(HTTP_STATUS.CONFLICT, `${targetUser.name} is already in your team`);
    }

    const existingReg = await Registration.findOne({
        eventId: registration.eventId,
        $or: [
            { registeredBy: targetUser._id },
            { 'teamMembers.userId': targetUser._id, 'teamMembers.status': 'Confirmed' }
        ],
        deletedAt: null
    });
    if (existingReg) {
        throw new ApiError(HTTP_STATUS.CONFLICT, `${targetUser.name} is already registered for this event`);
    }


    // Check if this user already has a pending invitation
    const existingInvite = registration.invitations?.find(
        inv => inv.userId?.toString() === targetUser._id.toString() && inv.status === 'Pending'
    );
    if (existingInvite) {
        throw new ApiError(HTTP_STATUS.CONFLICT, `An invitation has already been sent to ${targetUser.name}`);
    }

    // Send an invitation — target user must Accept/Reject on their side
    registration.invitations.push({
        userId: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        collegeRegNo: targetUser.collegeRegNo,
        status: 'Pending'
    });

    await registration.save();

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, null, `Invitation sent to ${targetUser.name}! They must accept to join your team.`)
    );
});


/**
 * POST /registrations/:teamRegId/respond-invitation
 * The invited user accepts or rejects a leader-sent invitation.
 * Body: { action: "Accept" | "Reject" }
 */
export const respondToInvitation = asyncHandler(async (req, res) => {
    const { teamRegId } = req.params;
    const { action } = req.body;
    const userId = req.user.userId;

    if (!['Accept', 'Reject'].includes(action)) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Action must be Accept or Reject');
    }

    const registration = await Registration.findById(teamRegId);
    if (!registration) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Team registration not found');

    if (registration.registrationStatus !== 'Draft') {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'This team is already finalized and not accepting new members');
    }

    const inviteIdx = registration.invitations.findIndex(
        inv => inv.userId?.toString() === userId.toString() && inv.status === 'Pending'
    );
    if (inviteIdx === -1) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'No pending invitation found for you on this team');
    }

    if (action === 'Accept') {
        const event = await Event.findById(registration.eventId);
        if (!event) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');

        const confirmedCount = registration.teamMembers.filter(m => m.status === 'Confirmed').length + 1;
        if (confirmedCount >= event.maxTeamSize) {
            throw new ApiError(HTTP_STATUS.CONFLICT, 'This team is already full');
        }

        const existingReg = await Registration.findOne({
            eventId: registration.eventId,
            $or: [
                { registeredBy: userId },
                { 'teamMembers.userId': userId, 'teamMembers.status': 'Confirmed' }
            ],
            deletedAt: null
        });
        if (existingReg && existingReg._id.toString() !== teamRegId) {
            throw new ApiError(HTTP_STATUS.CONFLICT, 'You are already part of another team for this event');
        }

        const invite = registration.invitations[inviteIdx];
        registration.invitations[inviteIdx].status = 'Accepted';
        registration.teamMembers.push({
            userId: invite.userId,
            name: invite.name,
            email: invite.email,
            collegeRegNo: invite.collegeRegNo,
            status: 'Confirmed'
        });
    } else {
        registration.invitations[inviteIdx].status = 'Rejected';
    }

    await registration.save();

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, null, `Invitation ${action === 'Accept' ? 'accepted! You are now part of the team.' : 'declined.'}`)
    );
});


/**
 * POST /registrations/:teamRegId/leave
 * A confirmed team member leaves a Draft team, OR withdraws their pending join request.
 */
export const leaveTeam = asyncHandler(async (req, res) => {
    const { teamRegId } = req.params;
    const userId = req.user.userId;

    const registration = await Registration.findById(teamRegId);
    if (!registration) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Team registration not found');

    if (registration.registrationStatus !== 'Draft') {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cannot leave a team after registration is finalized');
    }


    if (registration.registeredBy.toString() === userId.toString()) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Team leader cannot leave the team. You can disband the team if needed.');
    }

    const memberIdx = registration.teamMembers.findIndex(
        m => m.userId?.toString() === userId.toString()
    );
    let removedMember = false;
    if (memberIdx !== -1) {
        registration.teamMembers.splice(memberIdx, 1);
        removedMember = true;
    }

    const reqIdx = registration.joinRequests.findIndex(
        r => r.userId?.toString() === userId.toString()
    );
    if (reqIdx !== -1) {
        registration.joinRequests.splice(reqIdx, 1);
    }

    if (!removedMember && reqIdx === -1) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'You are not part of this team or have no active request');
    }

    await registration.save();

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, null, removedMember ? 'You have left the team' : 'Your join request was withdrawn')
    );
});


/**
 * POST /registrations/:teamRegId/remove-member
 * Leader removes a confirmed team member from a Draft team.
 * Body: { memberUserId: "userId" }
 */
export const removeTeamMember = asyncHandler(async (req, res) => {
    const { teamRegId } = req.params;
    const { memberUserId } = req.body;
    const userId = req.user.userId;

    const registration = await Registration.findById(teamRegId);
    if (!registration) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Team registration not found');

    if (registration.registeredBy.toString() !== userId.toString()) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Only the team leader can remove team members');
    }

    if (registration.registrationStatus !== 'Draft') {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cannot remove members after registration is finalized');
    }

    if (memberUserId === userId.toString()) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Leader cannot remove themselves');
    }

    const memberIdx = registration.teamMembers.findIndex(
        m => m.userId?.toString() === memberUserId
    );
    if (memberIdx === -1) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Member not found in this team');
    }

    const memberName = registration.teamMembers[memberIdx].name;
    registration.teamMembers.splice(memberIdx, 1);

    await registration.save();

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, null, `${memberName} removed from the team`)
    );
});




/**
 * POST /registrations/:teamRegId/finalize
 * Team leader finalizes the Draft registration → status becomes Confirmed.
 * Body: { customData: {} } — any custom form fields from the event
 */
export const finalizeTeamRegistration = asyncHandler(async (req, res) => {
    const { teamRegId } = req.params;
    const { customData } = req.body;
    const userId = req.user.userId;

    const registration = await Registration.findById(teamRegId);
    if (!registration) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Team registration not found');

    const isLeader = registration.registeredBy.toString() === userId.toString();
    const isConfirmedMember = registration.teamMembers.some(
        m => m.userId?.toString() === userId && m.status === 'Confirmed'
    );
    if (!isLeader && !isConfirmedMember) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Only the team leader or a confirmed member can finalize the registration');
    }

    if (registration.registrationStatus === 'Confirmed') {
        throw new ApiError(HTTP_STATUS.CONFLICT, 'Registration is already finalized');
    }

    const event = await Event.findById(registration.eventId);
    if (!event) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');

    const minSize = event.minTeamSize || 2;
    const maxSize = event.maxTeamSize || 5;
    const currentConfirmedCount = registration.teamMembers.filter(m => m.status === 'Confirmed').length + 1;

    if (currentConfirmedCount < minSize) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            `Team must have at least ${minSize} member${minSize > 1 ? 's' : ''} to finalize (currently ${currentConfirmedCount})`
        );
    }

    if (currentConfirmedCount > maxSize) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            `Team cannot exceed ${maxSize} members (currently ${currentConfirmedCount})`
        );
    }

    if (event.customFormFields?.length > 0) {
        const requiredFields = event.customFormFields.filter(f => f.isRequired);
        for (const field of requiredFields) {
            const val = customData?.[field.fieldName];
            if (val === undefined || val === null || val === '') {
                throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Required field missing: ${field.fieldName}`);
            }
        }
    }

    registration.registrationStatus = 'Confirmed';
    if (customData) registration.customData = customData;

    await registration.save();

    await Promise.all([
        registration.populate('registeredBy', 'name email collegeRegNo phoneNumber branch yearOfStudy'),
        User.findByIdAndUpdate(
            registration.registeredBy,
            { $addToSet: { participatedEventNames: event.title } }
        )
    ]);

    syncWithGoogleSheet(registration.registeredBy, event.title, registration.toObject());

    appendBackupLog('TYPE2_TEAM_FINALIZED', registration.toObject());

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { registration }, 'Registration finalized! Your team is officially registered.')
    );
});


/**
 * PATCH /registrations/:teamRegId/draft-data
 * Leader saves custom form fields / draft details without finalizing.
 * Body: { customData }
 */
export const updateDraftData = asyncHandler(async (req, res) => {
    const { teamRegId } = req.params;
    const { customData } = req.body;
    const userId = req.user.userId;

    const registration = await Registration.findById(teamRegId);
    if (!registration) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Team registration not found');

    if (registration.registeredBy.toString() !== userId.toString()) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Only the team leader can update team draft data');
    }

    if (registration.registrationStatus !== 'Draft') {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cannot edit details after registration is finalized');
    }

    if (customData) {
        registration.customData = customData;
        await registration.save();
    }

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { registration }, 'Draft changes saved successfully')
    );
});


/**
 * GET /events/:eventId/my-team-registration
 * Get the current user's Draft/Confirmed team registration for a JoinRequests event.
 * Returns full team state: members, pending join requests, etc.
 */
export const getMyTeamRegistration = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const userId = req.user.userId;

    let registration = await Registration.findOne({
        eventId,
        registeredBy: userId,
        deletedAt: null
    }).populate('registeredBy', 'name collegeRegNo email');

    if (!registration) {
        registration = await Registration.findOne({
            eventId,
            'teamMembers.userId': userId,
            'teamMembers.status': 'Confirmed',
            deletedAt: null
        }).populate('registeredBy', 'name collegeRegNo email');
    }

    if (!registration) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(
            new APIResponse(HTTP_STATUS.NOT_FOUND, null, 'No team registration found for this event')
        );
    }

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, registration, 'Team registration found')
    );
});


/**
 * DELETE /registrations/:teamRegId/draft
 * Leader disbands/deletes a Draft team before finalization.
 * Instantly lands the user back to the Join / Create Team view.
 */
export const deleteDraftTeam = asyncHandler(async (req, res) => {
    const { teamRegId } = req.params;
    const userId = req.user.userId;

    const registration = await Registration.findById(teamRegId);
    if (!registration) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Team registration not found');

    if (registration.registeredBy.toString() !== userId.toString()) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Only the team leader can delete/disband the team');
    }

    if (registration.registrationStatus !== 'Draft') {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cannot delete a team after registration is finalized');
    }

    registration.deletedAt = new Date();
    await registration.save();

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, null, 'Draft team deleted successfully')
    );
});



/**
 * GET /events/:eventId/my-join-status
 * Returns the current user's join request status for a JoinRequests event.
 * Covers BOTH sides:
 *   - If user is the LEADER: returns their draft registration with full joinRequests list
 *   - If user sent a JOIN REQUEST: returns the team they requested + their request status
 *   - If user is a CONFIRMED MEMBER: returns the team they belong to
 *   - If none: 404
 */
export const getMyJoinStatus = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const userId = req.user.userId;

    const asLeader = await Registration.findOne({
        eventId,
        registeredBy: userId,
        deletedAt: null
    }).populate('registeredBy', 'name collegeRegNo email').lean();

    if (asLeader) {
        return res.status(HTTP_STATUS.OK).json(
            new APIResponse(HTTP_STATUS.OK, { role: 'leader', registration: asLeader }, 'You are the team leader')
        );
    }

    const asMember = await Registration.findOne({
        eventId,
        'teamMembers.userId': userId,
        'teamMembers.status': 'Confirmed',
        deletedAt: null
    }).populate('registeredBy', 'name collegeRegNo').lean();

    if (asMember) {
        return res.status(HTTP_STATUS.OK).json(
            new APIResponse(HTTP_STATUS.OK, { role: 'member', registration: asMember }, 'You are a confirmed team member')
        );
    }

    const teamsWithMyRequest = await Registration.find({
        eventId,
        'joinRequests.userId': userId,
        deletedAt: null
    }).populate('registeredBy', 'name collegeRegNo').lean();

    if (teamsWithMyRequest.length > 0) {
        const result = teamsWithMyRequest.map(team => {
            const myReq = team.joinRequests.find(r => r.userId?.toString() === userId);
            return {
                teamId: team._id,
                teamName: team.teamName,
                leaderName: team.registeredBy?.name,
                leaderRegNo: team.registeredBy?.collegeRegNo,
                currentSize: team.teamMembers.filter(m => m.status === 'Confirmed').length + 1,
                requestStatus: myReq?.status || 'Unknown',
                requestedAt: myReq?.requestedAt
            };
        });

        return res.status(HTTP_STATUS.OK).json(
            new APIResponse(HTTP_STATUS.OK, { role: 'requester', requests: result }, 'Your join request(s) found')
        );
    }

    // Check if user has been invited by a leader
    const teamsWithInvite = await Registration.find({
        eventId,
        'invitations.userId': userId,
        'invitations.status': 'Pending',
        deletedAt: null
    }).populate('registeredBy', 'name collegeRegNo').lean();

    if (teamsWithInvite.length > 0) {
        const invitations = teamsWithInvite.map(team => {
            const myInvite = team.invitations.find(
                inv => inv.userId?.toString() === userId && inv.status === 'Pending'
            );
            return {
                teamId: team._id,
                teamName: team.teamName,
                leaderName: team.registeredBy?.name,
                leaderRegNo: team.registeredBy?.collegeRegNo,
                currentSize: team.teamMembers.filter(m => m.status === 'Confirmed').length + 1,
                inviteStatus: myInvite?.status || 'Pending',
                sentAt: myInvite?.sentAt
            };
        });

        return res.status(HTTP_STATUS.OK).json(
            new APIResponse(HTTP_STATUS.OK, { role: 'invitee', invitations }, 'You have pending invitation(s)')
        );
    }

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { role: 'none' }, 'No join activity found for this event')
    );
});