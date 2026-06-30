import { Router } from 'express';
import * as teamController from '../controllers/team.controller.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';

const router = Router();

// Public route
router.get('/', teamController.getAllTeam);

// Content Management Routes
router.post(
    '/',
    authenticate,
    checkRole(['super-admin', 'content-lead']),
    teamController.createTeamMember
);

router.put(
    '/:id',
    authenticate,
    checkRole(['super-admin', 'content-lead']),
    teamController.updateTeamMember
);

router.delete(
    '/:id',
    authenticate,
    checkRole(['super-admin']),
    teamController.deleteTeamMember
);

export default router;