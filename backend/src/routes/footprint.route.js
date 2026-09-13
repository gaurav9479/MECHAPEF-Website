import { Router } from 'express';
import { getFootprints } from '../controllers/footprint.controller.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';
import { USER_ROLES } from '../constants/index.js';

const router = Router();

router.get('/', authenticate, checkRole([USER_ROLES.SUPER_ADMIN]), getFootprints);

export default router;
