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
let isDraining = false;
let drainTimer = null;

const QUEUE_NAME_1 = 'RegistrationQueue_1';
const QUEUE_NAME_2 = 'RegistrationQueue_2';

export const isRegistrationQueueEnabled = () => Boolean(registrationQueue1) && !isDraining;

const executeGracefulShutdown = async (modeType, currentIstHour) => {
    console.log(`[RedisManager] Executing graceful shutdown (Disconnecting Redis after drain timeout)...`);
    await stopRegistrationWorker();
    if (registrationQueue1) { await registrationQueue1.close(); registrationQueue1 = null; }
    if (registrationQueue2) { await registrationQueue2.close(); registrationQueue2 = null; }
    if (redisConnection1) { redisConnection1.disconnect(); redisConnection1 = null; }
    if (redisConnection2) { redisConnection2.disconnect(); redisConnection2 = null; }
    isDraining = false;
    drainTimer = null;
    console.log(`[RedisManager] Redis connections & workers successfully closed.`);
};

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
        

        const istHourFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Kolkata',
            hour: 'numeric',
            hour12: false
        });
        const istMinuteFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Kolkata',
            minute: 'numeric'
        });

        const currentIstHour = parseInt(istHourFormatter.format(now), 10);
        const currentIstMinute = parseInt(istMinuteFormatter.format(now), 10);

        const startHour = sysConfig?.startHour ?? 10;
        const endHour = sysConfig?.endHour ?? 23;


        const isExactWindow = currentIstHour >= startHour && currentIstHour < endHour;
        const isPreWarmWindow = (currentIstHour === startHour - 1) && (currentIstMinute >= 45);
        const isTimeInWindow = isExactWindow || isPreWarmWindow;

        let shouldEnableRedis = false;

        // Check if within 15-minute shutdown grace period
        if (sysConfig?.turnOffEffectiveAt) {
            if (now < new Date(sysConfig.turnOffEffectiveAt)) {
                // Grace period is active - keep Redis running!
                shouldEnableRedis = true;
            } else {
                // Grace period has elapsed - finalize shutdown
                sysConfig.enableRedis = false;
                sysConfig.redisModeType = 'ALWAYS_OFF';
                sysConfig.turnOffScheduledAt = null;
                sysConfig.turnOffEffectiveAt = null;
                await sysConfig.save();
                shouldEnableRedis = false;
            }
        } else if (modeType === 'ALWAYS_ON') {
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
                if (!isDraining) {
                    isDraining = true;
                    console.log(`[RedisManager] ⏳ Toggle OFF detected! Initiating 15-minute Draining Grace Period (Mode: ${modeType})...`);
                    console.log(`[RedisManager] New incoming registrations will bypass BullMQ and write directly to Database. Worker is keeping Redis open for 15 mins to drain all queued jobs.`);
                    
                    if (drainTimer) clearTimeout(drainTimer);
                    
                    const DRAIN_TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes
                    drainTimer = setTimeout(async () => {
                        await executeGracefulShutdown(modeType, currentIstHour);
                    }, DRAIN_TIMEOUT_MS);
                }
            }
            return;
        }


        if (shouldEnableRedis && isDraining) {
            console.log(`[RedisManager] 🔄 Redis re-enabled during drain period! Resuming normal BullMQ queueing.`);
            isDraining = false;
            if (drainTimer) {
                clearTimeout(drainTimer);
                drainTimer = null;
            }
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
        }
    } catch (error) {
        console.error('[RedisManager] Error in checkAndToggleRedis:', error);
    }
};

export const enqueueRegistration = async (payload) => {
    if (!registrationQueue1 || isDraining) {
        throw new Error('Registration queue is disabled or draining');
    }

    const uniqueJobId = `reg-${payload.eventId}-${payload.registeredBy}`;


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