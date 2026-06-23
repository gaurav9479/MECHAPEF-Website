import { Router } from 'express';
import * as sponsorController from '../controllers/sponsor.controller.js';
import { authenticate, checkRole } from '../middleware/auth.js';

const router = Router();

router.get('/', sponsorController.getSponsors);
router.post('/', authenticate, checkRole(['SuperAdmin', 'EventHead']), sponsorController.createSponsor);
router.put('/:id', authenticate, checkRole(['SuperAdmin', 'EventHead']), sponsorController.updateSponsor);
router.delete('/:id', authenticate, checkRole(['SuperAdmin']), sponsorController.deleteSponsor);

export default router;
