import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema(
  {
    enableRedis: { type: Boolean, default: false },
    enableDualRedis: { type: Boolean, default: false },
    redisModeType: {
      type: String,
      enum: ['AUTO', 'ALWAYS_ON', 'ALWAYS_OFF'],
      default: 'AUTO'
    },
    startHour: { type: Number, default: 10 }, 
    endHour: { type: Number, default: 23 }, 
    enableSeatLock: { type: Boolean, default: true },
    autoFallbackToDb: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);
