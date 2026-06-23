import { Router } from 'express';
import * as teamController from '../controllers/team.controller.js';
import { authenticate, checkRole } from '../middleware/auth.js';

const router = Router();

router.get('/', teamController.getAllTeam);
router.post('/', authenticate, checkRole(['SuperAdmin', 'EventHead']), teamController.createTeamMember);
router.put('/:id', authenticate, checkRole(['SuperAdmin', 'EventHead']), teamController.updateTeamMember);
router.delete('/:id', authenticate, checkRole(['SuperAdmin']), teamController.deleteTeamMember);

export default router;
