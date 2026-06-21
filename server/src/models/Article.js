import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: true },
    description: String,
    summary: String,
    source: { type: String, required: true, index: true },
    sourceFeed: { type: mongoose.Schema.Types.ObjectId, ref: 'RssFeed' },
    category: { type: String, index: true },
    country: { type: String, default: 'Global', index: true },
    sentiment: { type: String, enum: ['Positive', 'Neutral', 'Negative'], default: 'Neutral' },
    sentimentScore: { type: Number, default: 0 },
    keywords: [{ type: String, index: true }],
    link: { type: String, required: true, unique: true },
    image: String,
    publishedAt: { type: Date, index: true },
    aiProvider: String,
    raw: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

articleSchema.index({ title: 'text', summary: 'text', keywords: 'text', source: 'text', category: 'text', country: 'text' });

export const Article = mongoose.model('Article', articleSchema);
