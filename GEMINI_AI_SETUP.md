# 🤖 Gemini AI Setup & Configuration

## Getting Gemini API Key

### Step 1: Get Free API Key
1. Go to https://aistudio.google.com/apikey
2. Click "Create API key in new project"
3. Copy the generated key (starts with `sk-proj-`)
4. Add to `server/.env`:
   ```env
   GEMINI_API_KEY=sk-proj-YOUR-FULL-KEY-HERE
   ```

### Step 2: Verify Key Works
```javascript
// In Node.js:
const response = await fetch(
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Hello, Gemini!' }] }]
    })
  }
);
const data = await response.json();
console.log(data); // Should have candidates with responses
```

---

## How Gemini is Used in Trend Detector

### 1. Article Analysis (Real-time)
**When**: Every time a new article is fetched from RSS
**What**: Gemini analyzes the article
**Extracts**:
- `summary` - 1-2 sentence overview
- `keywords` - 5-8 relevant terms  
- `sentiment` - Positive/Negative/Neutral
- `category` - One of 14 categories
- `country` - Geographic focus

**Code**: `server/src/services/aiService.js`
```javascript
async function geminiAnalysis(article) {
  const prompt = `Analyze this news article...`;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {...}
  );
  // Parse response and extract fields
}
```

### 2. Trend Detection (Every 15 minutes)
**When**: Scheduler runs every 15 minutes
**What**: Gemini analyzes 100 recent articles
**Extracts Trends**:
- `topic` - The trending topic
- `mentions` - How many times mentioned
- `growthIndicator` - Growth percentage
- `isBreaking` - Is this breaking news?
- `summary` - Explanation of trend

**Code**: `server/src/services/trendService.js`
```javascript
async function detectTrendsWithAi(articles) {
  const prompt = `Analyze articles and extract trending topics...`;
  const response = await fetch(...);
  // Parse trends and return array
}
```

---

## Configuration Options

### Model Selection
```env
# Current (recommended - fast & cost-effective)
GEMINI_MODEL=gemini-1.5-flash

# Alternative (more powerful but slower)
GEMINI_MODEL=gemini-1.5-pro

# Check available models: https://ai.google.dev/models
```

### Cost Considerations
- **gemini-1.5-flash**: ✅ Free tier generous, ~$0.075 per 1M input tokens
- **gemini-1.5-pro**: ✅ More capable, ~$1.50 per 1M input tokens

### Rate Limits
- Free tier: 15 requests per minute
- Upgrade for higher limits at https://aistudio.google.com

---

## Monitoring Gemini Usage

### Check Articles Analyzed by Gemini
```bash
mongosh
use global-trend-monitor

# Count articles analyzed by Gemini
db.articles.countDocuments({ aiProvider: "gemini" })

# See latest article analysis
db.articles.find({ aiProvider: "gemini" }).limit(1).pretty()

# Check specific fields extracted
db.articles.findOne({ _id: ObjectId(...) })
// Should have: summary, keywords, sentiment, sentimentScore, category, country
```

### Check Gemini AI Logs
```bash
# All Gemini operations (article analysis & trends)
db.ailogs.find({ provider: "gemini" }).pretty()

# Successful operations
db.ailogs.countDocuments({ provider: "gemini", status: "success" })

# Failed operations
db.ailogs.find({ provider: "gemini", status: "failed" }).pretty()

# Latest 10 operations
db.ailogs.find({ provider: "gemini" }).sort({createdAt:-1}).limit(10)
```

### Check Trend Detection Performance
```bash
# All detected trends with AI provider info
db.trends.find({}, { topic: 1, category: 1, country: 1, score: 1 }).limit(10)

# Trends by category
db.trends.aggregate([
  { $group: { _id: "$category", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

# Trends by country
db.trends.aggregate([
  { $group: { _id: "$country", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

---

## Prompt Engineering

### Article Analysis Prompt
```
Analyze this news article and return ONLY a JSON object with these fields:
- summary: brief 1-2 sentence summary
- keywords: array of 5-8 important keywords
- sentiment: "Positive", "Negative", or "Neutral"
- sentimentScore: number from -2 to 2
- category: one of [Technology, Cryptocurrency, ...]
- country: the country/region this article is about, or "Global"

Article: {title, description, source}
```

**Why this works**:
- ✅ Clear field definitions
- ✅ Specific value requirements (sentiment enum)
- ✅ JSON output format specified
- ✅ Includes all context needed

### Trend Detection Prompt
```
Analyze these news articles and extract the most trending topics. 
Return ONLY a JSON object with key "trends" containing an array of:
- topic: trending topic name (max 50 chars)
- mentions: number of mentions (1-1000)
- growthIndicator: growth rate 0-100%
- isBreaking: boolean for breaking news
- summary: brief summary (max 200 chars)

Be selective - only include real trends with multiple mentions.
Articles: {array of {title, category, country, keywords, sentiment}}
```

**Why this works**:
- ✅ "Be selective" prevents false positives
- ✅ Specific constraints (char limits, numeric ranges)
- ✅ Includes article metadata for context
- ✅ Clear output structure

---

## Troubleshooting

### Issue: "GEMINI_API_KEY environment variable is required"
**Solution**: 
1. Get key from https://aistudio.google.com/apikey
2. Add to `server/.env`
3. Restart server

### Issue: "Gemini API error: 403"
**Solutions**:
- API key is invalid or expired
- Get new key from aistudio.google.com
- Check key format: should start with `sk-proj-`

### Issue: "Gemini API error: 429"
**Problem**: Rate limit exceeded
**Solutions**:
- Upgrade to paid tier
- Reduce article batch size in trend detection
- Increase time between trend detection runs

### Issue: Articles missing fields
**Problem**: Gemini response parsing failed
**Solution**:
1. Check server logs for parse errors
2. Verify prompt in code matches expected output
3. Test prompt manually at aistudio.google.com

---

## Performance Optimization

### Batch Processing
```javascript
// Process articles in batches to avoid rate limits
const BATCH_SIZE = 100;
for (let i = 0; i < articles.length; i += BATCH_SIZE) {
  const batch = articles.slice(i, i + BATCH_SIZE);
  const results = await Promise.all(
    batch.map(article => analyzeArticle(article))
  );
}
```

### Caching Results
```javascript
// Cache analysis results by article link
const cache = new Map();
if (cache.has(article.link)) {
  return cache.get(article.link);
}
const result = await geminiAnalysis(article);
cache.set(article.link, result);
```

### Timeout Handling
```javascript
// Add timeout for API calls
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000); // 30 sec timeout
try {
  const response = await fetch(url, { signal: controller.signal });
} finally {
  clearTimeout(timeout);
}
```

---

## Advanced Configuration

### Custom Environment Variables
```env
# Control AI analysis
GEMINI_MODEL=gemini-1.5-flash
GEMINI_API_KEY=sk-proj-...
AI_PROVIDER=gemini                    # Always "gemini"

# Control trend detection
TREND_NOTIFICATION_THRESHOLD=5        # Breaking threshold
```

### Extending Categories
Edit `server/src/services/aiService.js`:
```javascript
const categories = [
  'Technology', 'Cryptocurrency', 'Politics', 'Business',
  // Add more as needed:
  'Sports', 'Health', 'Entertainment', 'Science', 'War',
  'Disaster', 'Climate', 'Culture', 'Education', 'Travel'
];
```

### Custom Country Detection
Modify the Gemini prompt to focus on specific regions:
```javascript
// In prompt, add:
"Consider these priority countries: USA, UK, India, China, ..."
```

---

## Testing Gemini Integration

### Manual Test
```bash
# SSH into your server/dev environment
node -e "
const fetch = require('node-fetch');
const test = async () => {
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Respond with only the word WORKING' }]
        }]
      })
    }
  );
  const data = await response.json();
  console.log(data);
};
test();
"
```

### Integration Test
```bash
# Start server with debug logging
DEBUG=* npm run dev

# Monitor API logs
# Open new terminal:
tail -f /path/to/server/logs.txt

# Manually trigger article analysis
curl -X POST http://localhost:5000/api/articles \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Testing Gemini"}'
```

---

## Deployment Notes

### Production Setup
```env
# Use strong API key (keep secret)
GEMINI_API_KEY=sk-proj-YOUR-PRODUCTION-KEY

# Monitor usage at: console.cloud.google.com
# Set billing alerts for unexpected charges
# Consider request quotas for stability
```

### Monitoring
```bash
# Check daily API usage
mongosh
db.ailogs.aggregate([
  { $group: { 
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
      count: { $sum: 1 },
      successes: { $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] } },
      failures: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } }
    }
  },
  { $sort: { _id: -1 } }
])
```

---

## References
- 📖 Gemini API Docs: https://ai.google.dev/docs
- 🔑 Get API Key: https://aistudio.google.com/apikey
- 💰 Pricing & Quotas: https://ai.google.dev/pricing
- 🐛 Troubleshoot: https://ai.google.dev/tutorials/troubleshooting
