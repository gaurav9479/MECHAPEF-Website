import express from 'express';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';
import {
    getPastEvents,
    createPastEvent,
    updatePastEvent,
    deletePastEvent,
    updatePastEventsOrder
} from '../controllers/pastEvents.controller.js';

const router = express.Router();

// Public route
router.get('/', getPastEvents);

// Protected Content Management routes
const adminAuth = [
    authenticate,
    checkRole(['super-admin', 'content-lead', 'media-lead'])
];

router.post('/', ...adminAuth, createPastEvent);
router.put('/order', ...adminAuth, updatePastEventsOrder);
router.put('/:id', ...adminAuth, updatePastEvent);
router.delete('/:id', ...adminAuth, deletePastEvent);

export default router;