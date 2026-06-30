import { Router } from 'express';
import {
    uploadImage,
    getSectionImages,
    updateSectionImage,
    deleteSectionImage
} from '../controllers/upload.controller.js';
import { uploadSingle } from '../middleware/upload.middleware.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';

const router = Router();

// Upload image to ImageKit (Media Management)
router.post(
    '/image',
    authenticate,
    checkRole(['super-admin', 'media-lead']),
    uploadSingle('image'),
    uploadImage
);

// General file upload for registrations
router.post(
    '/file',
    authenticate,
    uploadSingle('file'),
    uploadImage
);

// Section image management
router.get('/sections', getSectionImages); // Public

router.post(
    '/sections',
    authenticate,
    checkRole(['super-admin', 'media-lead']),
    updateSectionImage
);

router.delete(
    '/sections/:sectionKey',
    authenticate,
    checkRole(['super-admin', 'media-lead']),
    deleteSectionImage
);

export default router;