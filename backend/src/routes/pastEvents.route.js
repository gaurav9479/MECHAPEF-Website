import express from 'express';
import { verifyToken, isAdmin } from '../middleware/auth.middleware.js';
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

// Protected Admin routes
router.post('/', verifyToken, isAdmin, createPastEvent);
router.put('/order', verifyToken, isAdmin, updatePastEventsOrder);
router.put('/:id', verifyToken, isAdmin, updatePastEvent);
router.delete('/:id', verifyToken, isAdmin, deletePastEvent);

export default router;
