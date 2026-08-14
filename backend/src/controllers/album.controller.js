import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import APIResponse from '../utils/APIResponse.js';
import Album from '../models/album.model.js';
import { HTTP_STATUS } from '../constants/index.js';
import logFootprint from '../utils/logFootprint.js';

export const getAllAlbums = asyncHandler(async (req, res) => {

    const { all } = req.query;
    const filter = {};
    if (!all) filter.isActive = true;


    const albums = await Album.find(filter).sort({ createdAt: -1 });

    return res.status(HTTP_STATUS.OK).json(new APIResponse(HTTP_STATUS.OK, { albums }, 'Albums fetched successfully'));
});

export const getAlbumById = asyncHandler(async (req, res) => {
    const album = await Album.findById(req.params.id);
    if (!album) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Album not found');
    
    return res.status(HTTP_STATUS.OK).json(new APIResponse(HTTP_STATUS.OK, { album }, 'Album fetched'));
});

export const createAlbum = asyncHandler(async (req, res) => {
    const { title, description, coverImageURL, coverImageKitFileId, isActive } = req.body;
    if (!title) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Album title is required');

    const album = await Album.create({
        title,
        description,
        coverImageURL,
        coverImageKitFileId,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: req.user?.userId
    });

    logFootprint(req, 'CREATE', 'Album', `Created album: ${album.title}`);

    return res.status(HTTP_STATUS.CREATED).json(new APIResponse(HTTP_STATUS.CREATED, { album }, 'Album created'));
});

export const updateAlbum = asyncHandler(async (req, res) => {
    const { title, description, coverImageURL, coverImageKitFileId, isActive } = req.body;
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (coverImageURL !== undefined) updateData.coverImageURL = coverImageURL;
    if (coverImageKitFileId !== undefined) updateData.coverImageKitFileId = coverImageKitFileId;
    if (isActive !== undefined) updateData.isActive = isActive;

    const album = await Album.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!album) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Album not found');

    logFootprint(req, 'UPDATE', 'Album', `Updated album: ${album.title}`);

    return res.status(HTTP_STATUS.OK).json(new APIResponse(HTTP_STATUS.OK, { album }, 'Album updated'));
});

export const deleteAlbum = asyncHandler(async (req, res) => {
    const album = await Album.findByIdAndDelete(req.params.id);
    if (!album) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Album not found');

    logFootprint(req, 'DELETE', 'Album', `Deleted album: ${album.title}`);


    return res.status(HTTP_STATUS.OK).json(new APIResponse(HTTP_STATUS.OK, {}, 'Album deleted'));
});


export const addImagesToAlbum = asyncHandler(async (req, res) => {
    const { images } = req.body; 
    if (!images || !Array.isArray(images) || images.length === 0) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Please provide an array of images');
    }

    const album = await Album.findById(req.params.id);
    if (!album) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Album not found');

    album.images.push(...images);
    await album.save();

    logFootprint(req, 'UPDATE', 'Album', `Added ${images.length} image(s) to album: ${album.title}`);

    return res.status(HTTP_STATUS.OK).json(new APIResponse(HTTP_STATUS.OK, { album }, 'Images added to album'));
});

// Removing a single image
export const removeImageFromAlbum = asyncHandler(async (req, res) => {
    const { id, imageId } = req.params;

    const album = await Album.findById(id);
    if (!album) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Album not found');

    album.images = album.images.filter(img => img._id.toString() !== imageId);
    await album.save();

    logFootprint(req, 'UPDATE', 'Album', `Removed an image from album: ${album.title}`);

    return res.status(HTTP_STATUS.OK).json(new APIResponse(HTTP_STATUS.OK, { album }, 'Image removed from album'));
});
