import { Worker } from 'bullmq';
import { redisConnection } from '../queues/registrationQueue.js';
import Registration from '../models/registration.model.js';
import Event from '../models/event.model.js';
import User from '../models/user.model.js';

let registrationWorker = null;
const QUEUE_NAME = 'RegistrationQueue';

export const startRegistrationWorker = () => {
  if (!redisConnection) {
    console.log('[Worker] Redis not configured. Registration worker will not start.');
    return;
  }

  if (registrationWorker) {
    console.log('[Worker] Registration worker is already running.');
    return;
  }

  registrationWorker = new Worker(QUEUE_NAME, async (job) => {
    const {
      eventId,
      registeredBy,
      registrationType,
      teamName,
      teamMembers,
      paymentStatus,
      customData
    } = job.data;

    console.log(`[Worker] Processing registration for user ${registeredBy} -> event ${eventId}`);

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

    // Check if already registered. This is repeated in the worker because queued jobs
    // can run later and multiple requests can arrive close together.
    const existingRegistration = await Registration.findOne({
      eventId,
      registeredBy,
      deletedAt: null
    });
    if (existingRegistration) {
      throw new Error(`User already registered for this event`);
    }

    if (registrationType === 'Team' && teamMembers?.length) {
      const memberIds = teamMembers.map((member) => member.userId);
      const alreadyRegisteredMember = await Registration.findOne({
        eventId,
        'teamMembers.userId': { $in: memberIds },
        deletedAt: null
      });

      if (alreadyRegisteredMember) {
        throw new Error('One or more team members are already registered for this event');
      }
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

    try {
      await newRegistration.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('User already registered for this event');
      }
      throw error;
    }

    // Update event registration count
    event.totalRegistrations = await Registration.getEventRegistrationCount(eventId);
    await event.save();

    // Push event name to User
    const user = await User.findById(registeredBy);
    if (user && !user.participatedEventNames.includes(event.title)) {
      user.participatedEventNames.push(event.title);
      await user.save();
    }

    console.log(`[Worker] Registration saved successfully for user ${registeredBy}`);
    return newRegistration._id;
  }, {
    connection: redisConnection,
    concurrency: Number(process.env.REGISTRATION_WORKER_CONCURRENCY || 5),
    limiter: {
      max: Number(process.env.REGISTRATION_WORKER_RATE_LIMIT || 50),
      duration: 1000,
    },
  });

  registrationWorker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  registrationWorker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id || 'unknown'} failed:`, err.message);
  });

  registrationWorker.on('error', (err) => {
    console.error('[Worker] Registration worker error:', err.message);
  });

  console.log('[Worker] Registration worker started and listening for jobs.');
};
