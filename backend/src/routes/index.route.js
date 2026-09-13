import { Router } from 'express';
import authRoutes from './auth.route.js';
import eventRoutes from './events.route.js';
import registrationRoutes from './registrations.route.js';
import teamRoutes from './team.route.js';
import announcementRoutes from './announcements.routes.js';
import sponsorRoutes from './sponsors.route.js';
import specialSponsorRoutes from './specialSponsor.route.js';
import uploadRoutes from './upload.route.js';
import albumRoutes from './albums.routes.js';
import pastEventsRoutes from './pastEvents.route.js';
import magazineRoutes from './magazine.route.js';
import mailRoutes from './mail.route.js';
import footprintRoutes from './footprint.route.js';
import contactRoutes from './contact.route.js';
import systemRoutes from './system.routes.js';
import projectRoutes from './project.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/registrations', registrationRoutes);
router.use('/team', teamRoutes);
router.use('/announcements', announcementRoutes);
router.use('/sponsors', sponsorRoutes);
router.use('/special-sponsor', specialSponsorRoutes);
router.use('/upload', uploadRoutes);
router.use('/gallery', albumRoutes);
router.use('/past-events', pastEventsRoutes);
router.use('/magazine', magazineRoutes);
router.use('/mail', mailRoutes);
router.use('/footprints', footprintRoutes);
router.use('/contact', contactRoutes);
router.use('/system', systemRoutes);
router.use('/projects', projectRoutes);

router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

export default router;
