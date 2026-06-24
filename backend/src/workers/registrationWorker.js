import { Worker } from 'bullmq';
import { redisConnection } from '../queues/registrationQueue.js';
import Registration from '../models/registration.model.js';
import Event from '../models/event.model.js';
import User from '../models/user.model.js';

let registrationWorker = null;

export const startRegistrationWorker = () => {
  if (!redisConnection) {
    console.log('⚠️ Redis not configured. Background workers will not start.');
    return;
  }

  registrationWorker = new Worker('RegistrationQueue', async (job) => {
    const {
      eventId,
      registeredBy,
      registrationType,
      teamName,
      teamMembers,
      paymentStatus,
      customData
    } = job.data;

    console.log(`[Worker] Processing registration for User ${registeredBy} -> Event ${eventId}`);

    // Verify event
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    if (event.status === 'Ended' || event.status === 'Draft') {
      throw new Error(`Event is not active`);
    }

    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      throw new Error(`Registration deadline passed`);
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({ eventId, registeredBy });
    if (existingRegistration) {
      throw new Error(`User already registered for this event`);
    }

    // Create the registration
    const newRegistration = new Registration({
      eventId,
      registeredBy,
      registrationType,
      teamName,
      teamMembers,
      paymentStatus,
      customData
    });

    await newRegistration.save();

    // Update event registration count
    event.totalRegistrations = await Registration.getEventRegistrationCount(eventId);
    await event.save();

    // Push event name to User
    const user = await User.findById(registeredBy);
    if (user && !user.participatedEventNames.includes(event.title)) {
      user.participatedEventNames.push(event.title);
      await user.save();
    }

    console.log(`[Worker] ✅ Registration saved successfully for User ${registeredBy}`);
    return newRegistration._id;
  }, {
    connection: redisConnection,
    concurrency: 10 // Process 10 registrations concurrently
  });

  registrationWorker.on('completed', (job) => {
    // We could send a success email here
  });

  registrationWorker.on('failed', (job, err) => {
    console.error(`[Worker] ❌ Job ${job.id} failed:`, err.message);
  });

  console.log('🚀 Registration Worker started and listening for jobs...');
};
