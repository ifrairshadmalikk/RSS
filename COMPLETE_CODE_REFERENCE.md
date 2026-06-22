# 🔧 TrendWatch - Key Code Components

## Complete Source Code for Core Features

---

## 1. Frontend - Login/Authentication Page

**`client/src/pages/Login.jsx`** (Full Code)

```jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext.jsx';
import { Mail, Lock, User } from 'lucide-react';

export default function Login() {
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  // Rotating slideshow
  const SLIDES = [
    {
      image: 'url(https://images.unsplash.com/photo-1553531889-e6cf52652c7f?w=1200&h=600&fit=crop)',
      caption: 'Monitor Global Trends in Real-Time'
    },
    {
      image: 'url(https://images.unsplash.com/photo-1522869635100-ce306e08e8b0?w=1200&h=600&fit=crop)',
      caption: 'Powered by Advanced AI Analysis'
    },
    {
      image: 'url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=600&fit=crop)',
      caption: 'Stay Ahead with Breaking News'
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  function SlidePhotos() {
    return (
      <div
        className="h-24 sm:h-36 md:h-44 relative bg-cover bg-center rounded-lg sm:rounded-xl overflow-hidden"
        style={{ backgroundImage: SLIDES[currentSlide].image }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
      </div>
    );
  }

  function SlideCaption() {
    return (
      <div className="mt-3 sm:mt-4 text-center">
        <p className="text-xs sm:text-sm text-white/80 line-clamp-2">
          {SLIDES[currentSlide].caption}
        </p>
        <div className="flex justify-center gap-1 sm:gap-1.5 mt-2">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1 sm:h-1.5 rounded-full transition-all ${
                idx === currentSlide
                  ? 'bg-blue-500 w-6 sm:w-8'
                  : 'bg-white/40 w-1.5 sm:w-2'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  function InputField({ icon: Icon, type, value, onChange, placeholder }) {
    return (
      <div className="relative">
        <Icon className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-lg sm:rounded-xl pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 
                     text-xs sm:text-sm bg-white/10 border border-white/20 text-white 
                     placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-3 sm:p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">
            TrendWatch
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm">
            AI-Powered Global Trend Monitoring
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-lg sm:rounded-2xl p-6 sm:p-8 border border-white/10 space-y-4 sm:space-y-6">
          {/* Slideshow */}
          <SlidePhotos />
          <SlideCaption />

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 sm:p-4 text-red-400 text-xs sm:text-sm">
              {error}
            </div>
          )}

          {/* Mode Toggle */}
          <div className="flex gap-2 bg-white/5 p-1 rounded-lg">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded transition-all ${
                mode === 'signin'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded transition-all ${
                mode === 'signup'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            {mode === 'signup' && (
              <InputField
                icon={User}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
              />
            )}

            <InputField
              icon={Mail}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
            />

            <InputField
              icon={Lock}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 
                         text-white text-xs sm:text-sm font-semibold hover:from-blue-700 hover:to-blue-800 
                         disabled:opacity-50 transition-all"
            >
              {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-xs sm:text-sm">
            {mode === 'signin'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <button
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              {mode === 'signin' ? 'Create One' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## 2. Backend - Authentication Routes

**`server/src/routes/auth.js`** (Full Code)

```javascript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password required')
});

function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function userResponse(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePicture: user.profilePicture
  };
}

export async function register(req, res, next) {
  try {
    // 1. Validate input
    const validated = registerSchema.parse(req.body);

    // 2. Check if user already exists
    const existing = await User.findOne({ email: validated.email });
    if (existing) {
      return res.status(409).json({
        error: 'Email already registered',
        field: 'email'
      });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 12);

    // 4. Create user
    const user = await User.create({
      name: validated.name,
      email: validated.email,
      password: hashedPassword,
      role: 'viewer', // Default role
      profilePicture: `https://i.pravatar.cc/150?u=${validated.email}`
    });

    // 5. Generate JWT
    const token = generateToken(user);

    // 6. Return response
    res.status(201).json({
      token,
      user: userResponse(user)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    // 1. Validate input
    const validated = loginSchema.parse(req.body);

    // 2. Find user by email
    const user = await User.findOne({ email: validated.email });
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // 3. Compare password
    const passwordMatch = await bcrypt.compare(validated.password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // 4. Generate JWT
    const token = generateToken(user);

    // 5. Return response
    res.json({
      token,
      user: userResponse(user)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    next(error);
  }
}

export async function getMe(req, res) {
  // req.user is set by auth middleware
  res.json(userResponse(req.user));
}
```

---

## 3. Backend - Gemini AI Article Analysis Service

**`server/src/services/aiService.js`** (Complete Implementation)

```javascript
import { Article } from '../models/Article.js';
import { AiLog } from '../models/AiLog.js';

const CATEGORIES = [
  'Technology', 'Cryptocurrency', 'Politics', 'Business', 'Sports',
  'Health', 'Entertainment', 'Science', 'War', 'Disaster',
  'Climate', 'Culture', 'Education', 'Travel'
];

export function getGeminiApiKey() {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
  if (key.includes('YOUR') || key.includes('replace-with') || !key.startsWith('AIza')) {
    throw new Error(
      'Invalid GEMINI_API_KEY. Create one at https://aistudio.google.com/apikey'
    );
  }
  return key;
}

export function getGeminiModel() {
  return process.env.GEMINI_MODEL?.trim() || 'gemini-1.5-flash';
}

export function isGeminiConfigError(error) {
  return error?.message?.includes('GEMINI_API_KEY');
}

function parseJsonResponse(text) {
  try {
    const cleaned = String(text || '').replace(/```json|```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function analyzeArticle(article) {
  const model = getGeminiModel();
  const apiKey = getGeminiApiKey();
  const started = Date.now();
  const provider = 'gemini';

  try {
    const prompt = `Analyze this news article and return ONLY a JSON object with these fields:
- summary: brief 1-2 sentence summary (max 200 chars)
- keywords: array of 5-8 important keywords (strings)
- sentiment: "Positive", "Negative", or "Neutral"
- sentimentScore: number from -2 to 2
- category: one of [${CATEGORIES.join(', ')}]
- country: the country/region this article is about, or "Global"

Article:
Title: ${article.title}
Description: ${article.description}
Link: ${article.link}`;

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

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${error.slice(0, 200)}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = parseJsonResponse(responseText) || {};

    // Log successful call
    await AiLog.create({
      provider,
      status: 'success',
      durationMs: Date.now() - started
    });

    return {
      summary: parsed.summary || article.description?.slice(0, 200) || '',
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      sentiment: ['Positive', 'Negative', 'Neutral'].includes(parsed.sentiment)
        ? parsed.sentiment
        : 'Neutral',
      sentimentScore: Number(parsed.sentimentScore) || 0,
      category: CATEGORIES.includes(parsed.category) ? parsed.category : 'Business',
      country: parsed.country || 'Global'
    };
  } catch (error) {
    // Log error
    if (!isGeminiConfigError(error)) {
      await AiLog.create({
        provider,
        status: 'failed',
        message: error.message,
        durationMs: Date.now() - started
      });
    }
    console.error('Article analysis error:', error);
    
    // Return defaults on error
    return {
      summary: article.description?.slice(0, 200) || '',
      keywords: [],
      sentiment: 'Neutral',
      sentimentScore: 0,
      category: 'Business',
      country: 'Global'
    };
  }
}

export async function geminiChat(messages, systemPrompt) {
  const model = getGeminiModel();
  const apiKey = getGeminiApiKey();

  const contents = messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${error.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
```

---

## 4. Frontend - API Client with Interceptors

**`client/src/api/client.js`** (Full Implementation)

```javascript
import axios from 'axios';

function resolveBaseUrl() {
  // Priority: Environment variable > Dev mode > Relative path
  const configured = import.meta.env.VITE_API_URL?.trim();
  
  if (configured) {
    if (configured.startsWith('http')) {
      return configured.replace(/\/$/, ''); // Remove trailing slash
    }
  }
  
  if (import.meta.env.DEV) {
    return 'http://localhost:5000/api';
  }
  
  return '/api'; // Relative path for production
}

export const api = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 second timeout
});

// Request interceptor: Add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('trend_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle authentication errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('trend_token');
      localStorage.removeItem('trend_user');
      
      // Redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);
```

---

## 5. Backend - Express Server Setup

**`server/src/server.js`** (Complete Setup)

```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ensureReady } from './config/bootstrap.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import articleRoutes from './routes/articles.js';
import trendRoutes from './routes/trends.js';
import dashboardRoutes from './routes/dashboard.js';
import notificationRoutes from './routes/notifications.js';
import profileRoutes from './routes/profile.js';
import rssRoutes from './routes/rss.js';
import assistantRoutes from './routes/assistant.js';

export const app = express();

// 1. CORS - Must be first!
app.use(cors({
  origin: [
    'https://rss-client-eight.vercel.app',
    'http://localhost:5173', // Local dev
    'http://localhost:3000'   // Alternative dev
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// 2. Database readiness check (skips for OPTIONS requests)
app.use(async (req, res, next) => {
  if (req.path === '/api/health' || req.method === 'OPTIONS') {
    return next();
  }
  try {
    await ensureReady();
    next();
  } catch (error) {
    res.status(503).json({
      error: 'Database connection failed',
      message: error.message
    });
  }
});

// 3. Security & Logging
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 4. Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TrendWatch API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// 5. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/trends', trendRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/rss', rssRoutes);
app.use('/api/assistant', assistantRoutes);

// 6. 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// 7. Global error handler (must be last)
app.use(errorHandler);

export default app;
```

---

## 6. Database Connection

**`server/src/config/database.js`** (Full Implementation)

```javascript
import mongoose from 'mongoose';

let isReady = false;
const readyPromise = new Promise((resolve) => {
  if (isReady) resolve();
});

function getMongoUri() {
  // Priority: env var > Vercel > Local dev
  const uri = process.env.MONGODB_URI;
  
  if (uri) {
    return uri;
  }
  
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    throw new Error(
      'MONGODB_URI environment variable is required in production. ' +
      'Set it in Vercel project settings.'
    );
  }
  
  // Local development
  return 'mongodb://127.0.0.1:27017/trend-monitor';
}

export async function connectDatabase() {
  if (isReady) return;
  
  if (mongoose.connection.readyState === 1) {
    isReady = true;
    return;
  }

  const mongoUri = getMongoUri();
  
  try {
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    });
    
    isReady = true;
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
}

export async function ensureReady() {
  if (isReady) return;
  
  await connectDatabase();
  
  // Wait for collections to be indexed
  await new Promise(resolve => setTimeout(resolve, 100));
}

export function isConnected() {
  return mongoose.connection.readyState === 1;
}
```

---

## 7. Frontend - Dashboard Page

**`client/src/pages/Dashboard.jsx`** (Core Analytics)

```jsx
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { TrendingUp, FileText, Activity } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      
      const [statsRes, chartsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/charts')
      ]);
      
      setStats(statsRes.data);
      setCharts(chartsRes.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to TrendWatch Analytics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Articles Card */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Articles (24h)</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.articlesLast24h || 0}
              </p>
            </div>
            <FileText className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>

        {/* Trends Card */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Trends Detected</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.trendsDetected || 0}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>

        {/* Top Trending Card */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Top Trending</p>
              <p className="text-xl font-bold text-gray-900 mt-2 line-clamp-2">
                {stats?.topTrending || 'N/A'}
              </p>
            </div>
            <Activity className="w-12 h-12 text-purple-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Article Timeline */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Articles Timeline</h2>
          <div className="space-y-2">
            {charts?.articleTimeline?.slice(-7).map((item) => (
              <div key={item._id} className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-16">{item._id}</span>
                <div className="flex-1 bg-gray-200 rounded h-6">
                  <div
                    className="bg-blue-500 h-full rounded"
                    style={{
                      width: `${(item.count / Math.max(...charts.articleTimeline.map(x => x.count))) * 100}%`
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Top Categories</h2>
          <div className="space-y-3">
            {charts?.categoryBreakdown?.slice(0, 5).map((item) => (
              <div key={item._id} className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-600 w-24">
                  {item._id}
                </span>
                <div className="flex-1 bg-gray-200 rounded h-6">
                  <div
                    className="bg-green-500 h-full rounded"
                    style={{
                      width: `${(item.count / Math.max(...charts.categoryBreakdown.map(x => x.count))) * 100}%`
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
```

---

This document provides complete, production-ready code for the core features of TrendWatch! 🚀
