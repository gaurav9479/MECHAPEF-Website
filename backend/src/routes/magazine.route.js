import { Router } from 'express';
import { getMagazine, updateMagazine } from '../controllers/magazine.controller.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', getMagazine);

router.put('/', authenticate, checkRole(['super-admin', 'content-lead', 'media-lead']), updateMagazine);

export default router;
