# ⚡ Quick Reference Card

## Environment Setup (server/.env)
```env
GEMINI_API_KEY=sk-proj-YOUR-KEY          # Get from aistudio.google.com/apikey
MONGODB_URI=mongodb://127.0.0.1:27017/global-trend-monitor
JWT_SECRET=your-secret-min-32-chars
ADMIN_EMAIL=admin@trends.local
ADMIN_PASSWORD=admin123456
```

## Startup Commands
```bash
# Terminal 1: Backend
cd server && npm run dev              # http://localhost:5000

# Terminal 2: Frontend  
cd client && npm run dev              # http://localhost:5173

# MongoDB (if not running)
mongod  # or: docker compose up -d
```

## Login Credentials
```
Email:    admin@trends.local
Password: admin123456
```

## Key Features
- 🤖 **Gemini AI**: Analyzes all articles & detects trends
- 🌍 **Multi-Dimensional**: Trends by category × country
- 🔍 **Searchable**: Countries dropdown with search
- 📂 **Categories**: 14 categories in dropdown
- 👥 **Admin Panel**: User management in Settings

## API Endpoints
```
GET    /api/health                        # Health check
POST   /api/auth/login                    # User login
POST   /api/auth/register                 # User signup
GET    /api/profile                       # Get user profile
PUT    /api/profile                       # Update profile
GET    /api/profile/admin/users           # List users (admin)
PUT    /api/profile/admin/users/:id/role  # Change role (admin)
DELETE /api/profile/admin/users/:id       # Delete user (admin)
GET    /api/trends                        # Get trends
GET    /api/trends?country=US&category=Tech  # Filter trends
GET    /api/trends/countries              # Available countries
GET    /api/trends/categories             # Available categories
```

## Database Collections
```bash
# Articles with AI analysis
db.articles.findOne()
# Fields: title, category, country, sentiment, keywords, summary

# Detected trends
db.trends.findOne()
# Fields: topic, category, country, score, growthRate, isBreaking

# Users with roles
db.users.findOne()
# Fields: role (admin/analyst/viewer), preferredCountries, preferredCategories

# AI operation logs
db.ailogs.findOne()
# Fields: provider, status, durationMs
```

## Countries (12 total)
Global, United States, United Kingdom, Canada, Australia, India, Japan, Germany, France, China, Brazil, Mexico

## Categories (14 total)
Technology, Cryptocurrency, Politics, Business, Sports, Health, Entertainment, Science, War, Disaster, Climate, Culture, Education, Travel

## Admin Panel Path
Settings → User Management
- View all users
- Change roles
- Delete users

## Background Jobs
- **Every 10 min**: Fetch RSS feeds
- **Every 15 min**: Detect trends via Gemini
- **Real-time**: Generate notifications

## Verification
```bash
# Verify Gemini working
mongosh
use global-trend-monitor
db.articles.findOne({ aiProvider: "gemini" })

# Check AI logs
db.ailogs.find({}).sort({createdAt:-1}).limit(5)

# Verify admin user
db.users.findOne({ role: "admin" })
```

## Common Fixes
```javascript
// Clear local storage (browser console)
localStorage.clear(); location.reload()

// Check user role in localStorage
console.log(localStorage.getItem('trend_user'))

// Check API token
console.log(localStorage.getItem('trend_token'))
```

## Deployment
- Frontend: Vercel (`client` directory)
- Backend: Render (`server` directory)
- Database: MongoDB Atlas

## Docs
- SETUP_AND_TROUBLESHOOTING.md - Full setup guide
- ADMIN_PANEL_TEST.md - Step-by-step testing
- README.md - Features & overview

## Support Checklist
- [ ] GEMINI_API_KEY set
- [ ] MongoDB running
- [ ] Admin user created
- [ ] Can login as admin
- [ ] Settings page loads
- [ ] Admin panel visible
- [ ] Countries dropdown works
- [ ] Categories dropdown works
