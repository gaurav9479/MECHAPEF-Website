import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL;
const QUEUE_NAME = 'RegistrationQueue';
const isRedisEnabled = Boolean(redisUrl);

// Create an ioredis connection if REDIS_URL exists.
// Errors are handled here so a transient Redis outage does not crash the API.
export const redisConnection = isRedisEnabled ? new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => Math.min(times * 200, 5000),
}) : null;

if (redisConnection) {
  redisConnection.on('error', (error) => {
    console.error('[Redis] Registration queue connection error:', error.message);
  });

  redisConnection.on('connect', () => {
    console.log('[Redis] Registration queue connected');
  });
}

// Initialize the queue only if Redis is configured.
export const registrationQueue = redisConnection ? new Queue(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 60 * 60,
      count: 1000,
    },
    removeOnFail: {
      age: 24 * 60 * 60,
      count: 5000,
    },
  },
}) : null;

export const enqueueRegistration = async (payload) => {
  if (!registrationQueue) {
    throw new Error('Redis queue is not configured.');
  }

  const uniqueJobId = `reg-${payload.eventId}-${payload.registeredBy}`;

  return registrationQueue.add('registerUser', payload, {
    jobId: uniqueJobId,
  });
};

export const isRegistrationQueueEnabled = () => Boolean(registrationQueue);
