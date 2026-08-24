import { Router } from 'express';
import * as eventController from '../controllers/event.controller.js';
import * as registrationController from '../controllers/registration.controller.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';

const router = Router();


router.get('/', eventController.getAllEvents);
router.get('/featured', eventController.getFeaturedEvents);
router.get('/:id', eventController.getEventById);


router.post(
    '/',
    authenticate,
    checkRole(['super-admin', 'content-lead', 'media-lead']),
    eventController.createEvent
);

router.put(
    '/:id',
    authenticate,
    checkRole(['super-admin', 'content-lead', 'media-lead']),
    eventController.updateEvent
);

router.delete(
    '/:id',
    authenticate,
    checkRole(['super-admin']),
    eventController.deleteEvent
);

router.post(
    '/:id/approve-deletion',
    authenticate,
    checkRole(['super-admin']),
    eventController.approveEventDeletion
);

router.post(
    '/:id/cancel-deletion',
    authenticate,
    checkRole(['super-admin']),
    eventController.cancelEventDeletion
);

router.patch(
    '/:id/end',
    authenticate,
    checkRole(['super-admin', 'content-lead', 'media-lead']),
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
    checkRole(['super-admin', 'content-lead', 'media-lead']),
    eventController.getEventStats
);

router.get(
    '/:id/my-registration',
    authenticate,
    registrationController.getMyRegistrationForEvent
);

router.post(
    '/:eventId/register',
    authenticate,
    registrationController.registerForEvent
);

router.get(
    '/:eventId/registrations',
    authenticate,
    checkRole(['super-admin', 'content-lead', 'media-lead']),
    registrationController.getEventRegistrations
);

router.get(
    '/:eventId/registrations/export',
    authenticate,
    checkRole(['super-admin', 'content-lead', 'media-lead']),
    registrationController.exportRegistrationsCSV
);

router.put(
    '/:eventId/registrations/:id/attendance',
    authenticate,
    checkRole(['super-admin', 'content-lead', 'media-lead']),
    registrationController.markAttendance
);

router.post(
    '/:eventId/register-draft',
    authenticate,
    registrationController.createDraftTeamRegistration
);

router.get(
    '/:eventId/teams',
    authenticate,
    registrationController.searchTeamsForEvent
);

router.get(
    '/:eventId/check-user/:regNo',
    authenticate,
    registrationController.checkUserEligibilityForEvent
);

router.get(
    '/:eventId/my-team-registration',
    authenticate,
    registrationController.getMyTeamRegistration
);

router.get(
    '/:eventId/my-join-status',
    authenticate,
    registrationController.getMyJoinStatus
);

export default router;