import mongoose from 'mongoose';

const specialSponsorSchema = new mongoose.Schema({
  name: { type: String, default: 'Special Sponsor' },

  logoURL: { type: String, default: '' },
  logoFileId: { type: String, default: '' },
  tagline: { type: String, default: '' },


  navbarLogoURL: { type: String, default: '' },
  navbarCustomName: { type: String, default: '' },
  navbarCustomTagline: { type: String, default: '' },

  bubbleLogoURL: { type: String, default: '' },
  bubbleCustomName: { type: String, default: '' },
  bubbleCustomTagline: { type: String, default: '' },

  eventCardsLogoURL: { type: String, default: '' },
  eventCardsCustomName: { type: String, default: '' },
  eventCardsCustomTagline: { type: String, default: '' },

  teamTitleLogoURL: { type: String, default: '' },
  teamTitleCustomName: { type: String, default: '' },
  teamTitleCustomTagline: { type: String, default: '' },

  teamCardsLogoURL: { type: String, default: '' },
  teamCardsCustomName: { type: String, default: '' },
  teamCardsCustomTagline: { type: String, default: '' },

  emailLogoURL: { type: String, default: '' },
  emailCustomName: { type: String, default: '' },
  emailCustomTagline: { type: String, default: '' },

  sliderLogoURL: { type: String, default: '' },
  sliderCustomName: { type: String, default: '' },
  sliderCustomTagline: { type: String, default: '' },
  

  showCoBrandingLogo: { type: Boolean, default: true },
  showFloatingBubbles: { type: Boolean, default: true },
  showEventCardsLogo: { type: Boolean, default: true },
  showTeamTitleCoBranding: { type: Boolean, default: true },
  showTeamCardsLogo: { type: Boolean, default: true },
  showAnnouncementSliderLogo: { type: Boolean, default: true },
  includeInEmails: { type: Boolean, default: false },


  customFontUrl: { type: String, default: '' },
  customFontFamily: { type: String, default: '' },
  brandColor: { type: String, default: '#ff1f01' },
  applyBrandFont: { type: Boolean, default: false },
  
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const SpecialSponsor = mongoose.model('SpecialSponsor', specialSponsorSchema);
