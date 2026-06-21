import express from 'express';
import { Article } from '../models/Article.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Number(req.query.limit || 12), 50);
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.source) filter.source = req.query.source;
    if (req.query.sentiment) filter.sentiment = req.query.sentiment;
    if (req.query.q) filter.$text = { $search: req.query.q };
    const [items, total] = await Promise.all([
      Article.find(filter).sort({ publishedAt: -1 }).skip((page - 1) * limit).limit(limit),
      Article.countDocuments(filter)
    ]);
    res.json({ items, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    next(error);
  }
});

export default router;
