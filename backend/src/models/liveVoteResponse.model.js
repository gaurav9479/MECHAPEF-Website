import mongoose from 'mongoose';

const liveVoteResponseSchema = new mongoose.Schema(
    {
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: true,
            index: true
        },
        questionId: {
            type: String,
            required: true,
            index: true
        },
        participantId: {
            type: String,
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        selectedOption: {
            type: String,
            required: true
        },
        submittedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

liveVoteResponseSchema.index(
    { eventId: 1, questionId: 1, participantId: 1 },
    { unique: true }
);

export default mongoose.model('LiveVoteResponse', liveVoteResponseSchema);
