# 📖 TrendWatch - Complete Code Documentation

## Table of Contents
1. [Authentication System](#authentication-system)
2. [Article Analysis Pipeline](#article-analysis-pipeline)
3. [Trend Detection Algorithm](#trend-detection-algorithm)
4. [Frontend Architecture](#frontend-architecture)
5. [API Route Handlers](#api-route-handlers)

---

## Authentication System

### 1. Login/Register Flow

**Frontend: `client/src/components/AuthContext.jsx`**
```javascript
export function login(email, password) {
  // 1. Send credentials to backend
  const response = await api.post('/auth/login', { email, password });
  
  // 2. Backend returns { token, user }
  const { token, user } = response.data;
  
  // 3. Store in localStorage
  localStorage.setItem('trend_token', token);
  localStorage.setItem('trend_user', JSON.stringify(user));
  
  // 4. Update React state
  setUser(user);
  setToken(token);
}

export function signup(name, email, password) {
  // Similar to login but for registration
  const response = await api.post('/auth/register', { name, email, password });
  // ... same storage logic
}

// Auto-restore session on app mount
useEffect(() => {
  const token = localStorage.getItem('trend_token');
  if (token) {
    // Verify token is still valid
    api.get('/auth/me').then(res => setUser(res.data));
  }
}, []);
```

**Backend: `server/src/routes/auth.js`**
```javascript
// POST /api/auth/register
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    
    // 1. Validate input
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6)
    });
    const validated = schema.parse(req.body);
    
    // 2. Check if user exists
    const existing = await User.findOne({ email: validated.email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    
    // 3. Hash password
    const hashed = await bcrypt.hash(validated.password, 12);
    
    // 4. Create user
    const user = await User.create({
      name: validated.name,
      email: validated.email,
      password: hashed,
      role: 'viewer' // Default role
    });
    
    // 5. Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // 6. Return token + user
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    
    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    // 2. Compare password with hash
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
    
    // 3. Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // 4. Return token + user
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/auth/me (Protected)
export async function getMe(req, res) {
  // req.user is set by auth middleware
  res.json(req.user);
}
```

**Frontend: `client/src/api/client.js` (JWT Interceptor)**
```javascript
// Axios interceptor adds JWT to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('trend_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 (token expired) by redirecting to login
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('trend_token');
      localStorage.removeItem('trend_user');
      window.location.href = '/login';
    }
    throw error;
  }
);
```

**Backend: `server/src/middleware/auth.js` (JWT Verification)**
```javascript
export async function requireAuth(req, res, next) {
  try {
    // 1. Extract token from Authorization header
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token' });
    }
    
    const token = auth.slice(7); // Remove "Bearer "
    
    // 2. Verify JWT signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Fetch user from database
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    
    // 4. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

---

## Article Analysis Pipeline

### 1. RSS Feed Fetching

**Backend: `server/src/services/rssService.js`**
```javascript
import Parser from 'rss-parser';

export async function fetchAndAnalyzeFeeds() {
  const feeds = await RssFeed.find({ status: 'active' });
  
  for (const feed of feeds) {
    try {
      // 1. Fetch RSS feed
      const parser = new Parser();
      const parsed = await parser.parseURL(feed.url);
      
      // 2. Get new articles (only those not in DB)
      for (const item of parsed.items) {
        const exists = await Article.findOne({ link: item.link });
        if (exists) continue;
        
        // 3. Extract article data
        const article = {
          title: item.title,
          description: item.content || item.summary,
          source: feed.name,
          sourceFeed: feed._id,
          link: item.link,
          publishedAt: new Date(item.pubDate),
          image: item.image?.url || null,
          raw: item
        };
        
        // 4. Send to Gemini AI for analysis
        const analysis = await geminiAnalysis(article);
        
        // 5. Combine and save
        await Article.create({
          ...article,
          summary: analysis.summary,
          keywords: analysis.keywords,
          sentiment: analysis.sentiment,
          sentimentScore: analysis.sentimentScore,
          category: analysis.category,
          country: analysis.country,
          aiProvider: 'gemini'
        });
      }
      
      // 6. Update feed's last fetch time
      feed.lastFetchedAt = new Date();
      feed.status = 'active';
      await feed.save();
    } catch (error) {
      feed.status = 'error';
      feed.error = error.message;
      await feed.save();
    }
  }
}
```

### 2. Gemini AI Article Analysis

**Backend: `server/src/services/aiService.js`**
```javascript
export async function geminiAnalysis(article) {
  const model = 'gemini-1.5-flash';
  const apiKey = process.env.GEMINI_API_KEY;
  
  // 1. Build prompt for analysis
  const prompt = `Analyze this news article and return ONLY a JSON object with these fields:
- summary: brief 1-2 sentence summary
- keywords: array of 5-8 important keywords
- sentiment: "Positive", "Negative", or "Neutral"
- sentimentScore: number from -2 to 2
- category: one of [Technology, Cryptocurrency, Politics, Business, Sports, Health, Entertainment, Science, War, Disaster, Climate, Culture, Education, Travel]
- country: the country/region this article is about, or "Global"

Article: ${JSON.stringify(article)}`;

  // 2. Call Gemini API
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );
  
  // 3. Parse response
  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  const result = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
  
  // 4. Return structured analysis
  return {
    summary: result.summary || article.description.slice(0, 240),
    keywords: result.keywords || [],
    sentiment: result.sentiment || 'Neutral',
    sentimentScore: result.sentimentScore || 0,
    category: result.category || 'Business',
    country: result.country || 'Global'
  };
}

// API CALL TIME: ~100-200ms per article
```

---

## Trend Detection Algorithm

### 1. Automated Trend Detection

**Backend: `server/src/services/trendService.js`**
```javascript
export async function detectTrends() {
  // 1. Get recent articles (last 24 hours, max 2000)
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const articles = await Article.find({ publishedAt: { $gte: last24h } })
    .sort({ publishedAt: -1 })
    .limit(2000);
  
  if (articles.length === 0) return { topics: 0 };
  
  // 2. Call Gemini AI to detect trends
  const aiTrends = await detectTrendsWithAi(articles);
  
  // 3. Process each trend
  const writes = [];
  const threshold = Number(process.env.TREND_NOTIFICATION_THRESHOLD || 5);
  
  for (const aiTrend of aiTrends) {
    const topic = aiTrend.topic?.trim() || '';
    if (!topic || topic.length < 2) continue;
    
    // Find related articles by keyword matching
    const related = articles
      .filter(a => {
        const text = `${a.title} ${(a.keywords || []).join(' ')}`.toLowerCase();
        return text.includes(topic.toLowerCase());
      })
      .slice(0, 10)
      .map(a => ({
        title: a.title,
        link: a.link,
        source: a.source,
        publishedAt: a.publishedAt
      }));
    
    // Calculate dominant sentiment from related articles
    const sentiment = calculateSentiment(related);
    
    // Try to find existing trend
    const existingTrend = await Trend.findOne({
      topic,
      category: aiTrend.category,
      country: aiTrend.country
    });
    
    if (existingTrend) {
      // 4a. Update existing trend
      existingTrend.previousMentions = existingTrend.mentions;
      existingTrend.mentions = related.length;
      existingTrend.growthRate = 
        ((related.length - existingTrend.previousMentions) / 
         existingTrend.previousMentions * 100) || 0;
      existingTrend.isBreaking = existingTrend.growthRate > threshold;
      existingTrend.sentiment = sentiment;
      existingTrend.relatedArticles = related;
      existingTrend.lastUpdated = new Date();
      
      // Track history
      existingTrend.history.push({
        mentions: related.length,
        score: existingTrend.score,
        capturedAt: new Date()
      });
      
      writes.push(existingTrend.save());
    } else {
      // 4b. Create new trend
      writes.push(Trend.create({
        topic,
        category: aiTrend.category || 'Business',
        country: aiTrend.country || 'Global',
        mentions: related.length,
        previousMentions: 0,
        growthRate: 100, // New trend = 100% growth
        sentiment,
        score: related.length,
        isBreaking: true, // New trending topics are breaking
        relatedArticles: related,
        history: [{
          mentions: related.length,
          score: related.length,
          capturedAt: new Date()
        }]
      }));
    }
  }
  
  // 5. Execute all updates
  await Promise.all(writes);
  
  // 6. Generate notifications for breaking news
  await generateNotifications();
  
  return { topics: aiTrends.length };
}

// Helper: Detect trends using Gemini AI
async function detectTrendsWithAi(articles) {
  const prompt = `Analyze these news articles and extract trending topics. 
Return ONLY a JSON object with key "trends" containing array of:
- topic: trending topic name (string, max 50 chars)
- mentions: estimated number of mentions (number, 1-1000)
- growthIndicator: growth rate percentage (number, 0-100)
- isBreaking: whether breaking news (boolean)
- category: category name
- country: country name
- summary: brief summary (max 200 chars)

Articles to analyze:
${JSON.stringify(articles.slice(0, 100).map(a => ({
  title: a.title,
  category: a.category,
  country: a.country,
  keywords: a.keywords,
  sentiment: a.sentiment
})))}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  );
  
  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  const result = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
  
  return result.trends || [];
}

// API CALL TIME: ~2-3 seconds for batch of articles
```

### 2. Notification Generation

**Backend: `server/src/services/trendService.js`**
```javascript
export async function generateNotifications() {
  // 1. Get all breaking news trends (updated in last 5 minutes)
  const recentTrends = await Trend.find({
    isBreaking: true,
    lastUpdated: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
  });
  
  // 2. Get all active users
  const users = await User.find();
  
  // 3. For each trend, notify relevant users
  for (const trend of recentTrends) {
    for (const user of users) {
      // Check if user follows this country/category
      const followsCategory = !user.preferredCategories?.length || 
                              user.preferredCategories.includes(trend.category);
      const followsCountry = !user.preferredCountries?.length || 
                             user.preferredCountries.includes(trend.country);
      
      if (followsCategory && followsCountry) {
        // Create notification
        await Notification.create({
          userId: user._id,
          trendId: trend._id,
          type: 'breaking_news',
          title: `Breaking: ${trend.topic}`,
          message: `${trend.topic} is trending in ${trend.category}`,
          read: false
        });
        
        // Send email if enabled
        if (user.notificationSettings?.email) {
          await sendTrendEmailAlerts(user, trend);
        }
      }
    }
  }
}
```

---

## Frontend Architecture

### 1. Protected Routes & Authentication Guard

**`client/src/App.jsx`**
```javascript
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext.jsx';

// Component: Protect routes that need authentication
function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return <Loader />; // Show spinner while checking auth
  if (!user) {
    // No user = redirect to login
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  return children;
}

// Component: Admin-only routes
function AdminOnly({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <Loader />;
  if (user?.role !== 'admin') {
    // Not admin = redirect to dashboard
    return <Navigate to="/" replace />;
  }
  
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route path="/" element={<Protected><Shell /></Protected>}>
          <Route index element={<Dashboard />} />
          <Route path="feed" element={<NewsFeed />} />
          <Route path="trends" element={<Trends />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
          
          {/* Admin-only route */}
          <Route path="admin" element={<AdminOnly><Admin /></AdminOnly>} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
```

### 2. API Client with Axios

**`client/src/api/client.js`**
```javascript
import axios from 'axios';

// Determine API base URL (production vs dev)
function resolveBaseUrl() {
  // Use environment variable if set
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured?.startsWith('http')) {
    return configured.replace(/\/$/, '');
  }
  
  // Fallback for dev
  if (import.meta.env.DEV) {
    return 'http://localhost:5000/api';
  }
  
  // Fallback for production (relative)
  return '/api';
}

export const api = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('trend_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle 401
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('trend_token');
      localStorage.removeItem('trend_user');
      window.location.href = '/login'; // Redirect to login
    }
    return Promise.reject(error);
  }
);
```

### 3. Authentication Context

**`client/src/components/AuthContext.jsx`**
```javascript
import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Auto-restore session on mount
  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const storedToken = localStorage.getItem('trend_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      // Verify token with backend
      const response = await api.get('/auth/me');
      setUser(response.data);
      setToken(storedToken);
    } catch (error) {
      // Token invalid or expired
      localStorage.removeItem('trend_token');
      localStorage.removeItem('trend_user');
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;

    // Store in localStorage
    localStorage.setItem('trend_token', token);
    localStorage.setItem('trend_user', JSON.stringify(user));

    // Update state
    setToken(token);
    setUser(user);

    return user;
  }

  async function signup(name, email, password) {
    const response = await api.post('/auth/register', { name, email, password });
    const { token, user } = response.data;

    localStorage.setItem('trend_token', token);
    localStorage.setItem('trend_user', JSON.stringify(user));

    setToken(token);
    setUser(user);

    return user;
  }

  function logout() {
    localStorage.removeItem('trend_token');
    localStorage.removeItem('trend_user');
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, token, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

---

## API Route Handlers

### 1. Articles Endpoints

**Backend: `server/src/routes/articles.js`**
```javascript
// GET /api/articles
// Get articles with pagination and filters
export async function getArticles(req, res, next) {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      country,
      sentiment
    } = req.query;

    // Build filter object
    const filter = {};
    if (category) filter.category = category;
    if (country) filter.country = country;
    if (sentiment) filter.sentiment = sentiment;

    // Execute query
    const skip = (page - 1) * limit;
    const articles = await Article.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Article.countDocuments(filter);

    res.json({
      data: articles,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/articles/search
// Full-text search articles
export async function searchArticles(req, res, next) {
  try {
    const { q, limit = 20 } = req.body;

    if (!q) {
      return res.status(400).json({ error: 'Query required' });
    }

    // MongoDB text search (indexed fields: title, summary, keywords, etc.)
    const articles = await Article.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(Number(limit));

    res.json({ data: articles });
  } catch (error) {
    next(error);
  }
}
```

### 2. Trends Endpoints

**Backend: `server/src/routes/trends.js`**
```javascript
// GET /api/trends
// Get trends with filters
export async function getTrends(req, res, next) {
  try {
    const { category, country, limit = 20 } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (country) filter.country = country;

    const trends = await Trend.find(filter)
      .sort({ score: -1, lastUpdated: -1 })
      .limit(Number(limit));

    res.json({ data: trends });
  } catch (error) {
    next(error);
  }
}

// GET /api/trends/:id
// Get trend details with related articles
export async function getTrendDetail(req, res, next) {
  try {
    const trend = await Trend.findById(req.params.id);
    if (!trend) {
      return res.status(404).json({ error: 'Trend not found' });
    }

    res.json(trend);
  } catch (error) {
    next(error);
  }
}

// POST /api/trends/manual (Admin only)
// Manually trigger trend detection
export async function triggerTrendDetection(req, res, next) {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    // Call trend service
    const result = await detectTrends();

    res.json({ message: 'Trend detection completed', result });
  } catch (error) {
    next(error);
  }
}
```

### 3. Dashboard Endpoints

**Backend: `server/src/routes/dashboard.js`**
```javascript
// GET /api/dashboard/stats
// Get analytics statistics
export async function getDashboardStats(req, res, next) {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Articles in last 24h
    const articlesCount = await Article.countDocuments({
      publishedAt: { $gte: last24h }
    });

    // Trends detected
    const trendsCount = await Trend.countDocuments({
      lastUpdated: { $gte: last24h }
    });

    // Top trending topic
    const topTrend = await Trend.findOne()
      .sort({ score: -1 })
      .lean();

    // Sentiment distribution
    const sentiments = await Article.aggregate([
      { $group: { _id: '$sentiment', count: { $sum: 1 } } }
    ]);

    res.json({
      articlesLast24h: articlesCount,
      trendsDetected: trendsCount,
      topTrending: topTrend?.topic || 'N/A',
      sentimentDistribution: sentiments
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/dashboard/charts
// Get data for charts
export async function getChartData(req, res, next) {
  try {
    // Articles over time (last 7 days)
    const articles = await Article.aggregate([
      {
        $match: {
          publishedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$publishedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Category breakdown
    const byCategory = await Article.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      articleTimeline: articles,
      categoryBreakdown: byCategory
    });
  } catch (error) {
    next(error);
  }
}
```

---

## Scheduled Jobs

**Backend: `server/src/jobs/scheduler.js`**
```javascript
import cron from 'node-cron';
import { fetchAndAnalyzeFeeds } from '../services/rssService.js';
import { detectTrends } from '../services/trendService.js';

export function setupSchedules() {
  // Every 5 minutes: Fetch RSS feeds
  cron.schedule('*/5 * * * *', async () => {
    console.log('Running RSS fetch job...');
    try {
      await fetchAndAnalyzeFeeds();
      console.log('RSS fetch completed');
    } catch (error) {
      console.error('RSS fetch failed:', error);
    }
  });

  // Every 15 minutes: Detect trends
  cron.schedule('*/15 * * * *', async () => {
    console.log('Running trend detection job...');
    try {
      const result = await detectTrends();
      console.log('Trend detection completed:', result);
    } catch (error) {
      console.error('Trend detection failed:', error);
    }
  });
}
```

---

This documentation covers the complete logic flow of the TrendWatch application! 🎯
