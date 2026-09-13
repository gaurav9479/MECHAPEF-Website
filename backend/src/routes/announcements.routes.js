import { Router } from 'express';
import * as announcementController from '../controllers/announcement.controller.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';

const router = Router();


router.get('/', announcementController.getAnnouncements);


router.post(
    '/',
    authenticate,
    checkRole(['super-admin', 'content-lead']),
    announcementController.createAnnouncement
);

router.put(
    '/:id',
    authenticate,
    checkRole(['super-admin', 'content-lead']),
    announcementController.updateAnnouncement
);

router.delete(
    '/:id',
    authenticate,
    checkRole(['super-admin', 'content-lead']),
    announcementController.deleteAnnouncement
);

export default router;