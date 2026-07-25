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

        // NOTE: `status` is kept for legacy compatibility but should be
        // treated as a HINT only. Use the `currentStatus` virtual for
        // accurate, real-time status derived from startTime / endTime.
        status: {
            type: String,
            enum: ['Upcoming', 'Ongoing', 'Ended'],
            default: 'Upcoming'
        },

        endedAt: {
            type: Date,
            default: null
        },

        isTBD: {
            type: Boolean,
            default: false
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
                validator(value) {
                    if (!this.startTime) return true;
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
                validator(value) {
                    if (!this.startTime) return true;
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

        customFormFields: [{
            fieldName: { type: String, required: true },
            fieldType: {
                type: String,
                enum: ['text', 'textarea', 'checkbox', 'file'],
                required: true
            },
            isRequired: { type: Boolean, default: false }
        }],

        eligibleBranches: {
            type: [String],
            required: [true, 'Eligible branches are required'],
            validate: {
                validator(value) {
                    return value && value.length > 0;
                },
                message: 'At least one eligible branch must be selected'
            }
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

// ─────────────────────────────────────────────
//  INDEXES
// ─────────────────────────────────────────────
eventSchema.index({ startTime: 1 });
eventSchema.index({ endTime: 1 });           // needed for currentStatus queries
eventSchema.index({ status: 1 });            // #3 – fast status filtering
eventSchema.index({ category: 1 });
eventSchema.index({ featured: 1, startTime: 1 });
eventSchema.index({ registrationDeadline: 1 });
eventSchema.index({ createdAt: -1 });
eventSchema.index({ deletedAt: 1, isActive: 1 }); // compound for soft-delete queries

// ─────────────────────────────────────────────
//  VIRTUALS
// ─────────────────────────────────────────────

/**
 * #1 – Real-time status derived from startTime / endTime.
 * Use `event.currentStatus` instead of `event.status` everywhere in
 * the frontend so stale stored values never cause display bugs.
 */
eventSchema.virtual('currentStatus').get(function () {
    const now = new Date();
    if (now < this.startTime)  return 'Upcoming';
    if (now <= this.endTime)   return 'Ongoing';
    return 'Ended';
});

/**
 * #4 – Duration in minutes between startTime and endTime.
 * Returns 0 if either date is missing.
 */
eventSchema.virtual('duration').get(function () {
    if (!this.startTime || !this.endTime) return 0;
    return Math.floor((this.endTime - this.startTime) / (1000 * 60));
});

/**
 * #5 – True when the event's endTime is in the past.
 */
eventSchema.virtual('hasEnded').get(function () {
    return new Date() > this.endTime;
});

/**
 * #6 – True when the event hasn't started yet.
 */
eventSchema.virtual('isUpcoming').get(function () {
    return new Date() < this.startTime;
});

/**
 * #7 – Live registration count derived from the populated array.
 * Useful when registrations are populated; falls back to 0 otherwise.
 */
eventSchema.virtual('registrationCount').get(function () {
    return this.registrations?.length || 0;
});

/** Already existing – kept as-is */
eventSchema.virtual('isLive').get(function () {
    const now = new Date();
    return now >= this.startTime && now <= this.endTime && this.isActive;
});

/** Already existing – kept as-is */
eventSchema.virtual('isRegistrationOpen').get(function () {
    if (!this.registrationDeadline) return false;
    const now = new Date();
    return now < this.registrationDeadline && this.isActive && this.deletedAt === null;
});

/** Already existing – kept as-is */
eventSchema.virtual('formattedDate').get(function () {
    if (!this.startTime) return null;
    return this.startTime.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
});

// ─────────────────────────────────────────────
//  QUERY HELPERS
// ─────────────────────────────────────────────
eventSchema.query.notDeleted = function () {
    return this.where({ deletedAt: null, isActive: true });
};

// ─────────────────────────────────────────────
//  STATICS
// ─────────────────────────────────────────────

/**
 * #2 – Added `isActive: true` so hidden featured events don't appear.
 */
eventSchema.statics.getFeaturedEvents = async function (limit = 3) {
    return await this.find({
        featured: true,
        deletedAt: null,
        isActive: true,           // #2 fix
        endTime: { $gte: new Date() }
    })
        .sort({ startTime: 1 })
        .limit(limit)
        .populate('createdBy', 'name email');
};

eventSchema.statics.getUpcomingEvents = async function (limit = 10) {
    return await this.find({
        endTime: { $gte: new Date() },
        deletedAt: null,
        isActive: true
    })
        .sort({ startTime: 1 })
        .limit(limit)
        .populate('createdBy', 'name email');
};

// ─────────────────────────────────────────────
//  PRE-SAVE MIDDLEWARE
//  Still syncs the stored `status` field for backward compatibility
//  (e.g. existing admin queries that filter by status).
//  For display, always prefer the `currentStatus` virtual.
// ─────────────────────────────────────────────
eventSchema.pre('save', function (next) {
    const now = new Date();

    if (now < this.startTime) {
        this.status = 'Upcoming';
    } else if (now <= this.endTime) {
        this.status = 'Ongoing';
    } else {
        this.status = 'Ended';
        if (!this.endedAt) this.endedAt = now; // only set once
    }

    next();
});

export default mongoose.model('Event', eventSchema);
