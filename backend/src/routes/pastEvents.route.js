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

router.get('/', getPastEvents);

const adminAuth = [
    authenticate,
    checkRole(['super-admin', 'content-lead'])
];

router.post('/', ...adminAuth, createPastEvent);
router.put('/order', ...adminAuth, updatePastEventsOrder);
router.put('/:id', ...adminAuth, updatePastEvent);
router.delete('/:id', ...adminAuth, deletePastEvent);

export default router;