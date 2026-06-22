import ImageKit from 'imagekit';
import fs from 'fs';
import path from 'path';
import asyncHandler from '../utils/asyncHandler.js';
import APIResponse from '../utils/APIResponse.js';
import ApiError from '../utils/ApiError.js';
import SectionImage from '../models/SectionImage.js';
import { HTTP_STATUS } from '../constants/index.js';

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// ── Upload image to ImageKit and return URL ──────────────────────────────────
export const uploadImage = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No file uploaded');

    const fileBuffer = fs.readFileSync(req.file.path);
    const fileName = `mechapef_${Date.now()}${path.extname(req.file.originalname)}`;
    const folder = req.body.folder || '/mechapef';

    try {
        const result = await imagekit.upload({
            file: fileBuffer,
            fileName,
            folder,
            useUniqueFileName: true,
        });

        // Cleanup temp file
        fs.unlinkSync(req.file.path);

        return res.status(HTTP_STATUS.OK).json(
            new APIResponse(HTTP_STATUS.OK, {
                url: result.url,
                fileId: result.fileId,
                name: result.name,
                width: result.width,
                height: result.height,
            }, 'Image uploaded successfully')
        );
    } catch (err) {
        if (req.file?.path) fs.unlinkSync(req.file.path);
        throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'ImageKit upload failed: ' + err.message);
    }
});

// ── Get all section images ───────────────────────────────────────────────────
export const getSectionImages = asyncHandler(async (req, res) => {
    const images = await SectionImage.find().sort({ sectionKey: 1 });
    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { images }, 'Section images fetched')
    );
});

// ── Update a section image ───────────────────────────────────────────────────
export const updateSectionImage = asyncHandler(async (req, res) => {
    const { sectionKey, label, imageURL, imagekitFileId } = req.body;
    if (!sectionKey || !imageURL) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'sectionKey and imageURL are required');

    const image = await SectionImage.findOneAndUpdate(
        { sectionKey },
        { sectionKey, label: label || sectionKey, imageURL, imagekitFileId, updatedBy: req.user?.userId || null },
        { new: true, upsert: true, runValidators: true }
    );

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { image }, 'Section image updated')
    );
});
