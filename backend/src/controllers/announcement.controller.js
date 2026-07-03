import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import APIResponse from '../utils/APIResponse.js';
import Announcement from '../models/announcement.model.js';
import User from '../models/user.model.js';
import logFootprint from '../utils/logFootprint.js';

import { HTTP_STATUS } from '../constants/index.js';

export const getAnnouncements = asyncHandler(async (req, res) => {
    const announcements = await Announcement.find({ deletedAt: null }).sort({ priority: -1, displayOrder: 1 });
    return res.status(HTTP_STATUS.OK).json(new APIResponse(HTTP_STATUS.OK, { announcements }, 'Announcements fetched'));
});

export const createAnnouncement = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    if (!title || !description) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'title and description are required');
    // createdBy is required by schema — for testing, use a dummy ObjectId
    const createdBy = req.user?.userId || '000000000000000000000000';
    const item = await Announcement.create({ ...req.body, createdBy });

    // Auto-email has been moved to a dedicated Mail portal for Super Admins
    logFootprint(req, 'CREATE', 'Announcement', `Created announcement: ${item.title}`);

    return res.status(HTTP_STATUS.CREATED).json(new APIResponse(HTTP_STATUS.CREATED, { item }, 'Announcement created'));
});

export const updateAnnouncement = asyncHandler(async (req, res) => {
    const item = await Announcement.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!item) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Announcement not found');
    }

    logFootprint(req, 'UPDATE', 'Announcement', `Updated announcement: ${item.title}`);

    return res.status(HTTP_STATUS.OK).json(new APIResponse(HTTP_STATUS.OK, { item }, 'Announcement updated'));
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
    const item = await Announcement.findByIdAndUpdate(req.params.id, { deletedAt: new Date() }, { new: true });
    if (!item) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Announcement not found');
    
    logFootprint(req, 'DELETE', 'Announcement', `Deleted announcement: ${item.title}`);
    
    return res.status(HTTP_STATUS.OK).json(new APIResponse(HTTP_STATUS.OK, {}, 'Deleted'));
});
