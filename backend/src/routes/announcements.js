import { Router } from 'express';
import * as announcementController from '../controllers/announcement.controller.js';
import { authenticate, checkRole } from '../middleware/auth.js';

const router = Router();

router.get('/', announcementController.getAnnouncements);
router.post('/', authenticate, checkRole(['SuperAdmin', 'EventHead']), announcementController.createAnnouncement);
router.put('/:id', authenticate, checkRole(['SuperAdmin', 'EventHead']), announcementController.updateAnnouncement);
router.delete('/:id', authenticate, checkRole(['SuperAdmin']), announcementController.deleteAnnouncement);

export default router;
