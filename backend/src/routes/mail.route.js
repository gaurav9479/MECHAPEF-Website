import { Router } from 'express';
import { sendMail, getMailStats, retryFailedMails, deleteFailedMails } from '../controllers/mail.controller.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';
import { USER_ROLES } from '../constants/index.js';

const router = Router();

router.post('/send', authenticate, checkRole([USER_ROLES.SUPER_ADMIN]), sendMail);
router.get('/stats', authenticate, checkRole([USER_ROLES.SUPER_ADMIN]), getMailStats);
router.post('/retry-failed', authenticate, checkRole([USER_ROLES.SUPER_ADMIN]), retryFailedMails);
router.post('/delete-failed', authenticate, checkRole([USER_ROLES.SUPER_ADMIN]), deleteFailedMails);

export default router;
