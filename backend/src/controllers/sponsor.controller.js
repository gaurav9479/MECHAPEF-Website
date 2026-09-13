import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import APIResponse from '../utils/APIResponse.js';
import Sponsor from '../models/sponsor.model.js';
import { HTTP_STATUS } from '../constants/index.js';

export const getSponsors = asyncHandler(async (req, res) => {
    const sponsors = await Sponsor.find({ deletedAt: null }).sort({ displayOrder: 1 });
    return res.status(HTTP_STATUS.OK).json(new APIResponse(HTTP_STATUS.OK, { sponsors }, 'Sponsors fetched'));
});

export const createSponsor = asyncHandler(async (req, res) => {
    const { companyName, tier, logoURL, academicYear } = req.body;
    if (!companyName || !tier || !logoURL || !academicYear) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'companyName, tier, logoURL and academicYear are required');
    try {
        const sponsor = await Sponsor.create(req.body);
        return res.status(HTTP_STATUS.CREATED).json(new APIResponse(HTTP_STATUS.CREATED, { sponsor }, 'Sponsor added'));
    } catch (error) {
        if (error.code === 11000) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'A sponsor with this company name already exists.');
        }
        throw error;
    }
});

export const updateSponsor = asyncHandler(async (req, res) => {
    const sponsor = await Sponsor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!sponsor) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Sponsor not found');
    return res.status(HTTP_STATUS.OK).json(new APIResponse(HTTP_STATUS.OK, { sponsor }, 'Updated'));
});

export const deleteSponsor = asyncHandler(async (req, res) => {
    const sponsor = await Sponsor.findByIdAndUpdate(req.params.id, { deletedAt: new Date() }, { new: true });
    if (!sponsor) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Sponsor not found');
    return res.status(HTTP_STATUS.OK).json(new APIResponse(HTTP_STATUS.OK, {}, 'Deleted'));
});
