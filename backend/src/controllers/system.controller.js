import { SystemConfig } from '../models/systemConfig.model.js';
import APIResponse from '../utils/APIResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../constants/index.js';
import { checkAndToggleRedis } from '../queues/registrationQueue.js';

export const getSystemConfig = asyncHandler(async (req, res) => {
    let config = await SystemConfig.findOne();
    if (!config) {
        config = await SystemConfig.create({
            enableRedis: process.env.ENABLE_REDIS === 'true',
            redisModeType: 'AUTO',
            startHour: 10,
            endHour: 23,
            shutdownBufferMinutes: 15
        });
    }

    const now = new Date();
    let isShuttingDown = false;
    let shutdownMinutesRemaining = 0;

    if (config.turnOffEffectiveAt && now < config.turnOffEffectiveAt) {
        isShuttingDown = true;
        shutdownMinutesRemaining = Math.max(0, Math.ceil((config.turnOffEffectiveAt - now) / (60 * 1000)));
    } else if (config.turnOffEffectiveAt && now >= config.turnOffEffectiveAt) {
        // Effective shutdown time reached
        config.enableRedis = false;
        config.redisModeType = 'ALWAYS_OFF';
        config.turnOffScheduledAt = null;
        config.turnOffEffectiveAt = null;
        await config.save();
        await checkAndToggleRedis('ALWAYS_OFF');
    }

    const responseData = {
        ...config.toObject(),
        isShuttingDown,
        shutdownMinutesRemaining
    };

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { config: responseData }, 'System config retrieved')
    );
});

export const updateSystemConfig = asyncHandler(async (req, res) => {
    const { redisModeType, enableRedis, enableDualRedis, startHour, endHour, enableSeatLock, immediate, cancelShutdown } = req.body;
    
    let config = await SystemConfig.findOne();
    if (!config) {
        config = new SystemConfig();
    }

    const now = new Date();

    // If cancelling scheduled shutdown
    if (cancelShutdown) {
        config.turnOffScheduledAt = null;
        config.turnOffEffectiveAt = null;
        config.enableRedis = true;
        if (config.redisModeType === 'ALWAYS_OFF') config.redisModeType = 'ALWAYS_ON';
        await config.save();
        await checkAndToggleRedis(config.redisModeType);
        return res.status(HTTP_STATUS.OK).json(
            new APIResponse(HTTP_STATUS.OK, { config }, 'Redis shutdown cancelled. Redis remains active.')
        );
    }

    const isRequestingOff = enableRedis === false || redisModeType === 'ALWAYS_OFF';
    const isRequestingOn = enableRedis === true || redisModeType === 'ALWAYS_ON' || redisModeType === 'AUTO';

    if (isRequestingOn) {
        // Clear any pending shutdown
        config.turnOffScheduledAt = null;
        config.turnOffEffectiveAt = null;
        if (enableRedis !== undefined) config.enableRedis = true;
        if (redisModeType) config.redisModeType = redisModeType;
    } else if (isRequestingOff) {
        if (immediate) {
            // Immediate shutdown without buffer
            config.enableRedis = false;
            config.redisModeType = 'ALWAYS_OFF';
            config.turnOffScheduledAt = null;
            config.turnOffEffectiveAt = null;
        } else {
            // Schedule 15-minute buffer
            const bufferMinutes = config.shutdownBufferMinutes || 15;
            config.turnOffScheduledAt = now;
            config.turnOffEffectiveAt = new Date(now.getTime() + bufferMinutes * 60 * 1000);
            config.redisModeType = 'ALWAYS_OFF';
            // Keep active during grace period
            config.enableRedis = true;
        }
    }

    if (enableDualRedis !== undefined) config.enableDualRedis = Boolean(enableDualRedis);
    if (startHour !== undefined) config.startHour = Number(startHour);
    if (endHour !== undefined) config.endHour = Number(endHour);
    if (enableSeatLock !== undefined) config.enableSeatLock = Boolean(enableSeatLock);
    
    await config.save();

    // Dynamically trigger Redis toggle evaluation
    await checkAndToggleRedis(config.redisModeType);

    const message = config.turnOffEffectiveAt && now < config.turnOffEffectiveAt
        ? `Redis shutdown initiated with 15-minute grace period. Redis will turn off at ${config.turnOffEffectiveAt.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST.`
        : `System config updated: Redis mode set to ${config.redisModeType}`;

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { config }, message)
    );
});
