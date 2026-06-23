import mongoose from 'mongoose';
import { REGISTRATION_TYPES_ARRAY, PAYMENT_STATUS_ARRAY } from '../constants/index.js';

const registrationSchema = new mongoose.Schema(
    {
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: [true, 'Event ID is required'],
            index: true
        },

        registeredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true
        },

        registrationType: {
            type: String,
            enum: {
                values: REGISTRATION_TYPES_ARRAY,
                message: `Registration type must be one of: ${REGISTRATION_TYPES_ARRAY.join(', ')}`
            },
            required: [true, 'Registration type is required']
        },

        teamName: {
            type: String,
            trim: true,
            validate: {
                validator: function (value) {
                    if (this.registrationType === 'Team') {
                        return value && value.length > 0;
                    }
                    return true;
                },
                message: 'Team name is required for team registrations'
            }
        },

        teamMembers: {
            type: [
                {
                    userId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'User'
                    },
                    name: String,
                    email: String,
                    joined: {
                        type: Date,
                        default: Date.now
                    }
                }
            ],
            validate: {
                validator: function (value) {
                    if (this.registrationType === 'Solo') {
                        return value.length === 0;
                    }
                    // Team size will be validated by event max team size
                    return value.length > 0;
                },
                message: 'Invalid team members for registration type'
            }
        },

        paymentStatus: {
            type: String,
            enum: {
                values: PAYMENT_STATUS_ARRAY,
                message: `Payment status must be one of: ${PAYMENT_STATUS_ARRAY.join(', ')}`
            },
            default: 'NotApplicable',
            index: true
        },

        paymentAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        transactionId: String,

        paymentDate: Date,

        attendanceMarked: {
            type: Boolean,
            default: false,
            index: true
        },

        attendanceMarkedAt: Date,

        attendanceMarkedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        certificateGenerated: {
            type: Boolean,
            default: false
        },

        certificateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Certificate'
        },

        notes: String,

        registeredAt: {
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

registrationSchema.index({ eventId: 1, registeredBy: 1, deletedAt: 1 }, { unique: true, sparse: true });

registrationSchema.index({ paymentStatus: 1, registeredAt: -1 });
registrationSchema.index({ attendanceMarked: 1, eventId: 1 });


registrationSchema.virtual('participantCount').get(function () {
    if (this.registrationType === 'Solo') return 1;
    return this.teamMembers.length + 1; // +1 for registered user
});


registrationSchema.pre('save', async function (next) {
    try {
        // Check for duplicate registration
        if (this.isNew) {
            const existing = await mongoose.model('Registration').findOne({
                eventId: this.eventId,
                registeredBy: this.registeredBy,
                deletedAt: null
            });

            if (existing) {
                throw new Error('User is already registered for this event');
            }
        }
        if (this.registrationType === 'Team' && this.teamMembers.length === 0) {
            throw new Error('Team registration must have at least one team member');
        }

        next();
    } catch (error) {
        next(error);
    }
});
registrationSchema.query.notDeleted = function () {
    return this.where({ deletedAt: null });
};

registrationSchema.statics.getEventRegistrationCount = async function (eventId) {
    return await this.countDocuments({
        eventId,
        deletedAt: null
    });
};

registrationSchema.statics.getEventAttendeeCount = async function (eventId) {
    return await this.countDocuments({
        eventId,
        attendanceMarked: true,
        deletedAt: null
    });
};

export default mongoose.model('Registration', registrationSchema);
