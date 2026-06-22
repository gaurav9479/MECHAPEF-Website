import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate, checkRole } from '../middleware/auth.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/profile', authenticate, authController.updateProfile);

// SuperAdmin-only routes
router.get('/users', authenticate, checkRole(['SuperAdmin']), authController.getAllUsers);
router.put('/users/:userId/verify', authenticate, checkRole(['SuperAdmin']), authController.verifyUser);

export default router;
