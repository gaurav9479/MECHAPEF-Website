import { Router } from 'express';
import { 
  getActiveSpecialSponsor, 
  upsertSpecialSponsor, 
  deleteSpecialSponsor 
} from '../controllers/specialSponsor.controller.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/active', getActiveSpecialSponsor);

router.use(authenticate);
router.use(checkRole(['super-admin', 'media-lead']));

router.post('/', upsertSpecialSponsor);
router.delete('/', deleteSpecialSponsor);

export default router;
