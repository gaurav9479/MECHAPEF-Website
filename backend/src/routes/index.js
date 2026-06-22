import { Router } from 'express';
import authRoutes from './auth.js';
import eventRoutes from './events.js';
import registrationRoutes from './registrations.js';
import teamRoutes from './team.js';
import announcementRoutes from './announcements.js';
import sponsorRoutes from './sponsors.js';
import uploadRoutes from './upload.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/registrations', registrationRoutes);
router.use('/team', teamRoutes);
router.use('/announcements', announcementRoutes);
router.use('/sponsors', sponsorRoutes);
router.use('/upload', uploadRoutes);

router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

export default router;
