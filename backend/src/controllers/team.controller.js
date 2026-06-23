import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import APIResponse from '../utils/APIResponse.js';
import Team from '../models/team.model.js';
import { HTTP_STATUS } from '../constants/index.js';

export const getAllTeam = asyncHandler(async (req, res) => {
    const { subTeam, all } = req.query;
    const filter = { deletedAt: null };
    if (!all) filter.isActive = true;
    if (subTeam) filter.subTeam = subTeam;
    const members = await Team.find(filter).sort({ displayOrder: 1 });
    return res.status(HTTP_STATUS.OK).json(new APIResponse(HTTP_STATUS.OK, { members }, 'Team fetched'));
});

export const createTeamMember = asyncHandler(async (req, res) => {
    const { name, role, subTeam, yearOfStudy, linkedinURL, githubURL, email, bio, displayOrder } = req.body;
    if (!name || !role || !subTeam) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'name, role and subTeam are required');
    const member = await Team.create({ name, role, subTeam, yearOfStudy, linkedinURL, githubURL, email, bio, displayOrder: displayOrder || 0 });
    return res.status(HTTP_STATUS.CREATED).json(new APIResponse(HTTP_STATUS.CREATED, { member }, 'Team member added'));
});

export const updateTeamMember = asyncHandler(async (req, res) => {
    const member = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!member) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Team member not found');
    return res.status(HTTP_STATUS.OK).json(new APIResponse(HTTP_STATUS.OK, { member }, 'Updated'));
});

export const deleteTeamMember = asyncHandler(async (req, res) => {
    const member = await Team.findByIdAndUpdate(req.params.id, { deletedAt: new Date() }, { new: true });
    if (!member) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Team member not found');
    return res.status(HTTP_STATUS.OK).json(new APIResponse(HTTP_STATUS.OK, {}, 'Deleted'));
});
