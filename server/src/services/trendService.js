import { Article } from '../models/Article.js';
import { AiLog } from '../models/AiLog.js';
import { Notification } from '../models/Notification.js';
import { Trend } from '../models/Trend.js';
import { generateGeminiContent, isGeminiConfigError } from './aiService.js';
import { sendTrendEmailAlerts } from './emailService.js';

function parseJsonObject(text, fallback) {
  const cleaned = String(text || '').replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return fallback;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return fallback;
  }
}

function dominantSentiment(articles) {
  const counts = articles.reduce((acc, article) => {
    acc[article.sentiment] = (acc[article.sentiment] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Neutral';
}

async function detectTrendsWithAi(articles) {
  const provider = 'gemini';
  const started = Date.now();
  
  try {
    const prompt = `Analyze these news articles and extract the most trending topics. Return ONLY a JSON object with key "trends" containing an array of trend objects with these exact fields:
- topic: the trending topic name (string, max 50 chars)
- mentions: estimated number of mentions (number, 1-1000)
- growthIndicator: growth rate percentage (number, 0-100)
- isBreaking: whether this is breaking news (boolean)
- summary: brief summary of the trend (string, max 200 chars)

Be selective and only include real, verifiable trends with multiple article mentions. Analyze only the provided articles.

Articles to analyze:
${JSON.stringify(articles.slice(0, 100).map(a => ({ title: a.title, category: a.category, country: a.country, keywords: a.keywords, sentiment: a.sentiment })))}`;

    const data = await generateGeminiContent({ contents: [{ parts: [{ text: prompt }] }] });
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{"trends":[]}';
    const parsed = parseJsonObject(text, { trends: [] });
    const trends = parsed.trends || [];
    
    await AiLog.create({ provider, status: 'success', durationMs: Date.now() - started });
    return trends;
  } catch (error) {
    if (!isGeminiConfigError(error)) {
      await AiLog.create({ provider, status: 'failed', message: error.message, durationMs: Date.now() - started });
    }
    console.error('Gemini trend detection failed:', error);
    return [];
  }
}

export async function detectTrends() {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const recent = await Article.find({ publishedAt: { $gte: last24h } }).sort({ publishedAt: -1 }).limit(2000);

  if (recent.length === 0) {
    return { topics: 0 };
  }

  const aiTrends = await detectTrendsWithAi(recent);
  
  if (aiTrends.length === 0) {
    return { topics: 0 };
  }

  const writes = [];
  const threshold = Number(process.env.TREND_NOTIFICATION_THRESHOLD || 5);

  for (const aiTrend of aiTrends) {
    const topic = aiTrend.topic || '';
    if (!topic || topic.length < 2) continue;

    const relatedArticles = recent
      .filter(a => {
        const text = `${a.title} ${(a.keywords || []).join(' ')}`.toLowerCase();
        return text.includes(topic.toLowerCase());
      })
      .slice(0, 10);

    if (relatedArticles.length < 2) continue;

    const grouped = new Map();
    relatedArticles.forEach(a => {
      const key = `${a.category || 'General'}|${a.country || 'Global'}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(a);
    });

    for (const [key, articles] of grouped.entries()) {
      const [category, country] = key.split('|');
      const mentions = articles.length;
      const filter = { topic, category, country };
      const previousTrend = await Trend.findOne(filter);
      const previousMentions = previousTrend?.mentions || 0;
      const growthRate = previousMentions > 0 ? Math.round(((mentions - previousMentions) / previousMentions) * 100) : (mentions >= 5 ? 50 : 0);
      const score = mentions * 10 + Math.max(growthRate, 0) * 2 + (aiTrend.growthIndicator || 0);
      const isBreaking = (aiTrend.isBreaking === true) || mentions >= threshold || growthRate >= 100;

      writes.push({
        updateOne: {
          filter,
          update: {
            $set: {
              topic,
              category,
              country,
              mentions,
              previousMentions,
              growthRate,
              score,
              isBreaking,
              relatedArticles: articles.slice(0, 5).map(a => ({ title: a.title, link: a.link, source: a.source, publishedAt: a.publishedAt })),
              sentiment: dominantSentiment(articles),
              lastUpdated: now
            },
            $push: { history: { mentions, score, capturedAt: now } }
          },
          upsert: true
        }
      });

      if (isBreaking) {
        const recentNotification = await Notification.exists({ topic, category, country, createdAt: { $gte: new Date(now.getTime() - 60 * 60 * 1000) } });
        if (!recentNotification) {
          await Notification.create({
            topic,
            category,
            country,
            mentions,
            message: aiTrend.summary || `Breaking: ${topic} trending in ${category} (${country}) with ${mentions} articles.`
          });
          sendTrendEmailAlerts({
            topic,
            category,
            country,
            mentions,
            previousMentions,
            growthRate,
            score,
            isBreaking,
            relatedArticles: articles.slice(0, 5).map(a => ({ title: a.title, link: a.link, source: a.source, publishedAt: a.publishedAt })),
            sentiment: dominantSentiment(articles),
            lastUpdated: now
          }, aiTrend.summary || `Breaking: ${topic} trending in ${category} (${country}) with ${mentions} articles.`)
            .catch((error) => console.error('Trend email alert failed:', error));
        }
      }
    }
  }

  if (writes.length) await Trend.bulkWrite(writes);
  return { topics: writes.length };
}
