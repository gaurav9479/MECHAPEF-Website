import mongoose from 'mongoose';
import { CERTIFICATE_TYPES_ARRAY } from '../constants/index.js';
import { nanoid } from 'nanoid';

const certificateSchema = new mongoose.Schema(
    {
        uniqueVerificationCode: {
            type: String,
            unique: true,
            default: () => nanoid(12)
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true
        },

        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: [true, 'Event ID is required'],
            index: true
        },

        registrationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Registration'
        },

        type: {
            type: String,
            enum: {
                values: CERTIFICATE_TYPES_ARRAY,
                message: `Certificate type must be one of: ${CERTIFICATE_TYPES_ARRAY.join(', ')}`
            },
            required: [true, 'Certificate type is required'],
            index: true
        },

        pdfURL: {
            type: String,
            required: [true, 'PDF URL is required']
        },

        verificationURL: {
            type: String
        },

        userName: String,

        eventTitle: String,

        certificateNumber: String,

        issuedAt: {
            type: Date,
            default: Date.now,
            index: true
        },

        expiresAt: Date,

        isActive: {
            type: Boolean,
            default: true
        },

        metadata: {
            rank: String, 
            score: Number,
            generatedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            batchId: String 
        },

        createdAt: {
            type: Date,
            default: Date.now
        },

        deletedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

certificateSchema.index({ userId: 1, eventId: 1 });
certificateSchema.index({ uniqueVerificationCode: 1 });
certificateSchema.index({ issuedAt: -1 });

certificateSchema.virtual('publicVerificationURL').get(function () {
    return `${process.env.APP_URL || 'http://localhost:5000'}/api/certificates/verify/${this.uniqueVerificationCode}`;
});

certificateSchema.query.notDeleted = function () {
    return this.where({ deletedAt: null });
};

certificateSchema.statics.getUserCertificates = async function (userId) {
    return await this.find({
        userId,
        deletedAt: null,
        isActive: true
    })
        .sort({ issuedAt: -1 })
        .populate('eventId', 'title');
};

certificateSchema.statics.verifyCertificate = async function (verificationCode) {
    return await this.findOne({
        uniqueVerificationCode: verificationCode,
        deletedAt: null,
        isActive: true
    })
        .populate('userId', 'name email')
        .populate('eventId', 'title');
};

export default mongoose.model('Certificate', certificateSchema);
