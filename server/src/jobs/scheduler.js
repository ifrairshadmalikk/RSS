import cron from 'node-cron';
import { fetchAllFeeds } from '../services/rssService.js';
import { detectTrends } from '../services/trendService.js';

export function startSchedulers() {
  cron.schedule('*/10 * * * *', () => {
    fetchAllFeeds().catch((error) => console.error('RSS scheduler failed', error));
  });

  cron.schedule('*/15 * * * *', () => {
    detectTrends().catch((error) => console.error('Trend detection failed', error));
  });

  setTimeout(() => {
    fetchAllFeeds().catch((error) => console.error('Initial RSS fetch failed', error));
  }, 2000);
}
