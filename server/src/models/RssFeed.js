import mongoose from 'mongoose';

const rssFeedSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    websiteUrl: String,
    discoveredFrom: String,
    sourceType: { type: String, enum: ['rss'], default: 'rss' },
    category: { type: String, default: 'General' },
    active: { type: Boolean, default: true },
    lastFetchedAt: Date,
    lastStatus: { type: String, enum: ['idle', 'success', 'failed'], default: 'idle' },
    lastError: String
  },
  { timestamps: true }
);

export const RssFeed = mongoose.model('RssFeed', rssFeedSchema);
