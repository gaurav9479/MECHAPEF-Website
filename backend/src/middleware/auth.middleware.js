import { verifyAccessToken } from '../utils/jwt.js';
import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';

export const authenticate = async (req, res, next) => {
    try {
        const token =
            req.headers.authorization?.split(' ')[1] ||
            req.cookies?.accessToken;

        if (!token) {
            throw new ApiError(
                HTTP_STATUS.UNAUTHORIZED,
                ERROR_MESSAGES.UNAUTHORIZED
            );
        }

        const decoded = verifyAccessToken(token);

        const user = await User.findById(decoded.userId).select('+isActive +sessionVersion');

        if (!user || !user.isActive) {
            throw new ApiError(
                HTTP_STATUS.UNAUTHORIZED,
                'User not found or inactive'
            );
        }

        if (
            decoded.sessionVersion &&
            decoded.sessionVersion !== user.sessionVersion
        ) {
            throw new ApiError(
                HTTP_STATUS.UNAUTHORIZED,
                'Session expired. You have logged in from another device.'
            );
        }

        req.user = {
            userId: user._id,
            email: user.email,
            role: user.role,
            name: user.name
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(
                new ApiError(
                    HTTP_STATUS.UNAUTHORIZED,
                    ERROR_MESSAGES.TOKEN_EXPIRED
                )
            );
        }

        if (error.name === 'JsonWebTokenError') {
            return next(
                new ApiError(
                    HTTP_STATUS.UNAUTHORIZED,
                    ERROR_MESSAGES.INVALID_TOKEN
                )
            );
        }

        next(
            error instanceof ApiError
                ? error
                : new ApiError(
                      HTTP_STATUS.UNAUTHORIZED,
                      error.message
                  )
        );
    }
};

export const checkRole = (allowedRoles = []) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new ApiError(
                    HTTP_STATUS.UNAUTHORIZED,
                    ERROR_MESSAGES.UNAUTHORIZED
                );
            }

            if (!allowedRoles.includes(req.user.role)) {
                throw new ApiError(
                    HTTP_STATUS.FORBIDDEN,
                    `${ERROR_MESSAGES.FORBIDDEN} Required: ${allowedRoles.join(', ')}`
                );
            }

            next();
        } catch (error) {
            next(
                error instanceof ApiError
                    ? error
                    : new ApiError(
                          HTTP_STATUS.INTERNAL_SERVER_ERROR,
                          error.message
                      )
            );
        }
    };
};

export const optionalAuth = async (req, res, next) => {
    try {
        const token =
            req.headers.authorization?.split(' ')[1] ||
            req.cookies?.accessToken;

        if (token) {
            const decoded = verifyAccessToken(token);
            const user = await User.findById(decoded.userId);

            if (user && user.isActive) {
                req.user = {
                    userId: user._id,
                    email: user.email,
                    role: user.role,
                    name: user.name
                };
            }
        }

        next();
    } catch (error) {
        next();
    }
};

export const verifyOwnership = (resourceField = 'userId') => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new ApiError(
                    HTTP_STATUS.UNAUTHORIZED,
                    ERROR_MESSAGES.UNAUTHORIZED
                );
            }

            const ownerId =
                req.body?.[resourceField] ||
                req.params?.[resourceField];

            // Super Admin can access any resource
            if (req.user.role === 'super-admin') {
                return next();
            }

            if (
                ownerId &&
                req.user.userId.toString() !== ownerId.toString()
            ) {
                throw new ApiError(
                    HTTP_STATUS.FORBIDDEN,
                    ERROR_MESSAGES.FORBIDDEN
                );
            }

            next();
        } catch (error) {
            next(
                error instanceof ApiError
                    ? error
                    : new ApiError(
                          HTTP_STATUS.INTERNAL_SERVER_ERROR,
                          error.message
                      )
            );
        }
    };
};

export const checkRoleHierarchy = (minimumRole) => {
    const roleHierarchy = {
        'super-admin': 5,
        'content-lead': 4,
        'media-lead': 4,
        'member': 2,
        'general-user': 1
    };

    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new ApiError(
                    HTTP_STATUS.UNAUTHORIZED,
                    ERROR_MESSAGES.UNAUTHORIZED
                );
            }

            const userRoleLevel = roleHierarchy[req.user.role] || 0;
            const minimumRoleLevel = roleHierarchy[minimumRole] || 0;

            if (userRoleLevel < minimumRoleLevel) {
                throw new ApiError(
                    HTTP_STATUS.FORBIDDEN,
                    `This action requires at least ${minimumRole} privileges`
                );
            }

            next();
        } catch (error) {
            next(
                error instanceof ApiError
                    ? error
                    : new ApiError(
                          HTTP_STATUS.INTERNAL_SERVER_ERROR,
                          error.message
                      )
            );
        }
    };
};