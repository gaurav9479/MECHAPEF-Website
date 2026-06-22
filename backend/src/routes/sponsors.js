import { Router } from 'express';
import * as sponsorController from '../controllers/sponsorController.js';

const router = Router();

router.get('/', sponsorController.getSponsors);
router.post('/', sponsorController.createSponsor);
router.put('/:id', sponsorController.updateSponsor);
router.delete('/:id', sponsorController.deleteSponsor);

export default router;
