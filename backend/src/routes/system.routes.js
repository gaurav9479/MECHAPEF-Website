import { Router } from 'express';
import { getSystemConfig, updateSystemConfig } from '../controllers/system.controller.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';
import { USER_ROLES } from '../constants/index.js';

const router = Router();

router.get('/config', authenticate, getSystemConfig);
router.put('/config', authenticate, checkRole([USER_ROLES.SUPER_ADMIN]), updateSystemConfig);

export default router;
