import mongoose from 'mongoose';

const sectionImageSchema = new mongoose.Schema({
    sectionKey: {
        type: String,
        required: true,
        unique: true,
        trim: true,

    },
    label: {
        type: String, 
        required: true,
    },
    imageURL: {
        type: String,
        default: null,
    },
    imagekitFileId: {
        type: String, 
        default: null,
    },
    name: {
        type: String,
        default: null,
    },
    regNo: {
        type: String,
        default: null,
    },
    order: {
        type: Number,
        default: 0,
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
}, { timestamps: true });

export default mongoose.model('SectionImage', sectionImageSchema);
