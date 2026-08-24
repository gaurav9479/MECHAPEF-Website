import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import APIResponse from '../utils/APIResponse.js';
import Magazine from '../models/magazine.model.js';
import { HTTP_STATUS } from '../constants/index.js';


export const getMagazine = asyncHandler(async (req, res) => {
    let magazine = await Magazine.findOne();
    if (!magazine) {

        magazine = await Magazine.create({
            title: "Latest Magazine PDF",
            pdfUrl: null,
            status: "Published"
        });
        /*
        // --- OLD SCHEMA ---
        magazine = await Magazine.create({
            title: "THE MECHAPEF TIMES",
            volumeNumber: "Vol. 1",
            issueNumber: "Issue 1",
            publishDate: new Date().toISOString().split('T')[0],
            status: "Draft",
            categories: ["Mechanical News", "Research", "Robotics", "Manufacturing"]
        });
        */
    }

    return res
        .status(HTTP_STATUS.OK)
        .json(new APIResponse(HTTP_STATUS.OK, { magazine }, 'Magazine data fetched successfully'));
});

/**
 * Update Magazine Data
 * Admin only
 */
export const updateMagazine = asyncHandler(async (req, res) => {
    const data = req.body;
    let magazine = await Magazine.findOne();
    
    if (!magazine) {
        magazine = new Magazine(data);
    } else {
        Object.assign(magazine, data);
    }
    
    await magazine.save();

    return res
        .status(HTTP_STATUS.OK)
        .json(new APIResponse(HTTP_STATUS.OK, { magazine }, 'Magazine updated successfully'));
});
