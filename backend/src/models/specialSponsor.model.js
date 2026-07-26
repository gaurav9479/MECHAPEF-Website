import mongoose from 'mongoose';

const specialSponsorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logoURL: { type: String, required: true },
  logoFileId: { type: String, required: true },
  tagline: { type: String, default: '' },
  
  // Display feature toggles
  showCoBrandingLogo: { type: Boolean, default: true },
  showFloatingBubbles: { type: Boolean, default: true },
  showEventCardsLogo: { type: Boolean, default: true },
  showTeamTitleCoBranding: { type: Boolean, default: true },
  showTeamCardsLogo: { type: Boolean, default: true },
  includeInEmails: { type: Boolean, default: false },

  // Brand Font & Styling Takeover
  customFontUrl: { type: String, default: '' },
  customFontFamily: { type: String, default: '' },
  brandColor: { type: String, default: '#ff1f01' },
  applyBrandFont: { type: Boolean, default: false },
  
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const SpecialSponsor = mongoose.model('SpecialSponsor', specialSponsorSchema);
