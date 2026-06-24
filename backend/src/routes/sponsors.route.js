import { Router } from 'express';
import * as sponsorController from '../controllers/sponsor.controller.js';
import * as configController from '../controllers/sponsorConfig.controller.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/config', configController.getConfig);
router.put('/config', authenticate, checkRole(['SuperAdmin', 'EventHead']), configController.updateConfig);

router.get('/', sponsorController.getSponsors);
router.post('/', authenticate, checkRole(['SuperAdmin', 'EventHead']), sponsorController.createSponsor);
router.put('/:id', authenticate, checkRole(['SuperAdmin', 'EventHead']), sponsorController.updateSponsor);
router.delete('/:id', authenticate, checkRole(['SuperAdmin']), sponsorController.deleteSponsor);

export default router;
