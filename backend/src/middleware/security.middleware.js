import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import ApiError from '../utils/ApiError.js';
import APIResponse from '../utils/APIResponse.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';
import { sendError } from '../utils/response.js';


export const corsConfig = cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 3600
});

export const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"]
        }
    },
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    frameguard: {
        action: 'deny'
    },
    referrerPolicy: {
        policy: 'no-referrer'
    }
});


// export const generalLimiter = rateLimit({
//     windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
//     max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
//     message: 'Too many requests from this IP, please try again later.',
//     standardHeaders: true, 
//     legacyHeaders: false, 
//     skip: (req) => process.env.NODE_ENV === 'development'
// });

// export const authLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, 
//     max: 5, 
//     message: 'Too many authentication attempts, please try again later.',
//     skipSuccessfulRequests: true, 
//     standardHeaders: true,
//     legacyHeaders: false
// });


// export const publicLimiter = rateLimit({
//     windowMs: 60 * 1000, 
//     max: 30,
//     standardHeaders: true,
//     legacyHeaders: false
// });


export const errorHandler = (err, req, res, next) => {
    let error = err;

    console.error('❌ Error:', {
        message: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        statusCode: error.statusCode
    });

    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors)
            .map(e => e.message)
            .join(', ');
        error = new ApiError(HTTP_STATUS.BAD_REQUEST, messages);
    }

    if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
        error = new ApiError(HTTP_STATUS.CONFLICT, message);
    }

    if (error.name === 'CastError') {
        error = new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid ID format');
    }
    if (error.name === 'TokenExpiredError') {
        error = new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.TOKEN_EXPIRED);
    }

    if (error.name === 'JsonWebTokenError') {
        error = new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_TOKEN);
    }

    if (!(error instanceof ApiError)) {
        error = new ApiError(
            error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
            error.message || ERROR_MESSAGES.SERVER_ERROR
        );
    }

    return res.status(error.statusCode).json({
        statusCode: error.statusCode,
        message: error.message,
        errors: error.errors,
        success: error.success,
        data: error.data,
        timestamp: new Date().toISOString()
    });
};


export const notFoundHandler = (req, res) => {
    sendError(
        res,
        ERROR_MESSAGES.NOT_FOUND,
        `Route ${req.method} ${req.path} not found`,
        HTTP_STATUS.NOT_FOUND
    );
};

export const requestLogger = (req, res, next) => {
    // Ignore health check routes to prevent log spam
    if (req.path === '/health' || req.path === '/api/health') {
        return next();
    }

    const start = Date.now();

    console.log(`📨 ${req.method} ${req.path}`, {
        ip: req.ip,
        userId: req.user?.userId
    });

    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`📤 ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });

    next();
};

export const cookieParserConfig = cookieParser();


export const bodyParserConfig = {
    limit: '10mb',
    type: 'application/json'
};

export const trustProxy = (app) => {
    if (process.env.NODE_ENV === 'production') {
        app.set('trust proxy', 1);
    }
};
