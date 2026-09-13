import { Router } from 'express';
import * as controller from '../controllers/departmentalRegistration.controller.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';

const router = Router();
router.post('/', controller.createDepartmentalRegistration);
router.post('/scan', authenticate, checkRole(['super-admin', 'event-lead', 'content-lead', 'media-lead']), controller.scanDepartmentalRegistration);
router.get('/:eventId', authenticate, checkRole(['super-admin', 'event-lead', 'content-lead', 'media-lead']), controller.listDepartmentalRegistrations);
export default router;
