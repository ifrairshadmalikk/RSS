import mongoose from 'mongoose';

const relatedArticleSchema = new mongoose.Schema(
  {
    title: String,
    link: String,
    source: String,
    publishedAt: Date
  },
  { _id: false }
);

const trendSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    country: { type: String, required: true, default: 'Global', index: true },
    mentions: { type: Number, default: 0 },
    previousMentions: { type: Number, default: 0 },
    growthRate: { type: Number, default: 0 },
    sentiment: { type: String, enum: ['Positive', 'Neutral', 'Negative'], default: 'Neutral' },
    score: { type: Number, default: 0 },
    isBreaking: { type: Boolean, default: false },
    relatedArticles: [relatedArticleSchema],
    history: [
      {
        mentions: Number,
        score: Number,
        capturedAt: { type: Date, default: Date.now }
      }
    ],
    lastUpdated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

trendSchema.index({ topic: 1, category: 1, country: 1 }, { unique: true });

export const Trend = mongoose.model('Trend', trendSchema);
