import User from '../models/user.model.js';
import APIResponse from '../utils/APIResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateTokenPair } from '../utils/jwt.js';
import sendEmail from '../utils/sendEmail.js';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/index.js';
import crypto from 'crypto';

const PASSWORD_RESET_SUCCESS_MESSAGE = 'If an account with that email exists, a password reset link has been sent.';
const PASSWORD_RESET_EXPIRY_MS = 15 * 60 * 1000;

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
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Wrong credential');
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
        role: newUser.role,
        sessionVersion: newUser.sessionVersion
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

    if (!user) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User does not exist');
    }

    if (!(await user.comparePassword(password))) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Incorrect password');
    }

    if (!user.isActive) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Your account has been deactivated. Contact admin.');
    }

    user.lastLogin = new Date();
    user.sessionVersion = (user.sessionVersion || 1) + 1;
    await user.save({ validateBeforeSave: false });

    const tokens = generateTokenPair({
        userId: user._id,
        email: user.email,
        role: user.role,
        sessionVersion: user.sessionVersion
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
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email is required');
    }

    const user = await User.findOne({ email: email.toLowerCase(), deletedAt: null });

    if (!user) {
        return res.status(HTTP_STATUS.OK).json(
            new APIResponse(HTTP_STATUS.OK, {}, PASSWORD_RESET_SUCCESS_MESSAGE)
        );
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN?.split(',')[0]?.trim() || 'http://localhost:5173';
    const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password/${resetToken}`;

    try {
        await sendEmail({
            to: user.email,
            subject: 'Reset your MechaPEF password',
            text: `Reset your password using this link: ${resetUrl}\n\nThis link expires in 15 minutes. If you did not request this, you can ignore this email.`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
                    <h2>Reset your MechaPEF password</h2>
                    <p>Use the button below to reset your password. This link expires in 15 minutes.</p>
                    <p>
                        <a href="${resetUrl}" style="display: inline-block; padding: 12px 18px; background: #ff0000; color: #fff; text-decoration: none; border-radius: 6px;">
                            Reset Password
                        </a>
                    </p>
                    <p>If the button does not work, copy and paste this link into your browser:</p>
                    <p>${resetUrl}</p>
                    <p>If you did not request this, you can ignore this email.</p>
                </div>
            `
        });
    } catch {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Password reset email could not be sent');
    }

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, {}, PASSWORD_RESET_SUCCESS_MESSAGE)
    );
});

export const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Token and password are required');
    }

    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: new Date() },
        deletedAt: null
    }).select('+password +resetPasswordToken +resetPasswordExpire');

    if (!user) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Password reset token is invalid or has expired');
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.sessionVersion = (user.sessionVersion || 1) + 1;
    await user.save();

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, {}, 'Password reset successful. You can now sign in.')
    );
});

export const logout = asyncHandler(async (req, res) => {
    if (req.user && req.user.userId) {
        const user = await User.findById(req.user.userId);
        if (user) {
            user.sessionVersion = (user.sessionVersion || 1) + 1;
            await user.save({ validateBeforeSave: false });
        }
    }
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
    const allowed = ['name', 'phoneNumber', 'branch', 'yearOfStudy', 'profileImage', 'githubURL', 'linkedinURL', 'otherLinks'];
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

// ─────────────────────────────────────────────────────────────────────────────
// MICROSOFT OAUTH2 LOGIN
// ─────────────────────────────────────────────────────────────────────────────
export const getMicrosoftAuthUrl = asyncHandler(async (req, res) => {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI || (process.env.NODE_ENV === 'production' 
        ? 'https://mechapef-website.vercel.app/login' 
        : 'http://localhost:5173/login');

    const scope = 'openid profile email User.Read';
    
    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=${encodeURIComponent(scope)}`;

    return res.status(200).json(
        new APIResponse(200, { url: authUrl }, 'Microsoft OAuth URL generated')
    );
});

export const microsoftLoginCallback = asyncHandler(async (req, res) => {
    const { code } = req.body;
    
    if (!code) {
        throw new ApiError(400, 'Authorization code is required');
    }

    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI || (process.env.NODE_ENV === 'production' 
        ? 'https://mechapef-website.vercel.app/login' 
        : 'http://localhost:5173/login');

    const tokenParams = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
    });

    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams.toString()
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
        throw new ApiError(401, 'Failed to exchange authorization code for tokens');
    }

    const profileResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });

    const profileData = await profileResponse.json();

    if (!profileResponse.ok) {
        throw new ApiError(401, 'Failed to fetch user profile from Microsoft');
    }

    const email = profileData.userPrincipalName || profileData.mail;
    const name = profileData.displayName;

    if (!email || !email.endsWith('@mnnit.ac.in')) {
        throw new ApiError(403, 'Only MNNIT email addresses (@mnnit.ac.in) are allowed');
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        const collegeRegNo = email.split('@')[0].split('.').pop() || email.split('@')[0];
        
        user = new User({
            name,
            email: email.toLowerCase(),
            collegeRegNo: collegeRegNo.toUpperCase(),
            role: 'GeneralUser',
            isVerified: true,
            password: Math.random().toString(36).slice(-10) + 'A1!' 
        });
        await user.save();
    }

    const tokens = generateTokenPair({
        userId: user._id,
        email: user.email,
        role: user.role,
        sessionVersion: user.sessionVersion
    });

    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json(
        new APIResponse(200, {
            user: user.getPublicProfile(),
            accessToken: tokens.accessToken
        }, 'Logged in successfully via Microsoft')
    );
});
