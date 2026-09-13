import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import validator from 'validator';
import { ROLES_ARRAY } from '../constants/index.js';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [50, 'Name cannot exceed 50 characters']
        },

        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            validate: {
                validator: function (value) {

                    return /^[a-z]+\.[0-9]+@mnnit\.ac\.in$/.test(value);
                },
                message: 'Only MNNIT emails are allowed. Format: firstname.regno@mnnit.ac.in'
            }
        },

        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false
        },


        collegeRegNo: {
            type: String,
            trim: true,
            uppercase: true,
            unique: true,
            sparse: true,
            validate: {
                validator: function (value) {

                    if (!value) return true;

                    return /^[A-Z0-9]{4,20}$/.test(value);
                },
                message: 'College registration number must be 4-20 alphanumeric characters'
            }
        },

        role: {
            type: String,
            enum: {
                values: ROLES_ARRAY,
                message: `Role must be one of: ${ROLES_ARRAY.join(', ')}`
            },
            default: 'general-user'
        },

        requestedRole: {
            type: String,
            enum: {
                values: ROLES_ARRAY,
                message: `Requested Role must be one of: ${ROLES_ARRAY.join(', ')}`
            },
            default: null
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        unverifiedRequestExpiresAt: {
            type: Date
        },

        emailVerificationToken: {
            type: String,
            select: false
        },

        emailVerificationExpiry: {
            type: Date,
            select: false
        },

        resetPasswordToken: {
            type: String,
            select: false
        },

        resetPasswordExpire: {
            type: Date,
            select: false
        },

        profileImage: {
            type: String,
            default: null
        },

        phoneNumber: {
            type: String,
            validate: {
                validator: (value) => !value || validator.isMobilePhone(value),
                message: 'Please provide a valid phone number'
            }
        },

        yearOfStudy: {
            type: Number,
            min: 1,
            max: 5 // Allow 5 for Alumni
        },

        branch: String,

        assignedEvent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            default: null
        },

        assignedStage: {
            type: String,
            trim: true,
            default: null
        },

        githubURL: {
            type: String,
            trim: true
        },

        linkedinURL: {
            type: String,
            default: null
        },

        otherLinks: {
            type: String,
            default: null
        },

        sessionVersion: {
            type: Number,
            default: 1
        },

        registeredEvents: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Registration'
        }],

        participatedEventNames: [{
            type: String
        }],

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
        },

        lastLogin: Date,

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1, deletedAt: 1 });
userSchema.index({ unverifiedRequestExpiresAt: 1 }, { expireAfterSeconds: 0 });

userSchema.virtual('initials').get(function () {
    const names = this.name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase();
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcryptjs.genSalt(10);
        this.password = await bcryptjs.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.pre('save', function (next) {
    if (this.isModified()) {
        this.updatedAt = Date.now();
    }
    next();
});

userSchema.methods.comparePassword = async function (incomingPassword) {
    return await bcryptjs.compare(incomingPassword, this.password);
};

userSchema.methods.getPublicProfile = function () {
    const user = this.toObject();
    delete user.password;
    delete user.emailVerificationToken;
    delete user.emailVerificationExpiry;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpire;

    if (user.branch) {
        const b = user.branch.toLowerCase();
        user.isMechaPefMember = b.includes('mechanical') || b.includes('production') || b.includes('pie');
        user.memberTag = user.isMechaPefMember ? 'Member' : 'Non-Member';
    } else {
        user.isMechaPefMember = false;
        user.memberTag = 'Non-Member';
    }

    return user;
};

userSchema.query.notDeleted = function () {
    return this.where({ deletedAt: null });
};

userSchema.statics.softDelete = async function (userId) {
    return await this.findByIdAndUpdate(
        userId,
        { deletedAt: Date.now(), isActive: false },
        { new: true }
    );
};

export default mongoose.model('User', userSchema);
