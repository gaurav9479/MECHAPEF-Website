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

// ─────────────────────────────────────────────────────────────
// TYPE 2: JoinRequests Mode Routes
// ─────────────────────────────────────────────────────────────

// Member sends a join request to a draft team
router.post(
    '/:teamRegId/send-join-request',
    authenticate,
    registrationController.sendJoinRequest
);

// Leader responds (Accept/Reject) to a join request
router.post(
    '/:teamRegId/respond-join',
    authenticate,
    registrationController.respondToJoinRequest
);

// Leader directly endorses/adds member by 8-digit Reg No
router.post(
    '/:teamRegId/add-member',
    authenticate,
    registrationController.addMemberByRegNo
);

// Member leaves a draft team or withdraws join request
router.post(
    '/:teamRegId/leave',
    authenticate,
    registrationController.leaveTeam
);

// Leader removes a confirmed member from draft team
router.post(
    '/:teamRegId/remove-member',
    authenticate,
    registrationController.removeTeamMember
);

// Leader (or confirmed member) finalizes Draft → Confirmed
router.post(
    '/:teamRegId/finalize',
    authenticate,
    registrationController.finalizeTeamRegistration
);

// Leader deletes/disbands a draft team before finalization
router.delete(
    '/:teamRegId/draft',
    authenticate,
    registrationController.deleteDraftTeam
);

export default router;