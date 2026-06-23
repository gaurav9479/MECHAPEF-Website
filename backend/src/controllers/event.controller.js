import Event from '../models/event.model.js';
import Registration from '../models/registration.model.js';
import User from '../models/user.model.js';
import APIResponse from '../utils/APIResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES, PAGINATION } from '../constants/index.js';

export const createEvent = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        category,
        startTime,
        endTime,
        venue,
        maxTeamSize,
        registrationDeadline,
        featured,
        rules,
        prizes,
        registrationFee
    } = req.body;
    if (!title || !description || !category || !startTime || !endTime || !venue || !registrationDeadline) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Required fields: title, description, category, startTime, endTime, venue, registrationDeadline'
        );
    }

    const newEvent = new Event({
        title,
        description,
        category,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        venue,
        maxTeamSize: maxTeamSize || 1,
        registrationDeadline: new Date(registrationDeadline),
        featured: featured || false,
        rules: rules || [],
        prizes: prizes || null,
        registrationFee: registrationFee || 0,
        createdBy: req.user.userId
    });

    await newEvent.save();
    await newEvent.populate('createdBy', 'name email');

    return res
        .status(HTTP_STATUS.CREATED)
        .json(
            new APIResponse(HTTP_STATUS.CREATED, { event: newEvent }, SUCCESS_MESSAGES.EVENT_CREATED)
        );
});


export const getAllEvents = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const { category, featured } = req.query;


    const filter = { deletedAt: null };
    if (category) filter.category = category;
    if (featured === 'true') filter.featured = true;

    const totalCount = await Event.countDocuments(filter);

    const events = await Event.find(filter)
        .sort({ startTime: 1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .populate('createdBy', 'name email');

    const response = new APIResponse(
        HTTP_STATUS.OK,
        {
            events,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
                hasNextPage: page < Math.ceil(totalCount / limit),
                hasPrevPage: page > 1
            }
        },
        'Events retrieved'
    );

    return res.status(HTTP_STATUS.OK).json(response);
});

export const getFeaturedEvents = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 3;
    const events = await Event.getFeaturedEvents(limit);

    return res
        .status(HTTP_STATUS.OK)
        .json(new APIResponse(HTTP_STATUS.OK, { events }, 'Featured events retrieved'));
});

export const getEventById = asyncHandler(async (req, res) => {
    const event = await Event.findOne({
        _id: req.params.id,
        deletedAt: null
    }).populate('createdBy', 'name email');

    if (!event) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.EVENT_NOT_FOUND);
    }

    return res
        .status(HTTP_STATUS.OK)
        .json(new APIResponse(HTTP_STATUS.OK, { event }, 'Event retrieved'));
});


export const updateEvent = asyncHandler(async (req, res) => {
    const allowedUpdates = [
        'title',
        'description',
        'startTime',
        'endTime',
        'venue',
        'maxTeamSize',
        'registrationDeadline',
        'featured',
        'rules',
        'prizes',
        'registrationFee',
        'isActive'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
            updates[key] = req.body[key];
        }
    });

    const event = await Event.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!event) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.EVENT_NOT_FOUND);
    }

    return res
        .status(HTTP_STATUS.OK)
        .json(new APIResponse(HTTP_STATUS.OK, { event }, 'Event updated successfully'));
});


export const deleteEvent = asyncHandler(async (req, res) => {
    const event = await Event.findByIdAndUpdate(
        req.params.id,
        { deletedAt: new Date() },
        { new: true }
    );

    if (!event) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.EVENT_NOT_FOUND);
    }

    return res
        .status(HTTP_STATUS.OK)
        .json(new APIResponse(HTTP_STATUS.OK, {}, 'Event deleted successfully'));
});

export const getEventStats = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);

    if (!event) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.EVENT_NOT_FOUND);
    }

    const totalRegistrations = await Registration.getEventRegistrationCount(event._id);
    const totalAttendees = await Registration.getEventAttendeeCount(event._id);

    return res
        .status(HTTP_STATUS.OK)
        .json(
            new APIResponse(HTTP_STATUS.OK, {
                stats: {
                    eventTitle: event.title,
                    totalRegistrations,
                    totalAttendees,
                    registrationRate: totalRegistrations > 0
                        ? ((totalAttendees / totalRegistrations) * 100).toFixed(2) + '%'
                        : '0%'
                }
            }, 'Event statistics retrieved')
        );
});
