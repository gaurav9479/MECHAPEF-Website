import { Router } from 'express';
import * as controller from '../controllers/departmentalRegistration.controller.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';

const router = Router();
router.post('/', controller.createDepartmentalRegistration);
router.post('/:eventId/endorse', authenticate, checkRole(['super-admin', 'event-lead']), controller.endorseDepartmentalRegistration);
router.post('/:eventId/allowlist', authenticate, checkRole(['super-admin', 'event-lead']), controller.uploadDepartmentalAllowlist);
router.post('/scan', authenticate, checkRole(['super-admin', 'event-lead', 'content-lead', 'media-lead', 'endorsed-volunteer']), controller.scanDepartmentalRegistration);
router.get('/:eventId', authenticate, checkRole(['super-admin', 'event-lead', 'content-lead', 'media-lead']), controller.listDepartmentalRegistrations);
export default router;
