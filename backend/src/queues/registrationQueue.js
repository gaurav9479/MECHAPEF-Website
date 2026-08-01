import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import Event from '../models/event.model.js';
import { startRegistrationWorker, stopRegistrationWorker } from '../workers/registrationWorker.js';

import { SystemConfig } from '../models/systemConfig.model.js';

let redisConnection1 = null;
let redisConnection2 = null;
let registrationQueue1 = null;
let registrationQueue2 = null;
let isDualMode = false;

const QUEUE_NAME_1 = 'RegistrationQueue_1';
const QUEUE_NAME_2 = 'RegistrationQueue_2';

export const isRegistrationQueueEnabled = () => Boolean(registrationQueue1);

export const checkAndToggleRedis = async (overrideMode = null) => {
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

        const sysConfig = await SystemConfig.findOne().catch(() => null);
        const modeType = overrideMode || sysConfig?.redisModeType || 'AUTO';
        isDualMode = Boolean(sysConfig?.enableDualRedis);
        
        // Calculate current hour in IST (Asia/Kolkata timezone)
        const istFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Kolkata',
            hour: 'numeric',
            hour12: false
        });
        const currentIstHour = parseInt(istFormatter.format(now), 10);

        const startHour = sysConfig?.startHour ?? 10;
        const endHour = sysConfig?.endHour ?? 23;

        const isTimeInWindow = currentIstHour >= startHour && currentIstHour < endHour;

        let shouldEnableRedis = false;
        if (modeType === 'ALWAYS_ON') {
            shouldEnableRedis = true;
        } else if (modeType === 'ALWAYS_OFF') {
            shouldEnableRedis = false;
        } else {
            shouldEnableRedis = Boolean(hasActiveEvent && isTimeInWindow);
        }

        const redisUrl1 = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
        const redisUrl2 = process.env.REDIS_URL_2 || redisUrl1;

        if (!shouldEnableRedis) {
            if (redisConnection1 || redisConnection2) {
                console.log(`[RedisManager] Disconnecting Redis (Mode: ${modeType}, IST Hour: ${currentIstHour}:00, Dual: ${isDualMode})...`);
                await stopRegistrationWorker();
                if (registrationQueue1) { await registrationQueue1.close(); registrationQueue1 = null; }
                if (registrationQueue2) { await registrationQueue2.close(); registrationQueue2 = null; }
                if (redisConnection1) { redisConnection1.disconnect(); redisConnection1 = null; }
                if (redisConnection2) { redisConnection2.disconnect(); redisConnection2 = null; }
            }
            return;
        }

        if (shouldEnableRedis && !redisConnection1) {
            console.log(`[RedisManager] Initializing Redis (Dual Mode: ${isDualMode})...`);
            
            const createRedis = (url) => new IORedis(url, { 
                maxRetriesPerRequest: null,
                enableReadyCheck: false,
                retryStrategy: (times) => times > 5 ? null : Math.min(times * 200, 5000)
            });

            const createQueue = (name, conn) => new Queue(name, {
                connection: conn,
                defaultJobOptions: { 
                    removeOnComplete: { age: 60 * 60, count: 1000 }, 
                    removeOnFail: { age: 24 * 60 * 60, count: 5000 }, 
                    attempts: 3, 
                    backoff: { type: 'exponential', delay: 1000 } 
                }
            });

            redisConnection1 = createRedis(redisUrl1);
            registrationQueue1 = createQueue(QUEUE_NAME_1, redisConnection1);

            redisConnection1.on('error', (error) => {
                if (error.message.includes('max requests limit exceeded')) {
                    console.error('\n⚠️ [Redis1] Limit Exceeded. Falling back to direct database writes.');
                    return;
                }
                console.error('[Redis1] Connection error:', error.message);
            });

            if (isDualMode) {
                redisConnection2 = createRedis(redisUrl2);
                registrationQueue2 = createQueue(QUEUE_NAME_2, redisConnection2);
                redisConnection2.on('error', (error) => {
                    if (error.message.includes('max requests limit exceeded')) return;
                    console.error('[Redis2] Connection error:', error.message);
                });
            }

            startRegistrationWorker(redisConnection1, isDualMode ? redisConnection2 : null, QUEUE_NAME_1, QUEUE_NAME_2);
        } else if (!hasActiveEvent && redisConnection1) {
            console.log('[RedisManager] No active events, shutting down Redis to save commands...');
            await stopRegistrationWorker();
            if (registrationQueue1) { await registrationQueue1.close(); registrationQueue1 = null; }
            if (registrationQueue2) { await registrationQueue2.close(); registrationQueue2 = null; }
            if (redisConnection1) { redisConnection1.disconnect(); redisConnection1 = null; }
            if (redisConnection2) { redisConnection2.disconnect(); redisConnection2 = null; }
        }
    } catch (error) {
        console.error('[RedisManager] Error in checkAndToggleRedis:', error);
    }
};

export const enqueueRegistration = async (payload) => {
    if (!registrationQueue1) {
        throw new Error('Registration queue is not initialized');
    }

    const uniqueJobId = `reg-${payload.eventId}-${payload.registeredBy}`;

    // Hash user ID to route to Q1 or Q2
    let targetQueue = registrationQueue1;
    
    if (isDualMode && registrationQueue2) {
        const charCode = payload.registeredBy.charCodeAt(payload.registeredBy.length - 1);
        if (charCode % 2 !== 0) {
            targetQueue = registrationQueue2;
        }
    }

    return targetQueue.add('registerUser', payload, {
        jobId: uniqueJobId,
    });
};