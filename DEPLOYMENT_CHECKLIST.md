# 🚀 Deployment Checklist

Use this checklist when deploying to production (Vercel + Render + MongoDB Atlas).

## Pre-Deployment (Local Testing)

- [ ] All admin panel features working locally
- [ ] Countries dropdown searchable
- [ ] Categories dropdown functional
- [ ] Gemini AI analyzing articles correctly
- [ ] Trends detected every 15 minutes
- [ ] User management (create/update/delete) working
- [ ] Profile preferences saving
- [ ] Notifications generating
- [ ] No errors in browser console
- [ ] No errors in server logs

---

## Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Cluster
- [ ] Go to https://mongodb.com/atlas
- [ ] Create free tier cluster
- [ ] Create database user with username/password
- [ ] Whitelist IP (or allow all for testing: 0.0.0.0/0)
- [ ] Copy connection string

### Step 2: Get Connection String
```
mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
```
- [ ] Save this for backend environment variables

### Step 3: Verify Connection
```bash
mongosh "your-connection-string"
show dbs
# Should list databases
```

---

## Frontend Deployment (Vercel)

### Step 1: Prepare Repository
- [ ] Push `client` directory to GitHub
- [ ] Ensure `.gitignore` excludes `node_modules`, `.env`
- [ ] No hardcoded API URLs

### Step 2: Deploy to Vercel
1. Go to https://vercel.com
2. Connect GitHub account
3. Import `client` repository
4. **Environment Variables**:
   ```
   VITE_API_URL=https://your-render-api.onrender.com/api
   ```
5. Click Deploy

### Step 3: Configure Domain (Optional)
- [ ] Add custom domain in Vercel
- [ ] Update `CLIENT_ORIGIN` in backend if domain changed

### Step 4: Verify Frontend
- [ ] Frontend accessible at custom domain or vercel URL
- [ ] Can navigate to all pages
- [ ] API requests going to backend

---

## Backend Deployment (Render)

### Step 1: Prepare Repository
- [ ] Push `server` directory to GitHub
- [ ] Ensure `.gitignore` excludes `node_modules`, `.env`

### Step 2: Deploy to Render
1. Go to https://render.com
2. Connect GitHub account
3. Create new Web Service
4. Select `server` repository
5. **Configuration**:
   - Name: `trend-detector-api`
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm run dev` or `node src/index.js`
   - Plan: Free tier (or paid for production)

### Step 3: Add Environment Variables
In Render dashboard, set:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
JWT_SECRET=your-super-long-random-secret-min-32-chars
GEMINI_API_KEY=AIza-YOUR-PRODUCTION-KEY
GEMINI_MODEL=gemini-1.5-flash
AI_PROVIDER=gemini
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@trends.local
ADMIN_PASSWORD=admin123456
CLIENT_ORIGIN=https://your-frontend-domain.com
PORT=5000
TREND_NOTIFICATION_THRESHOLD=5
```

### Step 4: Deploy
- [ ] Click Deploy
- [ ] Wait for build to complete
- [ ] Check logs for errors

### Step 5: Verify Backend
```bash
# Test health endpoint
curl https://your-render-api.onrender.com/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

---

## Post-Deployment Testing

### Admin User Creation
- [ ] Server started successfully
- [ ] Check MongoDB for admin user:
  ```bash
  mongosh "your-connection-string"
  db.users.findOne({ role: "admin" })
  ```

### Login Test
- [ ] Visit frontend URL
- [ ] Login with admin credentials
- [ ] Redirected to Dashboard
- [ ] Settings page loads
- [ ] Admin panel visible

### Feature Test
- [ ] Create test user (sign up)
- [ ] Login as admin
- [ ] Change test user role
- [ ] Delete test user
- [ ] Add RSS feed
- [ ] Verify articles fetched
- [ ] Check Gemini analysis on articles
- [ ] Wait 15 min for trends
- [ ] Filter trends by country/category

### API Testing
```bash
# Test API endpoints
curl -X GET https://your-api/api/health

curl -X POST https://your-api/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@trends.local","password":"admin123456"}'

curl -X GET https://your-api/api/trends
```

---

## Monitoring & Maintenance

### Daily Checks
- [ ] Frontend loads
- [ ] Can login
- [ ] No 500 errors in logs
- [ ] Articles being fetched
- [ ] Trends being detected

### Weekly Checks
- [ ] User counts growing
- [ ] Gemini API working (check ailogs)
- [ ] No database errors
- [ ] Performance acceptable

### Monthly Checks
- [ ] Review error logs
- [ ] Check API usage/costs
- [ ] Backup database
- [ ] Update dependencies

---

## Rollback Plan

If deployment fails:

### For Frontend
```bash
# Redeploy previous version from Vercel dashboard
# Or rollback via GitHub if needed
```

### For Backend
```bash
# Render keeps deployment history
# Click "Deployments" tab
# Select previous successful deployment
# Click "Redeploy"
```

### For Database
```bash
# MongoDB Atlas keeps automated backups
# Go to Atlas dashboard
# Backup & Restore tab
# Restore from latest backup
```

---

## Performance Optimization

### Frontend (Vercel)
- [ ] Enable Gzip compression
- [ ] Enable caching headers
- [ ] Optimize images
- [ ] Minify CSS/JS (Vite does this)

### Backend (Render)
- [ ] Use free tier initially, upgrade if needed
- [ ] Monitor response times in logs
- [ ] Consider caching for trends
- [ ] Monitor database query performance

### Database (MongoDB Atlas)
- [ ] Monitor storage usage
- [ ] Index optimization (done automatically)
- [ ] Connection pooling enabled
- [ ] Enable backups

---

## Security Checklist

- [ ] JWT_SECRET is long and random (min 32 chars)
- [ ] GEMINI_API_KEY not exposed in logs/code
- [ ] MONGODB_URI username/password set correctly
- [ ] IP whitelist configured if needed
- [ ] HTTPS enabled (automatic on Vercel/Render)
- [ ] CORS configured for frontend domain
- [ ] No console.log of sensitive data
- [ ] Admin password strong and changed from default
- [ ] Rate limiting considered for APIs

---

## DNS & Domain (Optional)

### Custom Domain on Vercel
1. Add domain in Vercel
2. Update DNS records with Vercel nameservers
3. Wait for propagation (24-48 hours)

### Update Backend Reference
```env
# Change VITE_API_URL to:
https://api.your-domain.com/api
```

---

## Scaling for Growth

### If traffic increases:
- [ ] Upgrade Render plan to paid tier
- [ ] Enable auto-scaling if available
- [ ] Increase database plan on MongoDB Atlas
- [ ] Add caching (Redis)
- [ ] Optimize database indexes

### If storage increases:
- [ ] Monitor MongoDB storage usage
- [ ] Consider archiving old trends
- [ ] Implement data cleanup for old articles
- [ ] Upgrade database plan if needed

---

## Troubleshooting Production Issues

### Frontend not loading
```bash
# Check Vercel logs
# Verify VITE_API_URL points to correct backend
# Clear browser cache
```

### Backend 500 errors
```bash
# Check Render logs
# Verify all environment variables set
# Check database connection
# Restart Render service
```

### Gemini API not working
```bash
# Verify GEMINI_API_KEY in env vars
# Check API key is valid
# Check rate limits not exceeded
# Check MongoDB logs
```

### Trends not detected
```bash
# Verify RSS feeds are configured
# Check articles are being fetched
# Check Gemini API keys and logs
# Wait 15+ minutes for detection run
# Manually trigger trend detection if possible
```

---

## Contacts & Resources

- 📞 **Vercel Support**: vercel.com/support
- 📞 **Render Support**: render.com/support
- 📞 **MongoDB Support**: mongodb.com/support
- 📧 **Google AI Support**: ai.google.dev/support
- 📚 **This Repo Docs**: README.md, SETUP_AND_TROUBLESHOOTING.md

---

## Final Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Render
- [ ] MongoDB Atlas database created
- [ ] Admin user created
- [ ] All environment variables set
- [ ] Admin panel working in production
- [ ] Countries/categories dropdowns functional
- [ ] Gemini AI analyzing articles
- [ ] Trends detected successfully
- [ ] Users can login and manage profiles
- [ ] Notifications working
- [ ] No errors in logs
- [ ] Backup strategy in place
- [ ] Monitoring in place

**✅ Ready for Production!**

