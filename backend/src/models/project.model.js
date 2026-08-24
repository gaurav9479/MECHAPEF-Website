import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    modelUrl: {
        type: String,
        required: true,
        default: '/models/placeholder.glb' 
    },
    credits: {
        type: String, 
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

export const Project = mongoose.model('Project', projectSchema);
