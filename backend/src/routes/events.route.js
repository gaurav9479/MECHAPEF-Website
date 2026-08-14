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

// Event Registration Routes

// User: Check their own registration status for this event
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

// ─────────────────────────────────────────────────────────────
// TYPE 2: JoinRequests Mode Event-level Routes
// ─────────────────────────────────────────────────────────────

// Leader creates a Draft team (Type 2 events only)
router.post(
    '/:eventId/register-draft',
    authenticate,
    registrationController.createDraftTeamRegistration
);

// Search draft teams in this event by leader regNo
router.get(
    '/:eventId/teams',
    authenticate,
    registrationController.searchTeamsForEvent
);

// Check a user's eligibility by their college reg no (used by both Standard invite & Type 2)
router.get(
    '/:eventId/check-user/:regNo',
    authenticate,
    registrationController.checkUserEligibilityForEvent
);

// Get current user's team registration for this event (Draft or Confirmed)
router.get(
    '/:eventId/my-team-registration',
    authenticate,
    registrationController.getMyTeamRegistration
);

// Get full join status for current user in a JoinRequests event
// (covers leader, confirmed member, and outgoing join requester)
router.get(
    '/:eventId/my-join-status',
    authenticate,
    registrationController.getMyJoinStatus
);

export default router;