import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL;
const QUEUE_NAME = 'RegistrationQueue';
const isRedisEnabled = Boolean(redisUrl);

export const redisConnection = isRedisEnabled ? new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => {
        if (times > 5) {
            console.error('[Redis] Max retries reached, giving up on reconnect');
            return null; // stop retrying — lets enqueueRegistration throw fast
        }
        return Math.min(times * 200, 5000);
    },
}) : null;

if (redisConnection) {
    redisConnection.on('error', (error) => {
        console.error('[Redis] Registration queue connection error:', error.message);
    });

    redisConnection.on('connect', () => {
        console.log('[Redis] Registration queue connected');
    });

    redisConnection.on('close', () => {
        console.warn('[Redis] Registration queue connection closed');
    });
}

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