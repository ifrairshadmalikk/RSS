import express from 'express';
import { AiLog } from '../models/AiLog.js';
import { Article } from '../models/Article.js';
import { Notification } from '../models/Notification.js';
import { RssFeed } from '../models/RssFeed.js';
import { Trend } from '../models/Trend.js';

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalArticlesToday, totalSources, trendingTopicsCount, breakingNewsCount, sentimentAgg, categoryAgg, hourlyAgg, trends, aiLogs] = await Promise.all([
      Article.countDocuments({ publishedAt: { $gte: today } }),
      RssFeed.countDocuments({ active: true }),
      Trend.countDocuments(),
      Trend.countDocuments({ isBreaking: true }),
      Article.aggregate([{ $match: { publishedAt: { $gte: last24h } } }, { $group: { _id: '$sentiment', value: { $sum: 1 } } }]),
      Article.aggregate([{ $match: { publishedAt: { $gte: last24h } } }, { $group: { _id: '$category', value: { $sum: 1 } } }]),
      Article.aggregate([
        { $match: { publishedAt: { $gte: last24h } } },
        { $group: { _id: { $hour: '$publishedAt' }, articles: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Trend.find().sort({ score: -1 }).limit(8),
      AiLog.find().sort({ createdAt: -1 }).limit(20)
    ]);

    res.json({
      cards: { totalArticlesToday, totalSources, trendingTopicsCount, breakingNewsCount },
      charts: {
        sentiment: sentimentAgg.map((item) => ({ name: item._id || 'Neutral', value: item.value })),
        categories: categoryAgg.map((item) => ({ name: item._id || 'Uncategorized', value: item.value })),
        articlesPerHour: hourlyAgg.map((item) => ({ hour: `${item._id}:00`, articles: item.articles })),
        trendGrowth: trends.map((trend) => ({ topic: trend.topic, score: trend.score, growth: trend.growthRate }))
      },
      topTrends: trends,
      aiLogs,
      unreadNotifications: await Notification.countDocuments({ read: false })
    });
  } catch (error) {
    next(error);
  }
});

export default router;
