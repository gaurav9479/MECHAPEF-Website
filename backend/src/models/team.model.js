import mongoose from 'mongoose';
import { SUB_TEAMS_ARRAY } from '../constants/index.js';

const teamSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Team member name is required'],
            trim: true
        },

        role: {
            type: String,
            required: [true, 'Role/Designation is required'],
            trim: true
        },

        subTeam: {
            type: String,
            enum: {
                values: SUB_TEAMS_ARRAY,
                message: `Sub-team must be one of: ${SUB_TEAMS_ARRAY.join(', ')}`
            },
            required: [true, 'Sub-team is required'],
            index: true
        },

        imageURL: {
            type: String,
            default: null
        },

        linkedinURL: String,

        githubURL: String,

        yearOfStudy: {
            type: Number,
            min: 1,
            max: 4
        },

        email: {
            type: String,
            unique: true,
            sparse: true
        },

        phoneNumber: String,

        bio: String,

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

teamSchema.index({ subTeam: 1, displayOrder: 1 });
teamSchema.index({ isActive: 1, deletedAt: 1 });

teamSchema.query.notDeleted = function () {
    return this.where({ deletedAt: null });
};

teamSchema.statics.getTeamBySubTeam = async function (subTeam) {
    return await this.find({
        subTeam,
        isActive: true,
        deletedAt: null
    })
        .sort({ displayOrder: 1 });
};

export default mongoose.model('Team', teamSchema);
