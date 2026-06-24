import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

// Create an ioredis connection if REDIS_URL exists
export const redisConnection = redisUrl ? new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
}) : null;

// Initialize the queue only if redis is available
export const registrationQueue = redisConnection ? new Queue('RegistrationQueue', {
  connection: redisConnection,
}) : null;

export const enqueueRegistration = async (payload) => {
  if (!registrationQueue) {
    throw new Error('Redis Queue is not configured. Falling back to synchronous processing.');
  }

  // Add the job to the queue
  await registrationQueue.add('registerUser', payload, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false, // Keep failed jobs for inspection
  });
};
