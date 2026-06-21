import mongoose from 'mongoose';
import { EVENT_CATEGORIES_ARRAY } from '../constants/index.js';

const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Event title is required'],
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters']
        },

        description: {
            type: String,
            required: [true, 'Event description is required'],
            maxlength: [2000, 'Description cannot exceed 2000 characters']
        },

        category: {
            type: String,
            enum: {
                values: EVENT_CATEGORIES_ARRAY,
                message: `Category must be one of: ${EVENT_CATEGORIES_ARRAY.join(', ')}`
            },
            required: [true, 'Event category is required']
        },

        startTime: {
            type: Date,
            required: [true, 'Start time is required']
        },

        endTime: {
            type: Date,
            required: [true, 'End time is required'],
            validate: {
                validator: function (value) {
                    return value > this.startTime;
                },
                message: 'End time must be after start time'
            }
        },

        venue: {
            type: String,
            required: [true, 'Venue is required'],
            trim: true
        },

        description_detailed: String,

        maxTeamSize: {
            type: Number,
            default: 1,
            min: [1, 'Max team size must be at least 1']
        },

        registrationDeadline: {
            type: Date,
            required: [true, 'Registration deadline is required'],
            validate: {
                validator: function (value) {
                    return value < this.startTime;
                },
                message: 'Registration deadline must be before event start time'
            }
        },

        featured: {
            type: Boolean,
            default: false,
            index: true
        },

        bannerURL: {
            type: String,
            default: null
        },

        rules: [String],

        prizes: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },

        registrationFee: {
            type: Number,
            default: 0,
            min: 0
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        registrations: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Registration'
        }],

        totalRegistrations: {
            type: Number,
            default: 0
        },

        totalAttendees: {
            type: Number,
            default: 0
        },

        isActive: {
            type: Boolean,
            default: true
        },

        createdAt: {
            type: Date,
            default: Date.now,
            index: true
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
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

eventSchema.index({ startTime: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ featured: 1, startTime: 1 });
eventSchema.index({ registrationDeadline: 1 });
eventSchema.index({ createdAt: -1 });
eventSchema.virtual('isRegistrationOpen').get(function () {
    return new Date() < this.registrationDeadline;
});

eventSchema.virtual('formattedDate').get(function () {
    return this.startTime.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});
eventSchema.query.notDeleted = function () {
    return this.where({ deletedAt: null });
};
eventSchema.statics.getFeaturedEvents = async function (limit = 3) {
    return await this.find({
        featured: true,
        deletedAt: null,
        startTime: { $gte: new Date() }
    })
        .sort({ startTime: 1 })
        .limit(limit)
        .populate('createdBy', 'name email');
};

eventSchema.statics.getUpcomingEvents = async function (limit = 10) {
    return await this.find({
        startTime: { $gte: new Date() },
        deletedAt: null,
        isActive: true
    })
        .sort({ startTime: 1 })
        .limit(limit)
        .populate('createdBy', 'name email');
};

export default mongoose.model('Event', eventSchema);
