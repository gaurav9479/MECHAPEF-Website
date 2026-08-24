import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import APIResponse from '../utils/APIResponse.js';
import Team from '../models/team.model.js';
import User from '../models/user.model.js';
import { HTTP_STATUS } from '../constants/index.js';
import logFootprint from '../utils/logFootprint.js';

export const getAllTeam = asyncHandler(async (req, res) => {

    const members = await User.find({
        role: { $ne: 'general-user' },
        isVerified: true,
        deletedAt: null
    })
        .select('name email role yearOfStudy branch collegeRegNo profileImage')
        .sort({ yearOfStudy: -1, name: 1 });

    return res
        .status(HTTP_STATUS.OK)
        .json(new APIResponse(HTTP_STATUS.OK, { members }, 'Team fetched from Users'));
});

export const createTeamMember = asyncHandler(async (req, res) => {
    const {
        name,
        role,
        subTeam,
        yearOfStudy,
        linkedinURL,
        githubURL,
        email,
        bio,
        displayOrder
    } = req.body;

    if (!name || !role || !subTeam) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'name, role and subTeam are required'
        );
    }

    const member = await Team.create({
        name,
        role,
        subTeam,
        yearOfStudy,
        linkedinURL,
        githubURL,
        email,
        bio,
        displayOrder: displayOrder || 0
    });

    logFootprint(req, 'CREATE', 'Team Member', `Added ${member.name} to ${member.role}`);

    return res
        .status(HTTP_STATUS.CREATED)
        .json(new APIResponse(HTTP_STATUS.CREATED, { member }, 'Team member added'));
});

export const updateTeamMember = asyncHandler(async (req, res) => {
    const member = await Team.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    );

    if (!member) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Team member not found');
    }

    return res
        .status(HTTP_STATUS.OK)
        .json(new APIResponse(HTTP_STATUS.OK, { member }, 'Updated'));
});

export const deleteTeamMember = asyncHandler(async (req, res) => {
    const member = await Team.findByIdAndUpdate(
        req.params.id,
        { deletedAt: new Date() },
        { new: true }
    );

    if (!member) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Team member not found');
    }

    return res
        .status(HTTP_STATUS.OK)
        .json(new APIResponse(HTTP_STATUS.OK, {}, 'Deleted'));
});