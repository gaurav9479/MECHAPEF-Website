import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            trim: true,
            lowercase: true
        },
        message: {
            type: String,
            required: [true, 'Message is required'],
            trim: true
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true
        },
        deletedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

contactSchema.query.notDeleted = function () {
    return this.where({ deletedAt: null });
};

export default mongoose.model('Contact', contactSchema);
