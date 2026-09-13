import { Router } from 'express';
import * as contactController from '../controllers/contact.controller.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';

const router = Router();


router.post('/submit', contactController.submitContactMessage);


router.get(
    '/messages',
    authenticate,
    checkRole(['super-admin', 'content-lead', 'media-lead']),
    contactController.getAllMessages
);

router.get(
    '/unseen-count',
    authenticate,
    checkRole(['super-admin', 'content-lead', 'media-lead']),
    contactController.getUnseenCount
);

router.patch(
    '/messages/:id/read',
    authenticate,
    checkRole(['super-admin', 'content-lead', 'media-lead']),
    contactController.toggleMessageRead
);

router.delete(
    '/messages/:id',
    authenticate,
    checkRole(['super-admin']),
    contactController.deleteMessage
);

export default router;
