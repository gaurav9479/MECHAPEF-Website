import mongoose from 'mongoose';

const tierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, required: true },
  description: { type: String, required: true },
  order: { type: Number, default: 0 }
});

const deliverableSchema = new mongoose.Schema({
  title: { type: String, required: true },
  icon: { type: String, required: true },
  description: { type: String, required: true },
  order: { type: Number, default: 0 }
});

const sponsorConfigSchema = new mongoose.Schema(
  {
    tiers: [tierSchema],
    deliverables: [deliverableSchema],
  },
  { timestamps: true }
);

export const SponsorConfig = mongoose.model('SponsorConfig', sponsorConfigSchema);
