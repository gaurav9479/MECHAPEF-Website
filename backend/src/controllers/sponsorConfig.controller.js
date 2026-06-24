import { SponsorConfig } from '../models/sponsorConfig.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import APIResponse from '../utils/APIResponse.js';

const getDefaultConfig = () => ({
  tiers: [
    { name: 'Platinum', icon: 'FaMedal', description: 'Flagship partners with premium visibility across the MechaPEF ecosystem.', order: 1 },
    { name: 'Gold', icon: 'FaLayerGroup', description: 'High-impact partners featured across events, workshops, and digital channels.', order: 2 },
    { name: 'Silver', icon: 'FaHandshake', description: 'Community partners helping us widen access to technical learning and collaboration.', order: 3 },
  ],
  deliverables: [
    { title: 'Brand Visibility', icon: 'FaBullhorn', description: 'Prominent logo placement across event pages, banners, sessions, and social promotions.', order: 1 },
    { title: 'Student Connect', icon: 'FaUsers', description: 'Engage with a focused mechanical and production engineering student community.', order: 2 },
    { title: 'Event Integration', icon: 'FaLayerGroup', description: 'Partner presence in workshops, competitions, showcases, and department initiatives.', order: 3 },
  ]
});

export const getConfig = asyncHandler(async (req, res) => {
  let config = await SponsorConfig.findOne();
  
  if (!config) {
    config = await SponsorConfig.create(getDefaultConfig());
  }

  res.status(200).json(new APIResponse(200, config, 'Sponsor config retrieved successfully'));
});

export const updateConfig = asyncHandler(async (req, res) => {
  const { tiers, deliverables } = req.body;

  let config = await SponsorConfig.findOne();
  
  if (!config) {
    config = new SponsorConfig();
  }

  if (tiers) config.tiers = tiers;
  if (deliverables) config.deliverables = deliverables;

  await config.save();

  res.status(200).json(new APIResponse(200, config, 'Sponsor config updated successfully'));
});
