import bcrypt from 'bcryptjs';
import { Article } from '../models/Article.js';
import { RssFeed } from '../models/RssFeed.js';
import { Trend } from '../models/Trend.js';
import { User } from '../models/User.js';

const defaultFeeds = [
  {
    name: 'Reuters Business',
    url: 'https://feeds.reuters.com/reuters/businessNews',
    websiteUrl: 'https://www.reuters.com/business/',
    discoveredFrom: 'seed',
    category: 'Business',
    roleAudience: 'all'
  },
  {
    name: 'BBC World',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    websiteUrl: 'https://www.bbc.com/news/world',
    discoveredFrom: 'seed',
    category: 'General',
    roleAudience: 'all'
  }
];

const seededArticles = [
  {
    title: 'Cloud infrastructure spending rises as companies expand data products',
    source: 'Reuters Business',
    category: 'Business',
    sentiment: 'Positive',
    sentimentScore: 0.48,
    keywords: ['cloud infrastructure', 'data products', 'enterprise spending'],
    summary: 'Enterprise technology teams are expanding cloud capacity for analytics, AI, and customer intelligence platforms.',
    link: 'https://seed.trend-monitor.local/articles/cloud-spending'
  },
  {
    title: 'Election security teams increase monitoring before regional votes',
    source: 'BBC World',
    category: 'Politics',
    sentiment: 'Neutral',
    sentimentScore: 0.04,
    keywords: ['election security', 'regional votes', 'monitoring'],
    summary: 'Officials are coordinating incident response teams and public information channels before upcoming elections.',
    link: 'https://seed.trend-monitor.local/articles/election-security'
  },
  {
    title: 'Hospitals test predictive dashboards for emergency room demand',
    source: 'Reuters Business',
    category: 'Health',
    sentiment: 'Positive',
    sentimentScore: 0.41,
    keywords: ['hospital dashboards', 'emergency demand', 'predictive analytics'],
    summary: 'Hospital operations teams are testing predictive dashboards to forecast demand and allocate staff earlier.',
    link: 'https://seed.trend-monitor.local/articles/hospital-dashboards'
  },
  {
    title: 'Streaming platforms compete for live sports rights in new markets',
    source: 'BBC World',
    category: 'Sports',
    sentiment: 'Neutral',
    sentimentScore: 0.08,
    keywords: ['streaming platforms', 'sports rights', 'new markets'],
    summary: 'Media groups are bidding for sports rights as streaming services chase recurring audiences.',
    link: 'https://seed.trend-monitor.local/articles/sports-streaming'
  }
];

const seededTrends = [
  { topic: 'Cloud infrastructure', category: 'Business', country: 'Global', mentions: 14, previousMentions: 10, growthRate: 40, score: 198, sentiment: 'Positive', isBreaking: false },
  { topic: 'Election security', category: 'Politics', country: 'Global', mentions: 12, previousMentions: 6, growthRate: 100, score: 220, sentiment: 'Neutral', isBreaking: true },
  { topic: 'Emergency room demand', category: 'Health', country: 'Global', mentions: 8, previousMentions: 4, growthRate: 100, score: 176, sentiment: 'Positive', isBreaking: false }
];

async function ensureSingleAdmin(preferredAdmin = null) {
  const admins = await User.find({ role: 'admin' }).sort({ createdAt: 1 });
  if (admins.length <= 1) return;

  const keep = preferredAdmin?._id
    ? preferredAdmin
    : admins[0];

  await User.updateMany(
    { _id: { $ne: keep._id }, role: 'admin' },
    { $set: { role: 'viewer' } }
  );
}

export async function bootstrapAdminFromEnv() {
  const isProduction = process.env.NODE_ENV === 'production';
  const adminName = process.env.ADMIN_NAME || 'Admin';
  const adminEmail = process.env.ADMIN_EMAIL || (isProduction ? '' : 'admin@trends.local');
  const adminPassword = process.env.ADMIN_PASSWORD || (isProduction ? '' : 'admin123456');

  let primaryAdmin = null;

  if (adminEmail && adminPassword) {
    const email = adminEmail.toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      const updates = {};
      if (existing.role !== 'admin') updates.role = 'admin';
      if (adminName && existing.name !== adminName) updates.name = adminName;
      primaryAdmin = Object.keys(updates).length
        ? await User.findByIdAndUpdate(existing._id, updates, { new: true })
        : existing;
    } else {
      primaryAdmin = await User.create({
        name: adminName,
        email,
        password: await bcrypt.hash(adminPassword, 12),
        role: 'admin'
      });
    }
  }

  await ensureSingleAdmin(primaryAdmin);
}

export async function bootstrapDefaultContent() {
  const adminFeedCount = await RssFeed.countDocuments({ discoveredFrom: { $ne: 'seed' } });
  if (adminFeedCount > 0) {
    await RssFeed.deleteMany({ discoveredFrom: 'seed' });
    return;
  }

  const feedsByName = new Map();

  for (const feed of defaultFeeds) {
    const item = await RssFeed.findOneAndUpdate(
      { url: feed.url },
      { $setOnInsert: { ...feed, sourceType: 'rss', active: true, lastStatus: 'idle' } },
      { new: true, upsert: true }
    );
    feedsByName.set(item.name, item);
  }

  const now = Date.now();
  for (const [index, article] of seededArticles.entries()) {
    const sourceFeed = feedsByName.get(article.source)?._id;
    const publishedAt = new Date(now - index * 2 * 60 * 60 * 1000);
    await Article.findOneAndUpdate(
      { link: article.link },
      {
        $set: { publishedAt },
        $setOnInsert: {
          ...article,
          sourceFeed,
          country: article.category === 'Search Trends' ? 'US' : 'Global',
          description: article.summary,
          aiProvider: 'seed',
          raw: { seeded: true }
        }
      },
      { upsert: true }
    );
  }

  for (const trend of seededTrends) {
    const relatedArticles = seededArticles
      .filter((article) => article.category === trend.category || article.keywords.some((keyword) => trend.topic.toLowerCase().includes(keyword.toLowerCase().split(' ')[0])))
      .slice(0, 5)
      .map((article, index) => ({
        title: article.title,
        link: article.link,
        source: article.source,
        publishedAt: new Date(now - index * 2 * 60 * 60 * 1000)
      }));

    await Trend.findOneAndUpdate(
      { topic: trend.topic, category: trend.category, country: trend.country },
      {
        $set: {
          relatedArticles,
          history: [
            { mentions: Math.max(1, trend.previousMentions), score: Math.max(20, trend.score - 70), capturedAt: new Date(now - 12 * 60 * 60 * 1000) },
            { mentions: trend.mentions, score: trend.score, capturedAt: new Date(now) }
          ],
          lastUpdated: new Date(now)
        },
        $setOnInsert: {
          ...trend
        }
      },
      { upsert: true }
    );
  }
}
