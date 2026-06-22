import { Router } from 'express';
import * as teamController from '../controllers/teamController.js';

const router = Router();

router.get('/', teamController.getAllTeam);
router.post('/', teamController.createTeamMember);
router.put('/:id', teamController.updateTeamMember);
router.delete('/:id', teamController.deleteTeamMember);

export default router;
