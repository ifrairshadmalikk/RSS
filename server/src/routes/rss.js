import express from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { RssFeed } from '../models/RssFeed.js';
import { fetchAllFeeds, resolveFeedUrl } from '../services/rssService.js';

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const items = await RssFeed.find().sort({ name: 1 });
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.post('/add', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const body = z.object({ name: z.string().min(2), url: z.string().url(), category: z.string().default('General') }).parse(req.body);
    const resolved = await resolveFeedUrl(body.url);
    const item = await RssFeed.create({
      name: body.name,
      url: resolved.feedUrl,
      websiteUrl: resolved.websiteUrl,
      discoveredFrom: resolved.discoveredFrom,
      sourceType: resolved.sourceType,
      category: body.category
    });
    await RssFeed.deleteMany({ discoveredFrom: 'seed' });
    res.status(201).json({ item, resolved });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    await RssFeed.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.post('/fetch', requireAuth, requireRole('admin'), async (_req, res, next) => {
  try {
    res.json(await fetchAllFeeds());
  } catch (error) {
    next(error);
  }
});

export default router;
