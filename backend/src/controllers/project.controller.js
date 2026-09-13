import { Project } from '../models/project.model.js';
import APIResponse from '../utils/APIResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../constants/index.js';


export const createProject = asyncHandler(async (req, res) => {
    const { title, description, modelUrl, credits, isActive } = req.body;

    if (!title || !description) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Title and description are required.");
    }

    const project = await Project.create({
        title,
        description,
        modelUrl: modelUrl || '/models/placeholder.glb',
        credits: credits || '',
        isActive: isActive !== undefined ? isActive : true
    });

    return res.status(HTTP_STATUS.CREATED).json(
        new APIResponse(HTTP_STATUS.CREATED, { project }, "Project created successfully")
    );
});


export const getActiveProjects = asyncHandler(async (req, res) => {
    const projects = await Project.find({ isActive: true }).sort({ createdAt: -1 });
    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { projects }, "Active projects fetched successfully")
    );
});


export const getAllProjects = asyncHandler(async (req, res) => {
    const projects = await Project.find().sort({ createdAt: -1 });
    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { projects }, "All projects fetched successfully")
    );
});


export const updateProject = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const project = await Project.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true, runValidators: true }
    );

    if (!project) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, "Project not found");
    }

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { project }, "Project updated successfully")
    );
});


export const deleteProject = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const project = await Project.findByIdAndDelete(id);

    if (!project) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, "Project not found");
    }

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, null, "Project deleted successfully")
    );
});
