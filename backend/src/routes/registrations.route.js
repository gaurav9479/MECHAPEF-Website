import { Router } from 'express';
import * as registrationController from '../controllers/registration.controller.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';

const router = Router();

// User routes
router.get(
    '/my-registrations',
    authenticate,
    registrationController.getUserRegistrations
);

router.delete(
    '/:id',
    authenticate,
    registrationController.cancelRegistration
);

// Content Management Routes
router.patch(
    '/:id/verify',
    authenticate,
    checkRole(['super-admin', 'content-lead', 'media-lead']),
    registrationController.verifyRegistration
);

export default router;