import { Router } from 'express';
import * as sponsorController from '../controllers/sponsor.controller.js';
import * as configController from '../controllers/sponsorConfig.controller.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.get('/config', configController.getConfig);
router.get('/', sponsorController.getSponsors);

// Content Management Routes
router.put(
    '/config',
    authenticate,
    checkRole(['super-admin', 'content-lead', 'media-lead']),
    configController.updateConfig
);

router.post(
    '/',
    authenticate,
    checkRole(['super-admin', 'content-lead', 'media-lead']),
    sponsorController.createSponsor
);

router.put(
    '/:id',
    authenticate,
    checkRole(['super-admin', 'content-lead', 'media-lead']),
    sponsorController.updateSponsor
);

router.delete(
    '/:id',
    authenticate,
    checkRole(['super-admin', 'content-lead', 'media-lead']),
    sponsorController.deleteSponsor
);

export default router;