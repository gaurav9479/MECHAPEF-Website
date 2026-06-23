import User from '../models/user.model.js';
import APIResponse from '../utils/APIResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateTokenPair } from '../utils/jwt.js';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER — Only for GeneralUsers self-registering with college reg no
// SuperAdmin / EventHead / PRTeam / Alumni are pre-seeded — cannot self-register
// ─────────────────────────────────────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
    const { name, email, password, collegeRegNo, yearOfStudy, branch, phoneNumber } = req.body;

    // Required fields validation
    if (!name || !email || !password) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Name, email, and password are required');
    }

    if (!collegeRegNo) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'College registration number is required for registration');
    }

    // Enforce MNNIT email format: firstname.regno@mnnit.ac.in
    const mnnitEmailRegex = /^[a-z]+\.[0-9]+@mnnit\.ac\.in$/;
    if (!mnnitEmailRegex.test(email.toLowerCase())) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Only MNNIT emails are allowed. Format: firstname.regno@mnnit.ac.in');
    }

    // Extract regno from email and verify it matches the collegeRegNo field
    const regnoFromEmail = email.toLowerCase().split('.')[1].split('@')[0];
    if (regnoFromEmail !== collegeRegNo.toLowerCase()) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'College registration number must match the one in your email address');
    }

    // Block privileged roles from self-registering
    if (req.body.role && req.body.role !== 'GeneralUser') {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Privileged roles cannot be self-registered. Contact the SuperAdmin.');
    }

    // Check duplicate email
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
        throw new ApiError(HTTP_STATUS.CONFLICT, ERROR_MESSAGES.EMAIL_EXISTS);
    }

    // Check duplicate collegeRegNo
    const existingRegNo = await User.findOne({ collegeRegNo: collegeRegNo.toUpperCase() });
    if (existingRegNo) {
        throw new ApiError(HTTP_STATUS.CONFLICT, 'This college registration number is already registered');
    }

    const newUser = new User({
        name: name.trim(),
        email: email.toLowerCase(),
        password,
        collegeRegNo: collegeRegNo.toUpperCase(),
        role: 'GeneralUser',   // Always GeneralUser for self-registration
        requestedRole: req.body.requestedRole || null,
        isVerified: false,     // Admin must verify before full access
        unverifiedRequestExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Request deleted after 7 days if unverified
        yearOfStudy: yearOfStudy || undefined,
        branch: branch || undefined,
        phoneNumber: phoneNumber || undefined,
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
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(HTTP_STATUS.CREATED).json(
        new APIResponse(HTTP_STATUS.CREATED, {
            user: newUser.getPublicProfile(),
            accessToken: tokens.accessToken,
            // Note: account is pending verification by admin
            message: 'Registration successful! Your account is pending verification by the admin.'
        }, SUCCESS_MESSAGES.USER_CREATED)
    );
});


// ─────────────────────────────────────────────────────────────────────────────
// LOGIN — All roles including pre-seeded admins
// ─────────────────────────────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email and password are required');
    }

    const user = await User.findOne({ email: email.toLowerCase(), deletedAt: null }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Your account has been deactivated. Contact admin.');
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const tokens = generateTokenPair({
        userId: user._id,
        email: user.email,
        role: user.role
    });

    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, {
            user: user.getPublicProfile(),
            accessToken: tokens.accessToken,
        }, SUCCESS_MESSAGES.LOGIN_SUCCESS)
    );
});


// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────────────────────
export const logout = asyncHandler(async (req, res) => {
    res.clearCookie('refreshToken');
    return res.status(HTTP_STATUS.OK).json(new APIResponse(HTTP_STATUS.OK, {}, SUCCESS_MESSAGES.LOGOUT_SUCCESS));
});


// ─────────────────────────────────────────────────────────────────────────────
// GET CURRENT USER
// ─────────────────────────────────────────────────────────────────────────────
export const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.userId);
    if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { user: user.getPublicProfile() }, 'User profile retrieved')
    );
});


// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────────────────────────────────────────
export const updateProfile = asyncHandler(async (req, res) => {
    const allowed = ['name', 'phoneNumber', 'branch', 'yearOfStudy', 'profileImage'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true, runValidators: true });
    if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { user: user.getPublicProfile() }, 'Profile updated successfully')
    );
});


// ─────────────────────────────────────────────────────────────────────────────
// VERIFY USER — SuperAdmin only: mark a user's registration as verified
// ─────────────────────────────────────────────────────────────────────────────
export const verifyUser = asyncHandler(async (req, res) => {
    const isVerified = req.body?.isVerified !== undefined ? req.body.isVerified : true;

    const user = await User.findById(req.params.userId);
    if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');

    if (isVerified) {
        user.isVerified = true;
        user.unverifiedRequestExpiresAt = undefined;
        if (user.requestedRole) {
            user.role = user.requestedRole;
            user.requestedRole = undefined;
        }
    } else {
        user.isVerified = false;
        user.unverifiedRequestExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    await user.save({ validateBeforeSave: false });

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { user: user.getPublicProfile() }, 'User verified successfully')
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE USER ROLE — SuperAdmin only: change any user's role directly
// ─────────────────────────────────────────────────────────────────────────────
export const updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    
    if (!role) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Role is required');

    const user = await User.findById(req.params.userId);
    if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');

    user.role = role;
    await user.save({ validateBeforeSave: false });

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { user: user.getPublicProfile() }, 'User role updated successfully')
    );
});


// ─────────────────────────────────────────────────────────────────────────────
// GET ALL USERS — SuperAdmin only (for admin panel user management)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllUsers = asyncHandler(async (req, res) => {
    const { role, isVerified, page = 1, limit = 20 } = req.query;
    const filter = { deletedAt: null };
    if (role) filter.role = role;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .select('-password -emailVerificationToken -emailVerificationExpiry');

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, {
            users,
            pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) }
        }, 'Users retrieved')
    );
});
