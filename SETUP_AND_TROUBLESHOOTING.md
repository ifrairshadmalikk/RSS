# Trend Detector - Setup & Troubleshooting Guide

## ✅ Quick Start

### 1. Environment Setup
Create a `.env` file in the `server` directory with these settings:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/global-trend-monitor
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-recommended
GEMINI_API_KEY=sk-proj-YOUR-ACTUAL-GEMINI-API-KEY
GEMINI_MODEL=gemini-1.5-flash
AI_PROVIDER=gemini
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@trends.local
ADMIN_PASSWORD=admin123456
CLIENT_ORIGIN=http://localhost:5173
PORT=5000
TREND_NOTIFICATION_THRESHOLD=5
```

### 2. Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Start MongoDB
```bash
mongod
```

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

## 🔐 Authentication & Admin Panel

### First Admin User Creation
When the server starts, it automatically creates an admin user using the environment variables:
- **Email**: `admin@trends.local`
- **Password**: `admin123456`

### Login to Admin Panel
1. Go to `http://localhost:5173/login`
2. Sign in with admin credentials
3. Navigate to **Settings** page
4. You should see two sections:
   - **Profile Settings** (for your profile)
   - **User Management** (admin-only section with user list and controls)

### Troubleshooting Admin Panel Not Appearing

**Issue**: Admin panel shows blank or doesn't load

**Solutions**:
1. **Clear browser cache and localStorage**:
   - Open DevTools (F12)
   - Application → Local Storage → Clear `trend_token` and `trend_user`
   - Refresh page

2. **Verify admin user was created**:
   - Check MongoDB:
   ```bash
   mongosh
   use global-trend-monitor
   db.users.find({ role: "admin" })
   ```
   - Should show your admin user with `role: "admin"`

3. **Check JWT token**:
   - After login, verify token is stored:
   ```javascript
   // In browser console
   console.log(localStorage.getItem('trend_user'))
   ```
   - Should show: `{"id":"...", "name":"Admin", "email":"admin@trends.local", "role":"admin"}`

4. **Check API response**:
   - In browser DevTools → Network tab
   - Go to Settings page
   - Look for request to `/api/profile/admin/users`
   - If it shows 403 error, the role isn't being recognized
   - If it shows 401, the token isn't being sent

## 🌍 Country & Category Filtering

### Countries List (searchable dropdown)
- Global
- United States
- United Kingdom
- Canada
- Australia
- India
- Japan
- Germany
- France
- China
- Brazil
- Mexico

**Search by typing in the dropdown** - type "United" to filter to UK, US, and United States.

### Categories (14 options)
- Technology
- Cryptocurrency
- Politics
- Business
- Sports
- Health
- Entertainment
- Science
- War
- Disaster
- Climate
- Culture
- Education
- Travel

### Using Filters

**On Trends Page**:
1. Click "Select countries..." dropdown
2. Search or select multiple countries
3. Click "Select categories..." dropdown
4. Select categories to filter
5. Trends display automatically updates with filters applied

**On Settings Page**:
1. Set your **Preferred Countries** - you'll receive notifications for trends from these countries
2. Set your **Preferred Categories** - customize which topic categories interest you

## 🤖 Gemini AI Integration

### Why Gemini AI?
All analysis in the app is now powered by **Google's Gemini AI**:

- **Article Analysis**: Every news article is analyzed by Gemini to extract:
  - Summary (1-2 sentence overview)
  - Keywords (5-8 relevant terms)
  - Sentiment (Positive/Negative/Neutral)
  - Category (one of 14 categories)
  - Country (where the news is about)

- **Trend Detection**: Every 15 minutes, Gemini analyzes all recent articles to identify:
  - Trending topics
  - Growth indicators
  - Breaking news status
  - Trend summaries

### API Key Setup
1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Add to `.env`: `GEMINI_API_KEY=AIza-YOUR-KEY`
3. Model used: `gemini-1.5-flash` (fast and cost-effective)

### Verifying Gemini is Working

**Check Article Analysis**:
```bash
# In browser console, after articles are fetched
db.articles.findOne({ aiProvider: "gemini" })
```

**Check Trend Detection Logs**:
```bash
# In MongoDB
db.ailogs.find({ provider: "gemini" }).sort({ createdAt: -1 }).limit(5)
```

## 🔄 How It Works

### Data Flow
```
1. RSS Feeds → Fetched every 10 minutes by scheduler
2. Articles → Analyzed by Gemini AI for category/country/sentiment
3. Article Storage → Saved with AI analysis results
4. Trend Detection → Every 15 minutes, Gemini finds trending topics
5. Notifications → Created when trends exceed threshold (default: 5 mentions)
6. Frontend Display → Users see filtered trends by country/category
```

### Background Jobs
- **Every 10 minutes**: Fetch new articles from RSS feeds
- **Every 15 minutes**: Run Gemini trend detection
- **Real-time**: User notifications when breaking news detected

## 📋 User Roles

### Viewer (Default)
- Can view trends filtered by country/category
- Can see and edit own profile
- Receives notifications based on preferences

### Analyst
- All Viewer permissions
- Can analyze trends in detail

### Admin
- All Analyst permissions
- Can manage all users
- Can change user roles
- Can delete users
- Can configure settings

## 🛠️ Admin Controls

### User Management Panel (Settings → User Management)

**Actions Available**:
1. **View All Users**: Table showing all registered users
2. **Change Role**: Dropdown to set user role (admin/analyst/viewer)
3. **Delete User**: Trash icon to remove user (confirmation required)

### Making Someone Admin
1. Go to Settings → User Management
2. Find the user in the table
3. Click role dropdown and select "admin"
4. User becomes admin on next login

## ❌ Common Issues & Solutions

### Issue: GEMINI_API_KEY not configured
**Error**: "GEMINI_API_KEY environment variable is required"
**Solution**: 
1. Get key from https://aistudio.google.com/apikey
2. Add to server/.env
3. Restart server

### Issue: Articles not being analyzed
**Error**: Articles missing category, country, sentiment
**Solution**:
1. Restart server to ensure Gemini AI is initialized
2. Check MongoDB for recent articles
3. Verify GEMINI_API_KEY is valid

### Issue: Trends not detected
**Error**: No trends showing on Trends page
**Solution**:
1. Ensure articles exist (check if RSS feeds are fetching)
2. Manually trigger trend detection: restart server
3. Check server logs for AI errors
4. Wait 15 minutes for scheduled detection

### Issue: Login redirect loop
**Error**: After login, redirected back to login
**Solution**:
1. Clear localStorage: `localStorage.clear()`
2. Check server is running on port 5000
3. Verify CLIENT_ORIGIN in .env matches frontend URL
4. Check JWT_SECRET is same on server

### Issue: Admin panel shows "Insufficient permissions"
**Error**: 403 error on user list
**Solution**:
1. Verify user role in MongoDB:
   ```bash
   db.users.findOne({ email: "admin@trends.local" })
   ```
2. Ensure `role: "admin"` is present
3. Re-login to refresh token with correct role
4. Clear localStorage before logging in again

## 📊 Monitoring & Logs

### View AI Processing
```bash
# MongoDB - see all AI operations
db.ailogs.find({}).sort({ createdAt: -1 }).limit(20)
```

### View All Trends
```bash
# See all detected trends with category and country
db.trends.find({}).pretty()
```

### View User Activity
```bash
# See all users and their roles
db.users.find({}).pretty()
```

## 🚀 Deployment

When deploying to Render or similar:

1. **Set environment variables** in deployment dashboard:
   - `GEMINI_API_KEY`
   - `MONGODB_URI` (use MongoDB Atlas for production)
   - `JWT_SECRET` (use strong random value)
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD`
   - `CLIENT_ORIGIN` (your frontend URL)

2. **Database migrations**: App uses Mongoose, no manual migrations needed

3. **Background jobs**: Scheduler runs automatically when server starts

## 📞 Support

For issues:
1. Check server logs: `npm run dev` output
2. Check browser console: DevTools → Console
3. Check MongoDB: `mongosh global-trend-monitor`
4. Verify .env file has all required variables
