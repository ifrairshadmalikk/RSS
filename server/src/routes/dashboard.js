import express from 'express';
import { demoDashboard, withDemoDashboardFallback } from '../config/demoDashboard.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
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

    const [totalArticlesToday, totalSources, trendingTopicsCount, breakingNewsCount, sentimentAgg, categoryAgg, hourlyAgg, trends] = await Promise.all([
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
      Trend.find().sort({ score: -1 }).limit(8)
    ]);

    const charts = {
      sentiment: sentimentAgg.map((item) => ({ name: item._id || 'Neutral', value: item.value })),
      categories: categoryAgg.map((item) => ({ name: item._id || 'Uncategorized', value: item.value })),
      articlesPerHour: hourlyAgg.map((item) => ({ hour: `${item._id}:00`, articles: item.articles })),
      trendGrowth: trends.map((trend) => ({ topic: trend.topic, score: trend.score, growth: trend.growthRate }))
    };

    const cards = { totalArticlesToday, totalSources, trendingTopicsCount, breakingNewsCount };
    const { cards: resolvedCards, charts: resolvedCharts } = withDemoDashboardFallback(cards, charts);
    const cardsEmpty = Object.values(resolvedCards).every((value) => !value);
    const finalCards = cardsEmpty ? demoDashboard.cards : {
      totalArticlesToday: resolvedCards.totalArticlesToday || demoDashboard.cards.totalArticlesToday,
      totalSources: resolvedCards.totalSources || demoDashboard.cards.totalSources,
      trendingTopicsCount: resolvedCards.trendingTopicsCount || demoDashboard.cards.trendingTopicsCount,
      breakingNewsCount: resolvedCards.breakingNewsCount || demoDashboard.cards.breakingNewsCount
    };

    res.json({
      cards: finalCards,
      charts: resolvedCharts,
      topTrends: trends.length ? trends : [],
      unreadNotifications: await Notification.countDocuments({ read: false })
    });
  } catch (error) {
    next(error);
  }
});

router.get('/ai-logs', requireAuth, requireRole('admin'), async (_req, res, next) => {
  try {
    const items = await AiLog.find({ message: { $not: /GEMINI_API_KEY/ } }).sort({ createdAt: -1 }).limit(20);
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

export default router;
