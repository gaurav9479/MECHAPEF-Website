import { Router } from 'express';
import { getMagazine, updateMagazine } from '../controllers/magazine.controller.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';

const router = Router();

// Public route to get magazine data
router.get('/', getMagazine);

// Protected admin route to update magazine data
// Assuming super-admin, content-lead, media-lead can edit
router.put('/', authenticate, checkRole(['super-admin', 'content-lead', 'media-lead']), updateMagazine);

export default router;
