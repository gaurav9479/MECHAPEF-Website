import { Router } from 'express';
import { sendMail } from '../controllers/mail.controller.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';
import { USER_ROLES } from '../constants/index.js';

const router = Router();

// Only super admins can use the mail portal
router.post('/send', authenticate, checkRole([USER_ROLES.SUPER_ADMIN]), sendMail);

export default router;
