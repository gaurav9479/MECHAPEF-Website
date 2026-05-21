import User from '../models/User.js';
import APIResponse from '../utils/APIResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateTokenPair } from '../utils/jwt.js';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/index.js';

export const register = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Name, email, and password are required'
        );
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        throw new ApiError(HTTP_STATUS.CONFLICT, ERROR_MESSAGES.EMAIL_EXISTS);
    }
    const newUser = new User({
        name: name.trim(),
        email: email.toLowerCase(),
        password,
        role: role || 'GeneralUser'
    });

    await newUser.save();

    const tokens = generateTokenPair({
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role
    });

    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res
        .status(HTTP_STATUS.CREATED)
        .json(
            new APIResponse(HTTP_STATUS.CREATED, {
                user: newUser.getPublicProfile(),
                tokens
            }, SUCCESS_MESSAGES.USER_CREATED)
        );
});


export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Email and password are required'
        );
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    user.lastLogin = new Date();
    await user.save();

    const tokens = generateTokenPair({
        userId: user._id,
        email: user.email,
        role: user.role
    });
    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res
        .status(HTTP_STATUS.OK)
        .json(
            new APIResponse(HTTP_STATUS.OK, {
                user: user.getPublicProfile(),
                tokens
            }, SUCCESS_MESSAGES.LOGIN_SUCCESS)
        );
});


export const logout = asyncHandler(async (req, res) => {
    res.clearCookie('refreshToken');

    return res
        .status(HTTP_STATUS.OK)
        .json(new APIResponse(HTTP_STATUS.OK, {}, SUCCESS_MESSAGES.LOGOUT_SUCCESS));
});


export const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.userId);

    if (!user) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
    }

    return res
        .status(HTTP_STATUS.OK)
        .json(
            new APIResponse(HTTP_STATUS.OK, { user: user.getPublicProfile() }, 'User profile retrieved')
        );
});


export const updateProfile = asyncHandler(async (req, res) => {
    const { name, phoneNumber, branch, yearOfStudy } = req.body;

    const user = await User.findByIdAndUpdate(
        req.user.userId,
        {
            name: name || undefined,
            phoneNumber: phoneNumber || undefined,
            branch: branch || undefined,
            yearOfStudy: yearOfStudy || undefined
        },
        { new: true, runValidators: true }
    );

    if (!user) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
    }

    return res
        .status(HTTP_STATUS.OK)
        .json(
            new APIResponse(HTTP_STATUS.OK, { user: user.getPublicProfile() }, 'Profile updated successfully')
        );
});
