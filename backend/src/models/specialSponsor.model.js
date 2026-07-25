import mongoose from 'mongoose';

const specialSponsorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logoURL: { type: String, required: true },
  logoFileId: { type: String, required: true },
  tagline: { type: String, default: '' },
  
  // Display feature toggles
  showFloatingBubbles: { type: Boolean, default: false },
  includeInEmails: { type: Boolean, default: false },
  
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const SpecialSponsor = mongoose.model('SpecialSponsor', specialSponsorSchema);
