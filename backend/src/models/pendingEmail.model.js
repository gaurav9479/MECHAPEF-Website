import mongoose from 'mongoose';

const pendingEmailSchema = new mongoose.Schema({
    to: {
        type: String,
        required: true,
        trim: true
    },
    subject: {
        type: String,
        required: true
    },
    text: {
        type: String
    },
    html: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'failed'],
        default: 'pending'
    },
    attempts: {
        type: Number,
        default: 0
    },
    lastError: {
        type: String
    }
}, {
    timestamps: true
});

// Index to quickly fetch pending emails sorted by oldest first
pendingEmailSchema.index({ status: 1, createdAt: 1 });

export default mongoose.model('PendingEmail', pendingEmailSchema);
