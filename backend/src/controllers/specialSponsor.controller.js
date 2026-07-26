import { SpecialSponsor } from '../models/specialSponsor.model.js';
import ImageKit from 'imagekit';
import ApiError from '../utils/ApiError.js';
import APIResponse from '../utils/APIResponse.js';

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// Get the active special sponsor (public)
export const getActiveSpecialSponsor = async (req, res) => {
  try {
    const sponsor = await SpecialSponsor.findOne({ isActive: true });
    res.status(200).json(new APIResponse(200, sponsor, 'Active special sponsor fetched'));
  } catch (error) {
    res.status(500).json(new ApiError(500, 'Error fetching active special sponsor'));
  }
};

// Create or update special sponsor (Admin only)
export const upsertSpecialSponsor = async (req, res) => {
  try {
    const { 
      name, logoURL, logoFileId, tagline, 
      showCoBrandingLogo, showFloatingBubbles, showEventCardsLogo, showTeamTitleCoBranding, showTeamCardsLogo, includeInEmails,
      customFontUrl, customFontFamily, brandColor, applyBrandFont
    } = req.body;

    let sponsor = await SpecialSponsor.findOne();

    if (sponsor) {
      if (logoFileId && sponsor.logoFileId !== logoFileId) {
        try {
          await imagekit.deleteFile(sponsor.logoFileId);
        } catch (e) {
          console.error("Failed to delete old special sponsor logo", e);
        }
      }
      
      sponsor.name = name;
      if (logoURL) sponsor.logoURL = logoURL;
      if (logoFileId) sponsor.logoFileId = logoFileId;
      sponsor.tagline = tagline || '';
      sponsor.showCoBrandingLogo = showCoBrandingLogo ?? true;
      sponsor.showFloatingBubbles = showFloatingBubbles ?? true;
      sponsor.showEventCardsLogo = showEventCardsLogo ?? true;
      sponsor.showTeamTitleCoBranding = showTeamTitleCoBranding ?? true;
      sponsor.showTeamCardsLogo = showTeamCardsLogo ?? true;
      sponsor.includeInEmails = includeInEmails ?? false;
      sponsor.customFontUrl = customFontUrl || '';
      sponsor.customFontFamily = customFontFamily || '';
      sponsor.brandColor = brandColor || '#ff1f01';
      sponsor.applyBrandFont = applyBrandFont ?? false;
      sponsor.isActive = true;

      await sponsor.save();
    } else {
      sponsor = await SpecialSponsor.create({
        name, logoURL, logoFileId, tagline, 
        showCoBrandingLogo, showFloatingBubbles, showEventCardsLogo, showTeamTitleCoBranding, showTeamCardsLogo, includeInEmails,
        customFontUrl, customFontFamily, brandColor, applyBrandFont,
        isActive: true
      });
    }

    res.status(200).json(new APIResponse(200, sponsor, 'Special sponsor updated successfully'));
  } catch (error) {
    res.status(500).json(new ApiError(500, error.message || 'Error updating special sponsor'));
  }
};

// Delete special sponsor (Admin only)
export const deleteSpecialSponsor = async (req, res) => {
  try {
    const sponsor = await SpecialSponsor.findOne();
    if (!sponsor) {
      return res.status(404).json(new ApiError(404, 'No special sponsor found'));
    }

    try {
      await imagekit.deleteFile(sponsor.logoFileId);
    } catch (e) {
      console.error("Failed to delete special sponsor logo", e);
    }

    await SpecialSponsor.deleteOne({ _id: sponsor._id });
    res.status(200).json(new APIResponse(200, null, 'Special sponsor deleted'));
  } catch (error) {
    res.status(500).json(new ApiError(500, 'Error deleting special sponsor'));
  }
};
