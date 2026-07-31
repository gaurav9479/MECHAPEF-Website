import mongoose from 'mongoose';

// Stores image URLs for specific named sections in the frontend
// sectionKey is a unique identifier e.g. "bento_1", "hero_bg", "dept_1" etc.
const sectionImageSchema = new mongoose.Schema({
    sectionKey: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        // e.g: "bento_1", "bento_2", "hero_bot", "dept_1" ... "dept_7"
    },
    label: {
        type: String,  // Human-readable label shown in admin panel
        required: true,
    },
    imageURL: {
        type: String,
        default: null,
    },
    imagekitFileId: {
        type: String,  // ImageKit file ID for deletion/replacement
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
