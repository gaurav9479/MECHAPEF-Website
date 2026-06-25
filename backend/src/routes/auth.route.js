import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/profile', authenticate, authController.updateProfile);

// SuperAdmin-only routes
router.get('/users', authenticate, checkRole(['SuperAdmin']), authController.getAllUsers);
router.patch('/users/:userId/verify', authenticate, checkRole(['SuperAdmin']), authController.verifyUser);
router.patch('/users/:userId/role', authenticate, checkRole(['SuperAdmin']), authController.updateUserRole);

export default router;
