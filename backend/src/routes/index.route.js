import { Router } from 'express';
import authRoutes from './auth.route.js';
import eventRoutes from './events.route.js';
import registrationRoutes from './registrations.route.js';
import teamRoutes from './team.route.js';
import announcementRoutes from './announcements.routes.js';
import sponsorRoutes from './sponsors.route.js';
import uploadRoutes from './upload.route.js';
import albumRoutes from './albums.routes.js';
import pastEventsRoutes from './pastEvents.route.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/registrations', registrationRoutes);
router.use('/team', teamRoutes);
router.use('/announcements', announcementRoutes);
router.use('/sponsors', sponsorRoutes);
router.use('/upload', uploadRoutes);
router.use('/gallery', albumRoutes);
router.use('/past-events', pastEventsRoutes);

router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

export default router;
