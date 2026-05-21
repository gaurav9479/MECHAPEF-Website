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
            validate: [validator.isEmail, 'Please provide a valid email address']
        },

        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false // Don't return password by default
        },

        role: {
            type: String,
            enum: {
                values: ROLES_ARRAY,
                message: `Role must be one of: ${ROLES_ARRAY.join(', ')}`
            },
            default: 'GeneralUser'
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        emailVerificationToken: {
            type: String,
            select: false
        },

        emailVerificationExpiry: {
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
            max: 4
        },

        branch: String,

        registeredEvents: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Registration'
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
            default: null // For soft delete
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
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1, deletedAt: 1 });

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
