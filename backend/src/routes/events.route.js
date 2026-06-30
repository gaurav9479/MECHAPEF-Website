import { Router } from 'express';
import * as eventController from '../controllers/event.controller.js';
import * as registrationController from '../controllers/registration.controller.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';
// import { limiter } from '../middleware/security.middleware.js';

const router = Router();

// Public routes
router.get('/', eventController.getAllEvents);
router.get('/featured', eventController.getFeaturedEvents);
router.get('/:id', eventController.getEventById);

// Content Management Routes
router.post(
    '/',
    authenticate,
    checkRole(['super-admin', 'content-lead']),
    eventController.createEvent
);

router.put(
    '/:id',
    authenticate,
    checkRole(['super-admin', 'content-lead']),
    eventController.updateEvent
);

router.delete(
    '/:id',
    authenticate,
    checkRole(['super-admin']),
    eventController.deleteEvent
);

router.patch(
    '/:id/end',
    authenticate,
    checkRole(['super-admin', 'content-lead']),
    eventController.endEvent
);

router.delete(
    '/:id/wipe-data',
    authenticate,
    checkRole(['super-admin']),
    eventController.wipeEventData
);

router.get(
    '/:id/stats',
    authenticate,
    checkRole(['super-admin', 'content-lead']),
    eventController.getEventStats
);

// Event Registration Routes
router.post(
    '/:eventId/register',
    authenticate,
    registrationController.registerForEvent
);

router.get(
    '/:eventId/registrations',
    authenticate,
    checkRole(['super-admin', 'content-lead']),
    registrationController.getEventRegistrations
);

router.get(
    '/:eventId/registrations/export',
    authenticate,
    checkRole(['super-admin', 'content-lead']),
    registrationController.exportRegistrationsCSV
);

router.put(
    '/:eventId/registrations/:id/attendance',
    authenticate,
    checkRole(['super-admin', 'content-lead']),
    registrationController.markAttendance
);

export default router;