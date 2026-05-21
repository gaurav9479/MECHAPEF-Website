import { Router } from 'express';
import * as registrationController from '../controllers/registrationController.js';
import { authenticate, checkRole } from '../middleware/auth.js';

const router = Router();

router.get('/my-registrations', authenticate, registrationController.getUserRegistrations);
router.delete('/:id', authenticate, registrationController.cancelRegistration);

export default router;
