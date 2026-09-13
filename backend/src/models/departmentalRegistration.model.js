import mongoose from 'mongoose';

const departmentalRegistrationSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    phoneNumber: { type: String, required: true, trim: true, maxlength: 20 },
    collegeRegNo: { type: String, required: true, trim: true, uppercase: true, index: true },
    collegeEmail: { type: String, required: true, trim: true, lowercase: true },
    qrTokenHash: { type: String, required: true, unique: true, index: true },
    firstScannedAt: { type: Date, default: null },
    lastScannedAt: { type: Date, default: null },
    scanCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

departmentalRegistrationSchema.index({ eventId: 1, collegeRegNo: 1 }, { unique: true });

export default mongoose.model('DepartmentalRegistration', departmentalRegistrationSchema);
