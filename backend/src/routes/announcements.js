import { Router } from 'express';
import * as announcementController from '../controllers/announcementController.js';

const router = Router();

router.get('/', announcementController.getAnnouncements);
router.post('/', announcementController.createAnnouncement);
router.put('/:id', announcementController.updateAnnouncement);
router.delete('/:id', announcementController.deleteAnnouncement);

export default router;
