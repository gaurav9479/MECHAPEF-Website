import { Router } from 'express';
import { uploadImage, getSectionImages, updateSectionImage, deleteSectionImage } from '../controllers/upload.controller.js';
import { uploadSingle } from '../middleware/upload.middleware.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';

const router = Router();

// Upload image to ImageKit (EventHead+ only)
router.post('/image', authenticate, checkRole(['SuperAdmin', 'EventHead']), uploadSingle('image'), uploadImage);

// General file upload for registrations
router.post('/file', authenticate, uploadSingle('file'), uploadImage);

// Section image management
router.get('/sections', getSectionImages); // public — frontend reads these
router.post('/sections', authenticate, checkRole(['SuperAdmin', 'EventHead']), updateSectionImage);
router.delete('/sections/:sectionKey', authenticate, checkRole(['SuperAdmin', 'EventHead']), deleteSectionImage);

export default router;
