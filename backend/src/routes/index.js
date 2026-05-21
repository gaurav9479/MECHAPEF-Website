import { Router } from 'express';
import authRoutes from './auth.js';
import eventRoutes from './events.js';
import registrationRoutes from './registrations.js';

const router = Router();


router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/registrations', registrationRoutes);

router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

export default router;
