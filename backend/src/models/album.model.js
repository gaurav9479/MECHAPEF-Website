import mongoose from 'mongoose';

const galleryImageSchema = new mongoose.Schema({
    imageURL: {
        type: String,
        required: true
    },
    imagekitFileId: {
        type: String,
        default: null
    },
    caption: {
        type: String,
        default: null,
        trim: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

const albumSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Album title is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    coverImageURL: {
        type: String,
        default: null
    },
    coverImageKitFileId: {
        type: String,
        default: null
    },
    images: [galleryImageSchema],
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

export default mongoose.model('Album', albumSchema);
