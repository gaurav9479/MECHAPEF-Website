import mongoose from 'mongoose';

const pastEventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Event title is required'],
        trim: true
    },
    date: {
        type: String,
        required: [true, 'Event date is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Event description is required'],
        trim: true
    },
    imageURL: {
        type: String,
        required: [true, 'Event image URL is required']
    },
    imagekitFileId: {
        type: String,
        default: null
    },
    order: {
        type: Number,
        default: 0
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

export default mongoose.model('PastEvent', pastEventSchema);
