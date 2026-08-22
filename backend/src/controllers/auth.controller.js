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

function parseStudentInfoFromRegNo(regNo) {
    if (!regNo || regNo.length < 8) return { branch: undefined, yearOfStudy: undefined };
    
    const enrollmentYear = parseInt(regNo.substring(0, 4), 10);
    const branchCode = regNo.substring(4, 5);
    
    if (isNaN(enrollmentYear)) return { branch: undefined, yearOfStudy: undefined };

    let yearOfStudy = 2027 - enrollmentYear;
    if (yearOfStudy < 1) yearOfStudy = 1;
    if (yearOfStudy > 5) yearOfStudy = 5;

    const branchMap = {
        '0': 'Biotechnology',
        '1': 'Chemical Engineering',
        '2': 'Civil Engineering',
        '3': 'Computer Science and Engineering',
        '4': 'Electronics and Communication Engineering',
        '5': 'Electrical Engineering',
        '6': 'Mechanical Engineering',
        '7': 'Production and Industrial Engineering',
        '8': 'Electronics and Computational Mechanics',
        '9': 'Materials Engineering'
    };

    const branch = branchMap[branchCode];
    return { branch, yearOfStudy };
}

export const register = asyncHandler(async (req, res) => {
    const { name, email, password, phoneNumber } = req.body;

    if (!name || !email || !password) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Name, email, and password are required');
    }

    const mnnitEmailRegex = /^[a-z]+\.[0-9]+@mnnit\.ac\.in$/;
    if (!mnnitEmailRegex.test(email.toLowerCase())) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Only MNNIT emails are allowed. Format: firstname.regno@mnnit.ac.in');
    }

    const regnoFromEmail = email.toLowerCase().split('.')[1].split('@')[0];
    const { branch: parsedBranch, yearOfStudy: parsedYear } = parseStudentInfoFromRegNo(regnoFromEmail);

    if (!parsedBranch || !parsedYear) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Unable to parse branch and year of study from email address');
    }

    if (req.body.role && req.body.role !== 'general-user') {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Privileged roles cannot be self-registered. Contact the SuperAdmin.');
    }

    const [existingEmail, existingRegNo] = await Promise.all([
        User.findOne({ email: email.toLowerCase() }),
        User.findOne({ collegeRegNo: regnoFromEmail.toUpperCase() })
    ]);

    if (existingEmail) {
        throw new ApiError(HTTP_STATUS.CONFLICT, ERROR_MESSAGES.EMAIL_EXISTS);
    }
    if (existingRegNo) {
        throw new ApiError(HTTP_STATUS.CONFLICT, 'This college registration number is already registered');
    }

    const isMechOrProd = parsedBranch && (
        parsedBranch.toLowerCase().includes('mechanical') || 
        parsedBranch.toLowerCase().includes('production') ||
        parsedBranch.toLowerCase().includes('pie')
    );
    const assignedRole = isMechOrProd ? 'member' : 'general-user';

    const newUser = new User({
        name: name.trim(),
        email: email.toLowerCase(),
        password,
        collegeRegNo: regnoFromEmail.toUpperCase(),
        role: assignedRole,
        requestedRole: req.body.requestedRole || null,
        isVerified: false,
        unverifiedRequestExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        yearOfStudy: parsedYear,
        branch: parsedBranch,
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
        maxAge: 14 * 24 * 60 * 60 * 1000
    });

    return res.status(HTTP_STATUS.CREATED).json(
        new APIResponse(HTTP_STATUS.CREATED, {
            user: newUser.getPublicProfile(),
            accessToken: tokens.accessToken,
            message: 'Registration successful! Your account is pending verification by the admin.'
        }, SUCCESS_MESSAGES.USER_CREATED)
    );
});


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
        maxAge: 14 * 24 * 60 * 60 * 1000
    });

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, {
            user: user.getPublicProfile(),
            accessToken: tokens.accessToken,
        }, SUCCESS_MESSAGES.LOGIN_SUCCESS)
    );
});


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
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

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

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

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
        await User.findByIdAndUpdate(req.user.userId, { $inc: { sessionVersion: 1 } });
    }
    res.clearCookie('refreshToken');
    return res.status(HTTP_STATUS.OK).json(new APIResponse(HTTP_STATUS.OK, {}, SUCCESS_MESSAGES.LOGOUT_SUCCESS));
});


export const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.userId).populate('assignedEvent', 'title ticketStages');
    if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { user: user.getPublicProfile() }, 'User profile retrieved')
    );
});


export const updateProfile = asyncHandler(async (req, res) => {
    const allowed = ['name', 'phoneNumber', 'profileImage', 'githubURL', 'linkedinURL', 'otherLinks'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true, runValidators: true });
    if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { user: user.getPublicProfile() }, 'Profile updated successfully')
    );
});


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

export const updateUserRole = asyncHandler(async (req, res) => {
    const { role, assignedEvent, assignedStage } = req.body;

    if (!role) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Role is required');

    const user = await User.findById(req.params.userId);
    if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');

    user.role = role;
    if (assignedEvent !== undefined) user.assignedEvent = assignedEvent || null;
    if (assignedStage !== undefined) user.assignedStage = assignedStage || null;
    await user.save({ validateBeforeSave: false });

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { user: user.getPublicProfile() }, 'User role updated successfully')
    );
});


export const getAllUsers = asyncHandler(async (req, res) => {
    const { role, isVerified, page = 1, limit = 20 } = req.query;
    const filter = { deletedAt: null };
    if (role) filter.role = role;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

    const [total, users] = await Promise.all([
        User.countDocuments(filter),
        User.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .select('-password -emailVerificationToken -emailVerificationExpiry')
    ]);

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, {
            users,
            pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) }
        }, 'Users retrieved')
    );
});


// ─────────────────────────────────────────────────────────────────────────────
// MICROSOFT OAUTH2
// ─────────────────────────────────────────────────────────────────────────────

function base64URLEncode(buffer) {
    return buffer.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

const getAllowedFrontendOrigins = () => {
    const configuredOrigins = [
        process.env.FRONTEND_URL,
        ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : []),
        'http://localhost:5173',
        'http://localhost:3000',
        'https://mechapef-website.vercel.app'
    ].filter(Boolean);

    return [
        ...new Set(
            configuredOrigins
                .map(origin => origin.replace(/\/$/, ''))
                .filter(origin => !origin.startsWith('http://127.0.0.1'))
        )
    ];
};

const getMicrosoftRedirectUri = (req) => {
    const requestedRedirectUri = req.query.redirectUri || req.body.redirectUri;
    if (requestedRedirectUri) {
        try {
            const parsedRedirectUri = new URL(requestedRedirectUri);
            const requestedOrigin = parsedRedirectUri.origin;
            const isAllowedOrigin = getAllowedFrontendOrigins().includes(requestedOrigin);
            const isLoginPath = parsedRedirectUri.pathname === '/login';

            if (isAllowedOrigin && isLoginPath) {
                return requestedRedirectUri;
            }
        } catch {
            throw new ApiError(400, 'Invalid Microsoft redirect URI');
        }
    }

    if (process.env.MICROSOFT_REDIRECT_URI) {
        return process.env.MICROSOFT_REDIRECT_URI;
    }

    const requestOrigin = req.get('origin')?.replace(/\/$/, '');
    if (requestOrigin && getAllowedFrontendOrigins().includes(requestOrigin)) {
        return `${requestOrigin}/login`;
    }

    return process.env.NODE_ENV === 'production'
        ? 'https://mechapef-website.vercel.app/login'
        : 'http://localhost:5173/login';
};

export const getMicrosoftAuthUrl = asyncHandler(async (req, res) => {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
    const redirectUri = getMicrosoftRedirectUri(req);
    const scope = 'openid profile email User.Read';

    const verifier = base64URLEncode(crypto.randomBytes(32));
    const challenge = base64URLEncode(crypto.createHash('sha256').update(verifier).digest());

    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=${encodeURIComponent(scope)}&code_challenge=${challenge}&code_challenge_method=S256`;

    return res.status(200).json(
        new APIResponse(200, {
            url: authUrl,
            code_verifier: verifier,
            clientId,
            tenantId,
            redirectUri,
            scope
        }, 'Microsoft OAuth URL generated')
    );
});

/**
 * Decode the id_token JWT payload without verifying signature.
 * Safe here because we just received it directly from Microsoft's token endpoint
 * over HTTPS — not from user input.
 */
const decodeIdToken = (idToken) => {
    const payload = idToken.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
};

/**
 * Shared login logic for all Microsoft OAuth flows.
 * Uses findOneAndUpdate for a single atomic DB round-trip on existing users.
 */
const issueLoginForMicrosoftProfile = async (profileData, res) => {
    const email = (profileData.userPrincipalName || profileData.mail || profileData.preferred_username)?.toLowerCase();
    const name = profileData.displayName || profileData.name;

    if (!email || !email.endsWith('@mnnit.ac.in')) {
        throw new ApiError(403, 'Only MNNIT email addresses (@mnnit.ac.in) are allowed');
    }

    const collegeRegNo = email.split('@')[0].split('.').pop() || email.split('@')[0];
    const { branch: parsedBranch, yearOfStudy: parsedYear } = parseStudentInfoFromRegNo(collegeRegNo);

    // Atomic update for existing users — single DB round-trip
    let user = await User.findOneAndUpdate(
        { email },
        {
            $set: { lastLogin: new Date() },
            $inc: { sessionVersion: 1 }
        },
        { new: true }
    );

    const isMechOrProd = parsedBranch && (
        parsedBranch.toLowerCase().includes('mechanical') || 
        parsedBranch.toLowerCase().includes('production') ||
        parsedBranch.toLowerCase().includes('pie')
    );

    if (user) {
        let shouldSave = false;
        if (!user.branch && parsedBranch) { user.branch = parsedBranch; shouldSave = true; }
        if (!user.yearOfStudy && parsedYear) { user.yearOfStudy = parsedYear; shouldSave = true; }
        if (user.role === 'general-user' && isMechOrProd) { user.role = 'member'; shouldSave = true; }
        if (shouldSave) await user.save();
    }

    // New user — create them
    if (!user) {
        const assignedRole = isMechOrProd ? 'member' : 'general-user';
        user = await User.create({
            name,
            email,
            collegeRegNo: collegeRegNo.toUpperCase(),
            branch: parsedBranch,
            yearOfStudy: parsedYear,
            role: assignedRole,
            isVerified: true,
            password: Math.random().toString(36).slice(-10) + 'A1!'
        });
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
        maxAge: 14 * 24 * 60 * 60 * 1000
    });

    return {
        user: user.getPublicProfile(),
        accessToken: tokens.accessToken
    };
};

export const microsoftLoginCallback = asyncHandler(async (req, res) => {
    const { code, code_verifier } = req.body;

    if (!code) {
        throw new ApiError(400, 'Authorization code is required');
    }

    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
    const redirectUri = getMicrosoftRedirectUri(req);

    const tokenParams = new URLSearchParams({
        client_id: clientId,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
    });

    if (clientSecret && !code_verifier) {
        tokenParams.append('client_secret', clientSecret);
    }
    if (code_verifier) {
        tokenParams.append('code_verifier', code_verifier);
    }

    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            ...(code_verifier ? { Origin: new URL(redirectUri).origin } : {})
        },
        body: tokenParams.toString()
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
        console.error('[Microsoft OAuth] Token exchange failed:', {
            status: tokenResponse.status,
            error: tokenData.error,
            description: tokenData.error_description,
            redirectUri
        });
        throw new ApiError(
            401,
            tokenData.error_description || tokenData.error || 'Failed to exchange authorization code for tokens'
        );
    }

    // Decode id_token directly — eliminates the Graph API round-trip (~400-800ms saved)
    const profileData = decodeIdToken(tokenData.id_token);

    const loginData = await issueLoginForMicrosoftProfile(profileData, res);

    return res.status(200).json(
        new APIResponse(200, loginData, 'Logged in successfully via Microsoft')
    );
});

export const microsoftTokenLogin = asyncHandler(async (req, res) => {
    const { accessToken } = req.body;

    if (!accessToken) {
        throw new ApiError(400, 'Microsoft access token is required');
    }

    const profileResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const profileData = await profileResponse.json();

    if (!profileResponse.ok) {
        console.error('[Microsoft OAuth] Profile fetch from browser token failed:', {
            status: profileResponse.status,
            error: profileData.error
        });
        throw new ApiError(
            401,
            profileData.error?.message || 'Failed to fetch user profile from Microsoft'
        );
    }

    const loginData = await issueLoginForMicrosoftProfile(profileData, res);

    return res.status(200).json(
        new APIResponse(200, loginData, 'Logged in successfully via Microsoft')
    );
});
