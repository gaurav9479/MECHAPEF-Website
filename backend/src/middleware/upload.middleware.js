import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/index.js';

const ALLOWED_MIMETYPES = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/quicktime'],
    pdf: ['application/pdf']
};

const ALLOWED_EXTENSIONS = {
    image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    video: ['.mp4', '.mov'],
    pdf: ['.pdf']
};

const MAX_FILE_SIZES = {
    image: 5 * 1024 * 1024, // 5MB
    video: 50 * 1024 * 1024, // 50MB
    pdf: 10 * 1024 * 1024 // 10MB
};


const fileFilter = (req, file, cb) => {
    try {
        const ext = path.extname(file.originalname).toLowerCase();
        let fileType = null;
        for (const [type, mimetypes] of Object.entries(ALLOWED_MIMETYPES)) {
            if (mimetypes.includes(file.mimetype)) {
                fileType = type;
                break;
            }
        }

        if (!fileType || !ALLOWED_EXTENSIONS[fileType].includes(ext)) {
            return cb(new Error(`Invalid file type. Allowed types: ${Object.values(ALLOWED_EXTENSIONS).flat().join(', ')}`));
        }

        if (file.size > MAX_FILE_SIZES[fileType]) {
            return cb(new Error(`File size exceeds maximum limit of ${MAX_FILE_SIZES[fileType] / (1024 * 1024)}MB`));
        }

        cb(null, true);
    } catch (error) {
        cb(error);
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'temp');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});


export const uploadMiddleware = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB overall limit
    }
});


export const uploadSingle = (fieldName = 'file') => {
    return uploadMiddleware.single(fieldName);
};

export const uploadMultiple = (fieldName = 'files', maxFiles = 10) => {
    return uploadMiddleware.array(fieldName, maxFiles);
};


export const uploadMixed = (fields = []) => {
    return uploadMiddleware.fields(fields);
};


export const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
            return sendError(
                res,
                'File too large',
                'Maximum file size is 50MB',
                HTTP_STATUS.BAD_REQUEST
            );
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return sendError(
                res,
                'Too many files',
                'Maximum 10 files allowed',
                HTTP_STATUS.BAD_REQUEST
            );
        }
    }

    if (err) {
        return sendError(
            res,
            'Upload error',
            err.message,
            HTTP_STATUS.BAD_REQUEST
        );
    }

    next();
};


export const cleanupTempFiles = (files) => {
    if (!files) return;

    const fileArray = Array.isArray(files) ? files : [files];
    fileArray.forEach(file => {
        if (file && file.path) {
            try {
                fs.unlinkSync(file.path);
            } catch (error) {
                console.error(`Failed to delete temp file: ${file.path}`, error);
            }
        }
    });
};
