import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import Event from '../models/event.model.js';
import { startRegistrationWorker, stopRegistrationWorker } from '../workers/registrationWorker.js';

let redisConnection = null;
let registrationQueue = null;
const QUEUE_NAME = 'RegistrationQueue';

export const isRegistrationQueueEnabled = () => Boolean(registrationQueue);

export const checkAndToggleRedis = async () => {
    try {
        const now = new Date();
        const hasActiveEvent = await Event.exists({
            isActive: true,
            deletedAt: null,
            isTBD: { $ne: true },
            $or: [
                { registrationStartDate: { $exists: false } },
                { registrationStartDate: null },
                { registrationStartDate: { $lte: now } }
            ],
            registrationDeadline: { $gt: now }
        });
        const redisUrl = process.env.REDIS_URL;
        const isRedisEnabled = process.env.ENABLE_REDIS === 'true';

        if (!redisUrl || !isRedisEnabled) return;

        if (hasActiveEvent && !redisConnection) {
            console.log('[RedisManager] Active event found, initializing Redis...');
            redisConnection = new IORedis(redisUrl, { 
                maxRetriesPerRequest: null,
                enableReadyCheck: false,
                retryStrategy: (times) => {
                    if (times > 5) {
                        console.error('[Redis] Max retries reached, giving up on reconnect');
                        return null; 
                    }
                    return Math.min(times * 200, 5000);
                }
            });
            
            registrationQueue = new Queue(QUEUE_NAME, {
                connection: redisConnection,
                defaultJobOptions: { 
                    removeOnComplete: { age: 60 * 60, count: 1000 }, 
                    removeOnFail: { age: 24 * 60 * 60, count: 5000 }, 
                    attempts: 3, 
                    backoff: { type: 'exponential', delay: 1000 } 
                }
            });

            registrationQueue.on('error', (error) => {
                if (error.message.includes('max requests limit exceeded')) return;
                console.error('[RegistrationQueue] Queue error:', error.message);
            });

            redisConnection.on('error', (error) => {
                if (error.message.includes('max requests limit exceeded')) {
                    console.error('\n⚠️ [Redis] Registration Queue Daily Request Limit Exceeded. Falling back to direct database writes.');
                    return;
                }
                console.error('[Redis] Registration queue connection error:', error.message);
            });

            redisConnection.on('connect', () => {
                console.log('[Redis] Registration queue connected');
            });

            startRegistrationWorker(redisConnection);
        } else if (!hasActiveEvent && redisConnection) {
            console.log('[RedisManager] No active events, shutting down Redis to save commands...');
            
            await stopRegistrationWorker();

            if (registrationQueue) {
                await registrationQueue.close();
                registrationQueue = null;
            }
            
            if (redisConnection) {
                redisConnection.disconnect();
                redisConnection = null;
            }
        }
    } catch (error) {
        console.error('[RedisManager] Error in checkAndToggleRedis:', error);
    }
};

export const enqueueRegistration = async (payload) => {
    if (!registrationQueue) {
        throw new Error('Registration queue is not initialized');
    }

    const uniqueJobId = `reg-${payload.eventId}-${payload.registeredBy}`;

    return registrationQueue.add('registerUser', payload, {
        jobId: uniqueJobId,
    });
};