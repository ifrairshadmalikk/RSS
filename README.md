# AI-Powered Global Trend Monitoring System

Production-ready full-stack SaaS dashboard for RSS aggregation, Gemini AI article analysis, multi-dimensional global trend detection (by category × country), notifications, search, analytics, and admin user management.

## ✨ Features

- **🤖 Gemini AI-Powered Analysis**: Every article analyzed by Google's Gemini AI for category, country, sentiment, and summary
- **🌍 Multi-Dimensional Trends**: Trends organized by category (14 options) and country with global reach
- **🔍 Searchable Filters**: Find trends by country (with search) and category using dropdowns
- **👥 User Management**: Admin panel to manage users, change roles, and delete accounts
- **📱 User Profiles**: Customize preferred countries and categories, manage notification settings
- **🔐 Role-Based Access**: Admin, Analyst, and Viewer roles with appropriate permissions
- **📧 Notifications**: Real-time breaking news and trend notifications
- **📊 Dashboard**: Analytics and trend analytics with growth tracking

## Stack

- **Frontend**: React, Vite, Tailwind CSS, Axios, React Router, Recharts, lucide-react icons
- **Backend**: Node.js, Express, MongoDB/Mongoose, JWT, rss-parser, node-cron
- **AI**: Google Gemini AI (gemini-1.5-flash) for all content analysis and trend detection
- **Deployment**: Vercel (frontend), Render (backend), MongoDB Atlas (database)

## Quick Start

### 1. Setup
```bash
# Install dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Create server/.env file
cp server/.env.example server/.env
# Edit server/.env with:
# - GEMINI_API_KEY (from https://aistudio.google.com/apikey)
# - ADMIN_EMAIL and ADMIN_PASSWORD
# - MONGODB_URI if not using local MongoDB
```

### 2. Run MongoDB
```bash
# Option A: Local installation
mongod

# Option B: Docker
docker compose up -d
```

### 3. Start Application
```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd client
npm run dev
```

**Access**: Frontend http://localhost:5173 | Backend http://localhost:5000

### 4. Login
- Email: Value from `ADMIN_EMAIL` in .env (default: admin@trends.local)
- Password: Value from `ADMIN_PASSWORD` in .env (default: admin123456)

## 🤖 Gemini AI Integration

All AI processing is handled exclusively by **Google's Gemini AI** (`gemini-1.5-flash`):

### Article Analysis (Real-time)
When an RSS article is fetched, Gemini AI extracts:
- **Summary**: 1-2 sentence overview
- **Keywords**: 5-8 relevant terms
- **Sentiment**: Positive/Negative/Neutral rating
- **Category**: One of 14 categories (Technology, Cryptocurrency, Politics, Business, Sports, Health, Entertainment, Science, War, Disaster, Climate, Culture, Education, Travel)
- **Country**: Geographic focus of the article

### Trend Detection (Every 15 minutes)
Gemini analyzes all recent articles to identify:
- **Trending Topics**: Real trending subjects with multiple mentions
- **Growth Indicators**: Percentage growth rate (0-100)
- **Breaking News**: Marks urgent/breaking trends
- **Trend Summaries**: Brief explanation of each trend

## 📖 Environment Variables

Create `server/.env`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/global-trend-monitor
JWT_SECRET=your-long-random-secret-min-32-chars
GEMINI_API_KEY=AIza-YOUR-ACTUAL-KEY-FROM-GOOGLE
GEMINI_MODEL=gemini-1.5-flash
AI_PROVIDER=gemini
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@trends.local
ADMIN_PASSWORD=admin123456
CLIENT_ORIGIN=http://localhost:5173
PORT=5000
TREND_NOTIFICATION_THRESHOLD=5
```

## 🔐 Admin Panel

Access admin features in **Settings → User Management**:

- **View All Users**: See all registered users and their roles
- **Change Roles**: Set user role to Admin/Analyst/Viewer
- **Delete Users**: Remove users from the system
- **Manage Profiles**: Admin can view preferences and settings

## 🌍 Filtering & Preferences

### Countries (Searchable)
Type to search: "United", "India", "Brazil", etc.
- Global, United States, United Kingdom, Canada, Australia, India, Japan, Germany, France, China, Brazil, Mexico

### Categories (14 Options)
- Technology, Cryptocurrency, Politics, Business, Sports, Health, Entertainment, Science, War, Disaster, Climate, Culture, Education, Travel

## 📋 User Roles

| Feature | Viewer | Analyst | Admin |
|---------|--------|---------|-------|
| View Trends | ✅ | ✅ | ✅ |
| Filter by Country/Category | ✅ | ✅ | ✅ |
| View Dashboard | ✅ | ✅ | ✅ |
| Edit Own Profile | ✅ | ✅ | ✅ |
| View All Users | ❌ | ❌ | ✅ |
| Manage User Roles | ❌ | ❌ | ✅ |
| Delete Users | ❌ | ❌ | ✅ |

## ⚙️ Background Jobs

- **Every 10 minutes**: Fetch new articles from RSS feeds
- **Every 15 minutes**: Run Gemini AI trend detection
- **Real-time**: Generate notifications for breaking trends

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Deploy client/ directory
# Set environment variable: VITE_API_URL=https://your-api-url/api
```

### Backend (Render)
```bash
# Use render.yaml or create Node service from server/
# Set environment variables (including GEMINI_API_KEY, MONGODB_URI)
```

### Database (MongoDB Atlas)
```bash
# Create free cluster at mongodb.com/atlas
# Get connection string and set as MONGODB_URI
```

## 📚 Documentation

See **SETUP_AND_TROUBLESHOOTING.md** for:
- Detailed setup instructions
- Troubleshooting guide
- Gemini API verification
- Common issues and solutions
- Database queries for monitoring

## 🔧 Troubleshooting

**Admin panel not showing?**
- Clear browser cache: DevTools → Application → Local Storage → Clear
- Re-login with admin credentials
- Verify ADMIN_EMAIL and ADMIN_PASSWORD are set in .env

**No trends detected?**
- Ensure GEMINI_API_KEY is set and valid
- Check RSS feeds are fetching (wait 10+ minutes)
- View server logs for AI errors

**Gemini API errors?**
- Get free API key: https://aistudio.google.com/apikey
- Set `GEMINI_API_KEY=AIza-YOUR-KEY`
- Restart server

## 📞 Development

```bash
# Run server tests
cd server && npm test

# Run linting
cd server && npm run lint

# View AI logs
# In MongoDB: db.ailogs.find({}).sort({createdAt:-1}).limit(10)
```

## 📄 License

MIT
