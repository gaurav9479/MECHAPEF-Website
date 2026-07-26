import Contact from '../models/contact.model.js';
import APIResponse from '../utils/APIResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../constants/index.js';

// ── Public: Submit contact form message ──────────────────────────────────────
export const submitContactMessage = asyncHandler(async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Please provide name, email, and message');
    }

    const contact = new Contact({
        name,
        email,
        message
    });

    await contact.save();

    return res.status(HTTP_STATUS.CREATED).json(
        new APIResponse(HTTP_STATUS.CREATED, { contact }, 'Message sent successfully! We will get back to you soon.')
    );
});

// ── Admin: Get all messages ──────────────────────────────────────────────────
export const getAllMessages = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, isRead } = req.query;

    const filter = { deletedAt: null };
    if (isRead !== undefined) {
        filter.isRead = isRead === 'true';
    }

    const [messages, totalCount, unseenCount] = await Promise.all([
        Contact.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit)),
        Contact.countDocuments(filter),
        Contact.countDocuments({ deletedAt: null, isRead: false })
    ]);

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, {
            messages,
            unseenCount,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalCount,
                totalPages: Math.ceil(totalCount / parseInt(limit))
            }
        }, 'Messages retrieved successfully')
    );
});

// ── Admin: Get unseen message count ─────────────────────────────────────────
export const getUnseenCount = asyncHandler(async (req, res) => {
    const unseenCount = await Contact.countDocuments({ deletedAt: null, isRead: false });

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { unseenCount }, 'Unseen count retrieved')
    );
});

// ── Admin: Toggle read/unread status ─────────────────────────────────────────
export const toggleMessageRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isRead } = req.body;

    const message = await Contact.findOne({ _id: id, deletedAt: null });

    if (!message) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Message not found');
    }

    message.isRead = isRead !== undefined ? isRead : !message.isRead;
    await message.save();

    const unseenCount = await Contact.countDocuments({ deletedAt: null, isRead: false });

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { message, unseenCount }, `Message marked as ${message.isRead ? 'read' : 'unread'}`)
    );
});

// ── Admin: Soft delete message ───────────────────────────────────────────────
export const deleteMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const message = await Contact.findOne({ _id: id, deletedAt: null });

    if (!message) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Message not found');
    }

    message.deletedAt = new Date();
    await message.save();

    const unseenCount = await Contact.countDocuments({ deletedAt: null, isRead: false });

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { unseenCount }, 'Message deleted successfully')
    );
});
