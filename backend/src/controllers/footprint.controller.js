import asyncHandler from '../utils/asyncHandler.js';
import APIResponse from '../utils/APIResponse.js';
import Footprint from '../models/footprint.model.js';
import { HTTP_STATUS } from '../constants/index.js';

export const getFootprints = asyncHandler(async (req, res) => {
    // Optional pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const startIndex = (page - 1) * limit;

    const total = await Footprint.countDocuments();
    
    const footprints = await Footprint.find()
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit)
        .lean();

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(
            HTTP_STATUS.OK,
            { footprints, total, page, limit },
            'Footprints retrieved successfully'
        )
    );
});
