import mongoose from 'mongoose';
import { SPONSOR_TIERS_ARRAY } from '../constants/index.js';

const sponsorSchema = new mongoose.Schema(
    {
        companyName: {
            type: String,
            required: [true, 'Company name is required'],
            trim: true,
            unique: true
        },

        tier: {
            type: String,
            enum: {
                values: SPONSOR_TIERS_ARRAY,
                message: `Tier must be one of: ${SPONSOR_TIERS_ARRAY.join(', ')}`
            },
            required: [true, 'Sponsor tier is required'],
            index: true
        },

        logoURL: {
            type: String,
            required: [true, 'Logo URL is required']
        },

        websiteURL: String,

        description: String,

        contactPerson: String,

        contactEmail: String,

        contactPhone: String,

        academicYear: {
            type: String,
            required: [true, 'Academic year is required']
        },

        sponsorshipAmount: {
            type: Number,
            default: 0
        },

        displayOrder: {
            type: Number,
            default: 0,
            index: true
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true
        },

        createdAt: {
            type: Date,
            default: Date.now
        },

        updatedAt: {
            type: Date,
            default: Date.now
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

sponsorSchema.index({ tier: 1, displayOrder: 1 });
sponsorSchema.index({ academicYear: 1, isActive: 1 });
sponsorSchema.index({ isActive: 1, deletedAt: 1 });

sponsorSchema.query.notDeleted = function () {
    return this.where({ deletedAt: null });
};

sponsorSchema.statics.getSponsorsByTier = async function (academicYear) {
    return await this.find({
        academicYear,
        isActive: true,
        deletedAt: null
    })
        .sort({ tier: 1, displayOrder: 1 });
};

export default mongoose.model('Sponsor', sponsorSchema);
