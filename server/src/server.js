import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import assistantRoutes from './routes/assistant.js';
import articleRoutes from './routes/articles.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import notificationRoutes from './routes/notifications.js';
import profileRoutes from './routes/profile.js';
import rssRoutes from './routes/rss.js';
import searchRoutes from './routes/search.js';
import trendRoutes from './routes/trends.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/assistant', assistantRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/trends', trendRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/rss', rssRoutes);
app.use('/api/search', searchRoutes);

app.use(errorHandler);
