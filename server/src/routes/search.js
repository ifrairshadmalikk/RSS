import express from 'express';
import { Article } from '../models/Article.js';
import { Trend } from '../models/Trend.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const articleFilter = q ? { $text: { $search: q } } : {};
    const trendFilter = q ? { topic: new RegExp(q, 'i') } : {};
    const [articles, trends] = await Promise.all([
      Article.find(articleFilter).sort({ publishedAt: -1 }).limit(20),
      Trend.find(trendFilter).sort({ score: -1 }).limit(20)
    ]);
    res.json({ articles, trends });
  } catch (error) {
    next(error);
  }
});

export default router;
