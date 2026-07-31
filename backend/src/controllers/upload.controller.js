import ImageKit from 'imagekit';
import fs from 'fs';
import path from 'path';
import asyncHandler from '../utils/asyncHandler.js';
import APIResponse from '../utils/APIResponse.js';
import ApiError from '../utils/ApiError.js';
import SectionImage from '../models/sectionImage.model.js';
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
    const { device } = req.query;
    let filter = {};
    
    if (device === 'mobile') {
        // Mobile needs team images and mobile gallery (_mob)
        filter = { sectionKey: { $regex: /_mob$|^team_/ } };
    } else if (device === 'desktop') {
        // Desktop needs team images and desktop gallery (no _mob)
        filter = { sectionKey: { $not: /_mob$/ } };
    }

    const images = await SectionImage.find(filter).sort({ sectionKey: 1 });
    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { images }, 'Section images fetched')
    );
});

// ── Update a section image ───────────────────────────────────────────────────
export const updateSectionImage = asyncHandler(async (req, res) => {
    const { sectionKey, label, imageURL, imagekitFileId, name, regNo, order } = req.body;
    if (!sectionKey) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'sectionKey is required');

    const existingImage = await SectionImage.findOne({ sectionKey });
    const oldOrder = existingImage ? existingImage.order : 0;
    const newOrder = order !== undefined ? Number(order) : oldOrder;

    if (existingImage && newOrder !== oldOrder && sectionKey.startsWith('team_')) {
        const prefix = sectionKey.split('_').slice(0, 2).join('_');
        const conflict = await SectionImage.findOne({ 
            sectionKey: { $regex: `^${prefix}_` },
            order: newOrder
        });

        if (conflict) {
            conflict.order = oldOrder;
            await conflict.save();
        }
    }

    const updateData = { sectionKey, label: label || sectionKey, updatedBy: req.user?.userId || null };
    if (imageURL !== undefined) updateData.imageURL = imageURL;
    if (imagekitFileId !== undefined) updateData.imagekitFileId = imagekitFileId;
    if (name !== undefined) updateData.name = name;
    if (regNo !== undefined) updateData.regNo = regNo;
    if (order !== undefined) updateData.order = newOrder;

    const image = await SectionImage.findOneAndUpdate(
        { sectionKey },
        updateData,
        { new: true, upsert: true, runValidators: true }
    );

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { image }, 'Section image updated')
    );
});

// ── Delete a section image ───────────────────────────────────────────────────
export const deleteSectionImage = asyncHandler(async (req, res) => {
    const { sectionKey } = req.params;
    if (!sectionKey) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'sectionKey is required');

    const image = await SectionImage.findOneAndUpdate(
        { sectionKey },
        { imageURL: null, imagekitFileId: null, updatedBy: req.user?.userId || null },
        { new: true }
    );

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { image }, 'Section image removed')
    );
});
