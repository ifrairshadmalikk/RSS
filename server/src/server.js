//imports 
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { bootstrapAdminFromEnv, bootstrapDefaultContent } from './config/bootstrap.js';
import { connectDatabase } from './config/database.js';
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

const clientOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((value) => value.trim()).filter(Boolean)
  : null;

// CORS first, before any other middleware
app.use(cors({
  origin: ['https://rss-client-eight.vercel.app', 'http://localhost:5173'],
  credentials: true
}));

let initPromise = null;

async function ensureReady() {
  if (mongoose.connection.readyState !== 0) {
    return;
  }

  if (!initPromise) {
    initPromise = (async () => {
      await connectDatabase();
      await bootstrapAdminFromEnv();
      await bootstrapDefaultContent();
    })().catch((error) => {
      initPromise = null;
      throw error;
    });
  }

  return initPromise;
}

app.use(async (req, res, next) => {
  // Skip database initialization for health checks and preflight requests
  if (req.path === '/api/health' || req.method === 'OPTIONS') {
    return next();
  }

  try {
    await ensureReady();
    next();
  } catch (error) {
    next(error);
  }
});

app.use(helmet());
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

app.get('/', (_req, res) => {
  res.json({ message: 'TrendWatch API is running', status: 'ok' });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    databaseConfigured: Boolean(process.env.MONGODB_URI)
  });
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

export default app;
