import { Router } from 'express';
import * as eventController from '../controllers/event.controller.js';
import * as registrationController from '../controllers/registration.controller.js';
import { authenticate, checkRole } from '../middleware/auth.middleware.js';
// import { imiter } from '../middleware/security.middleware.js';

const router = Router();

router.get('/',  eventController.getAllEvents);
router.get('/featured',  eventController.getFeaturedEvents);
router.get('/:id',  eventController.getEventById);

router.post('/', authenticate, checkRole(['SuperAdmin', 'EventHead']), eventController.createEvent);
router.put('/:id', authenticate, checkRole(['SuperAdmin', 'EventHead']), eventController.updateEvent);
router.delete('/:id', authenticate, checkRole(['SuperAdmin']), eventController.deleteEvent);
router.patch('/:id/end', authenticate, checkRole(['SuperAdmin', 'EventHead']), eventController.endEvent);
router.delete('/:id/wipe-data', authenticate, checkRole(['SuperAdmin']), eventController.wipeEventData);
router.get('/:id/stats', authenticate, checkRole(['SuperAdmin', 'EventHead']), eventController.getEventStats);


router.post('/:eventId/register', authenticate, registrationController.registerForEvent);
router.get('/:eventId/registrations', authenticate, checkRole(['SuperAdmin', 'EventHead']), registrationController.getEventRegistrations);
router.get('/:eventId/registrations/export', authenticate, checkRole(['SuperAdmin', 'EventHead']), registrationController.exportRegistrationsCSV);
router.put('/:eventId/registrations/:id/attendance', authenticate, checkRole(['SuperAdmin', 'EventHead']), registrationController.markAttendance);

export default router;
