import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';

const router = Router();

const microsoftOnlyAuth = (req, res) => {
    return res.status(403).json({
        success: false,
        message: 'Manual authentication is disabled. Please sign in with Microsoft.'
    });
};

router.post('/register', microsoftOnlyAuth);
router.post('/login', microsoftOnlyAuth);
router.post('/forgot-password', microsoftOnlyAuth);
router.post('/reset-password/:token', microsoftOnlyAuth);

// Microsoft OAuth2
router.get('/microsoft/url', authController.getMicrosoftAuthUrl);
router.post('/microsoft/callback', authController.microsoftLoginCallback);
router.post('/microsoft/token', authController.microsoftTokenLogin);

router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/profile', authenticate, authController.updateProfile);

// SuperAdmin-only routes
router.get('/users', authenticate, checkRole(['SuperAdmin']), authController.getAllUsers);
router.patch('/users/:userId/verify', authenticate, checkRole(['SuperAdmin']), authController.verifyUser);
router.patch('/users/:userId/role', authenticate, checkRole(['SuperAdmin']), authController.updateUserRole);

export default router;
