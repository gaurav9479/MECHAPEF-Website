import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Announcement title is required'],
            trim: true,
            maxlength: [150, 'Title cannot exceed 150 characters']
        },

        description: {
            type: String,
            required: [true, 'Announcement description is required'],
            maxlength: [1000, 'Description cannot exceed 1000 characters']
        },

        imageURL: {
            type: String,
            default: null
        },

        bannerURL: {
            type: String,
            default: null
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true
        },

        displayOrder: {
            type: Number,
            default: 0,
            index: true
        },

        targetLink: String,

        targetType: {
            type: String,
            enum: ['Event', 'External', 'Internal', 'None'],
            default: 'None'
        },

        targetId: mongoose.Schema.Types.ObjectId,

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        views: {
            type: Number,
            default: 0
        },

        startDate: {
            type: Date,
            default: Date.now
        },

        endDate: Date,

        priority: {
            type: String,
            enum: ['Low', 'Medium', 'High'],
            default: 'Medium'
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
        timestamps: true
    }
);

announcementSchema.index({ isActive: 1, displayOrder: 1 });
announcementSchema.index({ startDate: 1, endDate: 1 });
announcementSchema.index({ priority: 1 });

announcementSchema.query.active = function () {
    return this.where({
        deletedAt: null,
        isActive: true,
        startDate: { $lte: new Date() }
    }).or([{ endDate: null }, { endDate: { $gte: new Date() } }]);
};

export default mongoose.model('Announcement', announcementSchema);
