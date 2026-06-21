import express from 'express';
import { fetchLiveTrends, TREND_CATEGORIES, TREND_COUNTRIES } from '../services/googleTrendsService.js';
import { buildTrendPdfBuffer } from '../services/pdfService.js';
import { detectTrends } from '../services/trendService.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const country = req.query.country || 'Global';
    const category = req.query.category || '';
    const limit = Number(req.query.limit || 50);
    res.json(await fetchLiveTrends({ country, category, limit }));
  } catch (error) {
    next(error);
  }
});

router.get('/countries', async (_req, res) => {
  res.json({ countries: TREND_COUNTRIES });
});

router.get('/categories', async (_req, res) => {
  res.json({ categories: TREND_CATEGORIES });
});

router.post('/refresh', async (_req, res, next) => {
  try {
    res.json(await detectTrends());
  } catch (error) {
    next(error);
  }
});

router.get('/export.pdf', async (req, res, next) => {
  try {
    const country = req.query.country || 'Global';
    const category = req.query.category || '';
    const limit = Number(req.query.limit || 50);
    const data = await fetchLiveTrends({ country, category, limit });
    const buffer = await buildTrendPdfBuffer({
      title: 'TrendWatch Trends Export',
      summary: `Live trend export for ${country}${category ? ` / ${category}` : ''}.`,
      trends: data.items || []
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="trendwatch-trends.pdf"');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

export default router;
