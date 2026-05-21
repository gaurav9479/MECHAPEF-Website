import { Router } from 'express';
import * as eventController from '../controllers/eventController.js';
import * as registrationController from '../controllers/registrationController.js';
import { authenticate, checkRole } from '../middleware/auth.js';
import { publicLimiter } from '../middleware/security.js';

const router = Router();

router.get('/',  eventController.getAllEvents);
router.get('/featured',  eventController.getFeaturedEvents);
router.get('/:id',  eventController.getEventById);

router.post('/', authenticate, checkRole(['SuperAdmin', 'EventHead']), eventController.createEvent);
router.put('/:id', authenticate, checkRole(['SuperAdmin', 'EventHead']), eventController.updateEvent);
router.delete('/:id', authenticate, checkRole(['SuperAdmin']), eventController.deleteEvent);
router.get('/:id/stats', authenticate, checkRole(['SuperAdmin', 'EventHead']), eventController.getEventStats);


router.post('/:eventId/register', authenticate, registrationController.registerForEvent);
router.get('/:eventId/registrations', authenticate, checkRole(['SuperAdmin', 'EventHead']), registrationController.getEventRegistrations);
router.put('/:eventId/registrations/:id/attendance', authenticate, checkRole(['SuperAdmin', 'EventHead']), registrationController.markAttendance);

export default router;
