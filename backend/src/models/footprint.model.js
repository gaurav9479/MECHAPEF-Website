import mongoose from 'mongoose';

const footprintSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        userName: {
            type: String,
            required: true,
            trim: true
        },
        action: {
            type: String,
            required: true,
            enum: ['CREATE', 'UPDATE', 'DELETE', 'MAIL_SENT', 'SYSTEM_UPDATE']
        },
        resource: {
            type: String,
            required: true,
            trim: true
        },
        details: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

footprintSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

export default mongoose.model('Footprint', footprintSchema);
