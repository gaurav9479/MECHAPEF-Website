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
            required: [true, 'End time is required']
        },

        venue: {
            type: String,
            required: [true, 'Venue is required'],
            trim: true
        },

        description_detailed: String,

        descriptionBlocks: [{
            type: {
                type: String,
                enum: ['heading', 'paragraph'],
                required: true
            },
            text: {
                type: String,
                required: true,
                maxlength: [5000, 'Description block cannot exceed 5000 characters']
            }
        }],

        minTeamSize: {
            type: Number,
            default: 1,
            min: [1, 'Min team size must be at least 1']
        },

        maxTeamSize: {
            type: Number,
            default: 1,
            min: [1, 'Max team size must be at least 1']
        },

        registrationStartDate: {
            type: Date,
            default: null
        },

        registrationDeadline: {
            type: Date,
            required: [true, 'Registration deadline is required']
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

        eligibleYears: {
            type: [Number],
            required: [true, 'Eligible years are required'],
            validate: {
                validator(value) {
                    return value && value.length > 0;
                },
                message: 'At least one eligible year must be selected'
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

        ticketStages: {
            type: [String],
            default: ['Stage 1: Check-in']
        },

        highlights: [{
            question: { type: String, required: true },
            options: [{
                label: { type: String, required: true },
                votes: { type: Number, default: 0 },
                percentage: { type: Number, default: 0 }
            }],
            totalVotes: { type: Number, default: 0 },
            majorityOption: { type: String, default: '' },
            createdAt: { type: Date, default: Date.now }
        }],

        enableQRScanning: {
            type: Boolean,
            default: true
        },

        attendanceMethod: {
            type: String,
            enum: ['qr', 'id-card'],
            default: 'qr'
        },


        registrationMode: {
            type: String,
            enum: ['Standard', 'JoinRequests'],
            default: 'Standard'
        },

        isActive: {
            type: Boolean,
            default: true
        },

        liveInteractive: {
            enabled: {
                type: Boolean,
                default: false
            },
            currentType: {
                type: String,
                enum: ['quiz', 'voting', 'none'],
                default: 'none'
            },
            activeQuestionId: {
                type: String,
                default: null
            },
            questionStartTime: {
                type: Date,
                default: null
            },
            isAcceptingSubmissions: {
                type: Boolean,
                default: false
            },
            questions: [
                {
                    id: { type: String, required: true },
                    title: { type: String, required: true, maxlength: [500, 'Live question cannot exceed 500 characters'] },
                    pollType: {
                        type: String,
                        enum: ['quiz', 'voting'],
                        default: 'quiz'
                    },
                    options: [
                        {
                            key: { type: String, required: true },
                            text: { type: String, required: true }
                        }
                    ],
                    correctOption: {
                        type: String,
                        default: null
                    },
                    timeLimitSeconds: {
                        type: Number,
                        default: 30
                    },
                    points: {
                        type: Number,
                        default: 1000
                    },
                    result: {
                        totalVotes: { type: Number, default: 0 },
                        majorityOption: { type: String, default: null },
                        breakdown: [{
                            option: { type: String, required: true },
                            votes: { type: Number, default: 0 },
                            percentage: { type: Number, default: 0 }
                        }],
                        finalizedAt: { type: Date, default: null }
                    }
                }
            ]
        },

        deletionState: {
            status: {
                type: String,
                enum: ['ACTIVE', 'PENDING_APPROVAL', 'APPROVED_RETENTION', 'PURGED'],
                default: 'ACTIVE'
            },
            initiatedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                default: null
            },
            initiatedAt: {
                type: Date,
                default: null
            },
            approvals: [{
                approvedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                approvedAt: {
                    type: Date,
                    default: Date.now
                }
            }],
            approvedAt: {
                type: Date,
                default: null
            },
            vanishAt: {
                type: Date,
                default: null
            }
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
eventSchema.index({ endTime: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ featured: 1, startTime: 1 });
eventSchema.index({ registrationDeadline: 1 });
eventSchema.index({ createdAt: -1 });
eventSchema.index({ deletedAt: 1, isActive: 1 });

eventSchema.virtual('currentStatus').get(function () {
    const now = new Date();
    const endTime = this.endTimeAtEndOfDay;
    if (now < this.startTime) return 'Upcoming';
    if (now <= endTime) return 'Ongoing';
    return 'Ended';
});

eventSchema.virtual('duration').get(function () {
    if (!this.startTime || !this.endTime) return 0;
    return Math.floor((this.endTime - this.startTime) / (1000 * 60));
});

eventSchema.virtual('hasEnded').get(function () {
    return new Date() > this.endTimeAtEndOfDay;
});

// Treat a date saved at exactly midnight as an inclusive calendar end date.
eventSchema.virtual('endTimeAtEndOfDay').get(function () {
    const endTime = new Date(this.endTime);
    if (Number.isNaN(endTime.getTime())) return endTime;
    const ist = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).formatToParts(endTime).reduce((out, part) => ({ ...out, [part.type]: part.value }), {});
    if (ist.hour === '00' && ist.minute === '00' && ist.second === '00') {
        return new Date(`${ist.year}-${ist.month}-${ist.day}T23:59:59+05:30`);
    }
    return endTime;
});

eventSchema.virtual('isUpcoming').get(function () {
    return new Date() < this.startTime;
});

eventSchema.virtual('registrationCount').get(function () {
    return this.registrations?.length || 0;
});

eventSchema.virtual('isLive').get(function () {
    const now = new Date();
    return now >= this.startTime && now <= this.endTime && this.isActive;
});

eventSchema.virtual('isRegistrationOpen').get(function () {
    if (!this.registrationDeadline || this.isTBD) return false;
    const now = new Date();
    if (this.registrationStartDate && now < new Date(this.registrationStartDate)) return false;
    return now < this.registrationDeadline && this.isActive && this.deletedAt === null;
});

eventSchema.virtual('formattedDate').get(function () {
    if (!this.startTime) return null;
    return this.startTime.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
});

eventSchema.query.notDeleted = function () {
    return this.where({ deletedAt: null, isActive: true });
};

eventSchema.statics.getFeaturedEvents = async function (limit = 3) {
    return await this.find({
        featured: true,
        deletedAt: null,
        isActive: true,
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

eventSchema.pre('save', function (next) {
    const now = new Date();

    if (this.isTBD) {
        this.status = 'Upcoming';
    } else if (now < this.startTime) {
        this.status = 'Upcoming';
    } else if (now <= this.endTime) {
        this.status = 'Ongoing';
    } else {
        this.status = 'Ended';
        if (!this.endedAt) this.endedAt = now;
    }

    next();
});

eventSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    if (!update) return next();

    const startTime = update.startTime || update.$set?.startTime;
    const endTime = update.endTime || update.$set?.endTime;
    const isTBD = update.isTBD !== undefined ? update.isTBD : update.$set?.isTBD;

    const now = new Date();
    if (isTBD) {
        if (update.$set) update.$set.status = 'Upcoming';
        else update.status = 'Upcoming';
    } else if (startTime && endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        let status = 'Upcoming';
        if (now < start) {
            status = 'Upcoming';
        } else if (now <= end) {
            status = 'Ongoing';
        } else {
            status = 'Ended';
        }
        if (update.$set) update.$set.status = status;
        else update.status = status;
    }

    next();
});

export default mongoose.model('Event', eventSchema);
