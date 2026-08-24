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
            endHour: 23
        });
    }
    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { config }, 'System config retrieved')
    );
});

export const updateSystemConfig = asyncHandler(async (req, res) => {
    const { redisModeType, enableRedis, enableDualRedis, startHour, endHour, enableSeatLock } = req.body;
    
    let config = await SystemConfig.findOne();
    if (!config) {
        config = new SystemConfig();
    }

    if (redisModeType) config.redisModeType = redisModeType;
    if (enableRedis !== undefined) config.enableRedis = Boolean(enableRedis);
    if (enableDualRedis !== undefined) config.enableDualRedis = Boolean(enableDualRedis);
    if (startHour !== undefined) config.startHour = Number(startHour);
    if (endHour !== undefined) config.endHour = Number(endHour);
    if (enableSeatLock !== undefined) config.enableSeatLock = Boolean(enableSeatLock);
    
    await config.save();


    await checkAndToggleRedis(config.redisModeType);

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { config }, `System config updated: Redis mode set to ${config.redisModeType}`)
    );
});
