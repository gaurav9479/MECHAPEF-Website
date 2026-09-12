import { Router } from 'express';
import * as registrationController from '../controllers/registration.controller.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';

const router = Router();

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

router.patch(
    '/:id/verify',
    authenticate,
    checkRole(['super-admin', 'content-lead', 'media-lead']),
    registrationController.verifyRegistration
);

router.post(
    '/:teamRegId/send-join-request',
    authenticate,
    registrationController.sendJoinRequest
);

router.post(
    '/:teamRegId/respond-join',
    authenticate,
    registrationController.respondToJoinRequest
);

router.post(
    '/:teamRegId/add-member',
    authenticate,
    registrationController.addMemberByRegNo
);

router.post(
    '/:teamRegId/leave',
    authenticate,
    registrationController.leaveTeam
);

router.post(
    '/:teamRegId/remove-member',
    authenticate,
    registrationController.removeTeamMember
);

router.post(
    '/:teamRegId/finalize',
    authenticate,
    registrationController.finalizeTeamRegistration
);

router.delete(
    '/:teamRegId/draft',
    authenticate,
    registrationController.deleteDraftTeam
);

export default router;