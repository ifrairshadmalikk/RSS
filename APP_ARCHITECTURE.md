# 🌍 TrendWatch - AI-Powered Global Trend Monitoring System

## 📋 Project Overview

**TrendWatch** is a production-ready full-stack SaaS dashboard that monitors global trends by:
1. Aggregating articles from RSS feeds
2. Analyzing each article with Google's Gemini AI
3. Detecting trending topics across categories and countries
4. Sending notifications and providing search/analytics

---

## 🏗️ Architecture

### Frontend (React + Vite)
```
client/
├── src/
│   ├── App.jsx                 # Main router and Protected routes
│   ├── main.jsx                # Entry point
│   ├── pages/
│   │   ├── Login.jsx           # Auth page (signin/signup)
│   │   ├── Dashboard.jsx       # Analytics & overview
│   │   ├── Trends.jsx          # Trending topics by category/country
│   │   ├── NewsFeed.jsx        # All articles with filters
│   │   ├── Notifications.jsx   # User notifications
│   │   ├── Settings.jsx        # User preferences
│   │   └── Admin.jsx           # User management (admin only)
│   ├── components/
│   │   ├── AuthContext.jsx     # Auth state management
│   │   ├── Shell.jsx           # Main layout shell
│   │   ├── Ui.jsx              # Reusable UI components
│   │   └── AiAssistant.jsx     # AI chat interface
│   ├── hooks/
│   │   └── useAsync.js         # Custom async hook
│   ├── api/
│   │   └── client.js           # Axios API client with JWT auth
│   └── utils/
│       └── format.js           # Utility functions
```

### Backend (Node.js + Express)
```
server/
├── src/
│   ├── server.js               # Express app setup
│   ├── index.js                # Server entry point
│   ├── vercel.js               # Vercel serverless function
│   ├── routes/
│   │   ├── auth.js             # Login, Register, /me
│   │   ├── articles.js         # Get/search articles
│   │   ├── trends.js           # Get trends by category/country
│   │   ├── dashboard.js        # Analytics data
│   │   ├── notifications.js    # User notifications
│   │   ├── profile.js          # User profile & settings
│   │   ├── assistant.js        # AI chat endpoint
│   │   ├── rss.js              # RSS feed management
│   │   └── search.js           # Article search
│   ├── models/
│   │   ├── User.js             # User (with roles: admin, analyst, viewer)
│   │   ├── Article.js          # Article (with AI analysis)
│   │   ├── Trend.js            # Trend (with growth rate & history)
│   │   ├── Notification.js     # User notification
│   │   ├── RssFeed.js          # RSS feed source
│   │   └── AiLog.js            # AI API call logs
│   ├── services/
│   │   ├── aiService.js        # Gemini AI integration
│   │   ├── trendService.js     # Trend detection algorithm
│   │   ├── rssService.js       # RSS feed parsing
│   │   ├── emailService.js     # Email notifications
│   │   └── googleTrendsService.js # Google Trends API
│   ├── middleware/
│   │   ├── auth.js             # JWT verification
│   │   └── errorHandler.js     # Global error handling
│   ├── config/
│   │   ├── database.js         # MongoDB connection
│   │   ├── bootstrap.js        # Seed default data
│   │   └── demoDashboard.js    # Demo data
│   └── jobs/
│       └── scheduler.js        # Cron job for RSS fetching & trend detection
```

---

## 🔄 Data Flow

### 1. **Article Fetching & AI Analysis** (Every few minutes)
```
RSS Feed → Fetch Articles
         → Gemini AI Analysis (per article):
           - Sentiment Analysis
           - Keyword Extraction
           - Category Classification (14 categories)
           - Country Identification
           - Summary Generation
         → Save to MongoDB (Article collection)
```

### 2. **Trend Detection** (Every 15 minutes)
```
Recent Articles (last 24h) 
→ Gemini AI Trend Detection:
  - Extract trending topics
  - Calculate growth rate
  - Identify breaking news
  - Find related articles
→ Update MongoDB (Trend collection)
→ Send Notifications (if threshold exceeded)
```

### 3. **User Request Flow**
```
Frontend (React) 
→ API Call (with JWT token in header)
→ Backend Route Handler
→ Middleware: JWT Verification
→ Business Logic (Service Layer)
→ MongoDB Query
→ Response (JSON)
→ Frontend State Update
```

---

## 📊 Database Models

### User
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed with bcrypt),
  role: "admin" | "analyst" | "viewer",
  profilePicture: String (URL),
  preferredCountries: [String],
  preferredCategories: [String],
  notificationSettings: {
    email: Boolean,
    breakingNews: Boolean,
    threshold: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Article
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  summary: String (AI generated),
  source: String (publication name),
  sourceFeed: ObjectId (ref to RssFeed),
  category: String (from Gemini AI),
  country: String (from Gemini AI),
  sentiment: "Positive" | "Neutral" | "Negative" (from Gemini AI),
  sentimentScore: Number (-2 to 2),
  keywords: [String] (from Gemini AI),
  link: String (unique, article URL),
  image: String (image URL),
  publishedAt: Date,
  aiProvider: "gemini",
  raw: Object (original RSS data),
  createdAt: Date,
  updatedAt: Date
}
```

### Trend
```javascript
{
  _id: ObjectId,
  topic: String,
  category: String (Technology, Cryptocurrency, etc.),
  country: String,
  mentions: Number (article count),
  previousMentions: Number,
  growthRate: Number (0-100 percentage),
  sentiment: "Positive" | "Neutral" | "Negative",
  score: Number (trend strength),
  isBreaking: Boolean,
  relatedArticles: [
    {
      title: String,
      link: String,
      source: String,
      publishedAt: Date
    }
  ],
  history: [ // Track changes over time
    {
      mentions: Number,
      score: Number,
      capturedAt: Date
    }
  ],
  lastUpdated: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Notification
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref to User),
  trendId: ObjectId (ref to Trend),
  type: "breaking_news" | "trend_spike",
  title: String,
  message: String,
  read: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### RssFeed
```javascript
{
  _id: ObjectId,
  name: String,
  url: String,
  category: String,
  roleAudience: "all" | "analyst" | "admin",
  websiteUrl: String,
  discoveredFrom: "seed" | "user_submitted",
  lastFetchedAt: Date,
  status: "active" | "error",
  error: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔐 Authentication Flow

### Login/Register
```
1. User enters email + password
2. Frontend sends to /api/auth/login or /api/auth/register
3. Backend:
   - For login: Find user, verify password with bcrypt
   - For register: Create user with hashed password
4. Generate JWT token (7 days expiry)
5. Return token + user data to frontend
6. Frontend stores in localStorage
7. All subsequent requests include JWT in Authorization header
```

### Protected Routes
```
Frontend:
- If no user AND not on /login → redirect to /login
- If user exists → show dashboard

Backend:
- All routes except /login use middleware: requireAuth
- Middleware verifies JWT token
- If invalid → return 401 Unauthorized
- If valid → attach user to req.user and proceed
```

### Role-Based Access Control
```
Routes:
- GET /api/dashboard      → All authenticated users
- GET /api/admin          → Admin only (redirects others to /)
- POST /api/users/*       → Admin only
- DELETE /api/users/:id   → Admin only
```

---

## 🤖 Gemini AI Integration

### Per-Article Analysis
```
Input: 
{
  title: "Apple announces new iPhone",
  description: "Apple unveiled...",
  link: "https://...",
  pubDate: "2024-06-22"
}

Gemini Prompt: "Analyze this article and return JSON with:
- summary (1-2 sentences)
- keywords (5-8 important terms)
- sentiment (Positive/Neutral/Negative)
- sentimentScore (-2 to 2)
- category (one of 14 categories)
- country (geographic focus)"

Output:
{
  summary: "Apple released new iPhone features...",
  keywords: ["iPhone", "Apple", "technology", ...],
  sentiment: "Positive",
  sentimentScore: 1.2,
  category: "Technology",
  country: "USA"
}

Processing: ~100-200ms per article
```

### Trend Detection
```
Input: All articles from last 24 hours (up to 2000)

Gemini Prompt: "Extract the most trending topics from these 
articles. Return JSON with trends array containing:
- topic (trending topic name)
- mentions (estimated article count)
- growthIndicator (0-100%)
- isBreaking (boolean)
- summary (brief explanation)"

Output:
{
  trends: [
    {
      topic: "AI Regulation",
      mentions: 45,
      growthIndicator: 85,
      isBreaking: true,
      summary: "Government introduces new AI regulations..."
    },
    ...
  ]
}

Processing: ~2-3 seconds for full batch
```

---

## ⏰ Scheduled Jobs (Node Cron)

### RSS Fetching (Every 5-10 minutes)
```
1. Fetch all active RSS feeds
2. Parse new articles since last fetch
3. For each new article:
   a. Call Gemini AI for analysis
   b. Save to Article collection
   c. Log AI usage
4. Update lastFetchedAt timestamp
5. Handle feed errors gracefully
```

### Trend Detection (Every 15 minutes)
```
1. Get all articles from last 24 hours
2. Call Gemini AI to detect trends
3. For each detected trend:
   a. Check if trend exists (by topic + category + country)
   b. If exists: Update mentions count, calculate growth rate
   c. If new: Create trend entry
4. Calculate growthRate = (mentions - previousMentions) / previousMentions * 100
5. Mark as breaking if growthRate > threshold (default: 5)
6. Send notifications to users who follow that trend
```

---

## 📱 Client Pages & Features

### 1. **Login Page** (`/login`)
- Sign in with email + password
- Sign up new account
- JWT stored in localStorage
- Protected by authentication guard

### 2. **Dashboard** (`/`)
- **Analytics Cards:**
  - Total articles (24h)
  - Total trends detected
  - Top trending topic
  - Sentiment distribution (pie chart)
- **Charts:**
  - Article growth over time (line chart)
  - Top categories (bar chart)
  - Sentiment distribution
  - Trending topics heatmap

### 3. **Trends** (`/trends`)
- **Filters:**
  - Category dropdown (14 options)
  - Country searchable dropdown
- **Display:**
  - Trend cards with:
    - Topic name
    - Growth percentage (↑ ↓)
    - Breaking news badge
    - Related articles count
- **Interactive:** Click trend to see related articles

### 4. **NewsFeed** (`/feed`)
- **Filters:**
  - Search by keyword
  - Filter by category
  - Filter by country
  - Filter by sentiment
- **Display:** Article cards with:
  - Title, summary, source
  - Published time, category tag
  - Sentiment indicator
  - Link to original article
- **Pagination:** Load more articles

### 5. **Notifications** (`/notifications`)
- List of all user notifications
- Types:
  - Breaking news alerts
  - Trend spike notifications
- Mark as read/unread
- Delete notifications

### 6. **Settings** (`/settings`)
- User profile edit
- Preferred countries & categories
- Notification preferences
- Change password

### 7. **Admin Panel** (`/admin`)
- User management table
- Edit user roles (admin/analyst/viewer)
- Delete users
- View user activity
- System stats

---

## 🌐 API Endpoints

### Authentication
```
POST /api/auth/register          # Create new account
POST /api/auth/login             # Login
GET /api/auth/me                 # Current user (requires JWT)
```

### Articles
```
GET /api/articles                # Get articles with pagination
POST /api/articles/search        # Search articles
GET /api/articles/:id            # Get single article
```

### Trends
```
GET /api/trends                  # Get trends (filter by category/country)
GET /api/trends/:id              # Get single trend details
POST /api/trends/manual          # Trigger trend detection (admin)
```

### User Profile
```
GET /api/profile                 # Get user profile
PUT /api/profile                 # Update profile
POST /api/profile/preferences    # Update country/category preferences
POST /api/profile/notification-settings # Update notification prefs
```

### Dashboard
```
GET /api/dashboard/stats         # Analytics data
GET /api/dashboard/charts        # Chart data
```

### Notifications
```
GET /api/notifications           # Get user notifications
PUT /api/notifications/:id       # Mark as read
DELETE /api/notifications/:id    # Delete notification
```

### Admin
```
GET /api/admin/users             # List all users
PUT /api/admin/users/:id         # Update user role
DELETE /api/admin/users/:id      # Delete user
```

### RSS Feeds
```
GET /api/rss/feeds               # List RSS sources
POST /api/rss/feeds              # Add new RSS source
DELETE /api/rss/feeds/:id        # Remove RSS source
```

### AI Assistant
```
POST /api/assistant/chat         # Chat with AI (asks questions about trends)
```

---

## 🚀 Deployment

### Frontend (Vercel)
```
- Deployed at: https://rss-client-eight.vercel.app
- Framework: React + Vite
- Environment Variables:
  - VITE_API_URL=https://rss-server-pgab.vercel.app/api
```

### Backend (Vercel)
```
- Deployed at: https://rss-server-pgab.vercel.app
- Framework: Node.js + Express
- Environment Variables:
  - MONGODB_URI (MongoDB Atlas)
  - JWT_SECRET
  - GEMINI_API_KEY
  - CLIENT_ORIGIN (for CORS)
  - ADMIN_EMAIL, ADMIN_PASSWORD
```

### Database (MongoDB Atlas)
```
- Cloud MongoDB cluster
- Collections:
  - users
  - articles
  - trends
  - notifications
  - rssfeeds
  - ailogs
```

---

## 🔧 Key Technologies

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router, Recharts |
| **Backend** | Node.js, Express.js, Mongoose |
| **Database** | MongoDB Atlas |
| **AI** | Google Gemini 1.5 Flash |
| **Auth** | JWT (JSON Web Tokens), bcryptjs |
| **Deployment** | Vercel (frontend + backend), MongoDB Atlas |
| **HTTP Client** | Axios |
| **Icons** | lucide-react |
| **Task Scheduling** | node-cron |
| **RSS Parsing** | rss-parser |

---

## 📈 Data Processing Pipeline

```
RSS Feeds (Periodic: 5-10 min)
    ↓
Fetch New Articles
    ↓
Gemini AI Analysis (per article)
    - Category
    - Country
    - Sentiment
    - Keywords
    - Summary
    ↓
Save Articles to MongoDB
    ↓
---
    ↓
Trend Detection (Periodic: 15 min)
    ↓
Analyze Recent Articles (24h)
    ↓
Gemini AI Trend Detection
    - Extract trending topics
    - Calculate growth rate
    ↓
Update/Create Trends in MongoDB
    ↓
Generate Notifications
    ↓
Send Email Alerts (if threshold exceeded)
    ↓
User Dashboard Updates
```

---

## 🔒 Security Features

1. **Authentication:** JWT tokens (7-day expiry)
2. **Authorization:** Role-based access control (admin/analyst/viewer)
3. **Password Security:** Bcryptjs hashing (12 rounds)
4. **CORS:** Configured to allow only client origin
5. **API Security:** 
   - Rate limiting (recommended for production)
   - Input validation with Zod
   - Error handling doesn't leak sensitive data
6. **Database:** MongoDB connection pooling, indexed queries

---

## 📝 Environment Variables

### Frontend (.env)
```
VITE_API_URL=https://rss-server-pgab.vercel.app/api
```

### Backend (.env)
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net
JWT_SECRET=your-secret-key-min-32-chars
GEMINI_API_KEY=AIza-your-key
GEMINI_MODEL=gemini-1.5-flash
AI_PROVIDER=gemini
ADMIN_EMAIL=admin@trends.local
ADMIN_PASSWORD=admin123456
CLIENT_ORIGIN=https://rss-client-eight.vercel.app
PORT=5000
TREND_NOTIFICATION_THRESHOLD=5
```

---

## 🎯 User Roles & Permissions

### Admin
- Full access to all features
- User management (create, edit, delete users, change roles)
- View system logs
- Trigger manual trend detection

### Analyst
- View all articles and trends
- Customize filters and preferences
- Access analytics

### Viewer
- View trends and articles
- Customize personal preferences
- Receive notifications

---

This comprehensive architecture powers the TrendWatch platform! 🚀
