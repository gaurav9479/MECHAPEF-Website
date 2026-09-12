import { Router } from 'express';
import * as eventController from '../controllers/event.controller.js';
import * as registrationController from '../controllers/registration.controller.js';
import * as liveEventController from '../controllers/liveEvent.controller.js';
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

// Live Interactive Voting Routes (Type 2)
router.get('/live/active', liveEventController.getActiveLiveQuestions);
router.get('/:eventId/live/poll/:questionId', liveEventController.getLivePollDetails);
router.post('/:eventId/live/vote', liveEventController.submitLiveVote);
router.get('/:eventId/live/results', liveEventController.getLiveResults);
router.get('/:eventId/live/status', authenticate, liveEventController.getLiveVoteStatus);
router.post(
    '/:eventId/live/reset',
    authenticate,
    checkRole(['super-admin', 'content-lead']),
    liveEventController.resetLivePoll
);
router.post(
    '/:eventId/live/save-highlight',
    authenticate,
    checkRole(['super-admin', 'content-lead']),
    liveEventController.savePollToHighlights
);
router.delete(
    '/:eventId/live/highlights/:highlightId',
    authenticate,
    checkRole(['super-admin', 'content-lead']),
    liveEventController.deleteHighlight
);

router.post(
    '/:eventId/live/admin/poll',
    authenticate,
    checkRole(['super-admin', 'event-lead', 'content-lead']),
    liveEventController.broadcastQuestion
);
router.post(
    '/:eventId/live/broadcast',
    authenticate,
    checkRole(['super-admin', 'event-lead']),
    liveEventController.broadcastQuestion
);
router.post(
    '/:eventId/live/submissions/toggle',
    authenticate,
    checkRole(['super-admin', 'event-lead']),
    liveEventController.toggleSubmissions
);
router.post(
    '/:eventId/live/reset-session',
    authenticate,
    checkRole(['super-admin', 'event-lead']),
    liveEventController.resetLiveSession
);
router.put(
    '/:eventId/registrations/by-college-reg-no/:collegeRegNo/attendance',
    authenticate,
    checkRole(['super-admin', 'content-lead', 'media-lead']),
    registrationController.markAttendanceByCollegeRegNo
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