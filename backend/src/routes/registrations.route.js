import { Router } from 'express';
import * as registrationController from '../controllers/registration.controller.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/my-registrations', authenticate, registrationController.getUserRegistrations);
router.delete('/:id', authenticate, registrationController.cancelRegistration);
router.patch('/:id/verify', authenticate, checkRole(['SuperAdmin', 'EventHead']), registrationController.verifyRegistration);

export default router;
