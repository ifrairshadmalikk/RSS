import { AiLog } from '../models/AiLog.js';
import { Article } from '../models/Article.js';
import { fetchLiveTrends } from './googleTrendsService.js';

const categories = ['Technology', 'Cryptocurrency', 'Politics', 'Business', 'Sports', 'Health', 'Entertainment', 'Science', 'War', 'Disaster', 'Climate', 'Culture', 'Education', 'Travel'];
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const DEFAULT_GEMINI_FALLBACK_MODELS = ['gemini-2.5-flash-lite'];
const retiredGeminiModelAliases = new Map([
  ['gemini-pro', DEFAULT_GEMINI_MODEL],
  ['gemini-pro-latest', DEFAULT_GEMINI_MODEL],
  ['gemini-1.5-flash', DEFAULT_GEMINI_MODEL],
  ['gemini-1.5-flash-latest', DEFAULT_GEMINI_MODEL],
  ['gemini-1.5-pro', 'gemini-2.5-pro'],
  ['gemini-1.5-pro-latest', 'gemini-2.5-pro']
]);

export function getGeminiApiKey() {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error('GEMINI_API_KEY environment variable is required for Gemini AI');
  }
  if (key.includes('YOUR') || key.includes('replace-with') || key.startsWith('sk-') ) {
    throw new Error('GEMINI_API_KEY must be a Google AI Studio API key. Create one at https://aistudio.google.com/apikey and set the value that starts with AIza.');
  }
  return key;
}
//add

export function isGeminiConfigError(error) {
  return error?.message?.includes('GEMINI_API_KEY');
}

export function getGeminiModel() {
  const model = process.env.GEMINI_MODEL?.trim();
  if (!model) return DEFAULT_GEMINI_MODEL;

  return retiredGeminiModelAliases.get(model) || model;
}

function normalizeGeminiModel(model) {
  const trimmed = String(model || '').trim();
  return retiredGeminiModelAliases.get(trimmed) || trimmed;
}

function getGeminiFallbackModels() {
  const configured = process.env.GEMINI_FALLBACK_MODELS?.split(',').map(normalizeGeminiModel).filter(Boolean);
  const fallbackModels = configured?.length ? configured : DEFAULT_GEMINI_FALLBACK_MODELS;
  return [...new Set(fallbackModels)].filter((model) => model !== getGeminiModel());
}

function isRetryableGeminiStatus(status) {
  return [429, 500, 502, 503, 504].includes(status);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateGeminiContent(body, { maxRetries = 2 } = {}) {
  const apiKey = getGeminiApiKey();
  const models = [getGeminiModel(), ...getGeminiFallbackModels()];
  let lastError = null;

  for (const model of models) {
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (response.ok) {
          return response.json();
        }

        const detail = await response.text().catch(() => response.statusText);
        lastError = new Error(`Gemini API error: ${response.status} ${detail.slice(0, 300)}`);

        if (!isRetryableGeminiStatus(response.status)) {
          throw lastError;
        }
      } catch (error) {
        lastError = error;
      }

      if (attempt < maxRetries) {
        await wait(500 * (attempt + 1));
      }
    }
  }

  throw lastError || new Error('Gemini API error: request failed');
}

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

async function geminiAnalysis(article) {
  const prompt = `Analyze this news article and return ONLY a JSON object with these fields:
- summary: brief 1-2 sentence summary
- keywords: array of 5-8 important keywords
- sentiment: "Positive", "Negative", or "Neutral"
- sentimentScore: number from -2 to 2
- category: one of [Technology, Cryptocurrency, Politics, Business, Sports, Health, Entertainment, Science, War, Disaster, Climate, Culture, Education, Travel]
- country: the country/region this article is about, or "Global"

Article: ${JSON.stringify(article)}`;

  const data = await generateGeminiContent({ contents: [{ parts: [{ text: prompt }] }] });
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const parsed = parseJsonObject(text, {});
  
  return {
    summary: parsed.summary || article.description?.slice(0, 240) || '',
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    sentiment: ['Positive', 'Negative', 'Neutral'].includes(parsed.sentiment) ? parsed.sentiment : 'Neutral',
    sentimentScore: Number(parsed.sentimentScore) || 0,
    category: categories.includes(parsed.category) ? parsed.category : 'Business',
    country: parsed.country || 'Global'
  };
}

async function geminiChat(messages, systemPrompt) {
  const contents = messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const data = await generateGeminiContent({
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents
  });
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Sorry, I could not generate a response.';
}

async function buildAssistantContext() {
  const [articles, trends] = await Promise.all([
    Article.find().sort({ publishedAt: -1 }).limit(8).select('title summary category country keywords sentiment link'),
    fetchLiveTrends({ country: 'Global', limit: 8 }).catch(() => ({ items: [] }))
  ]);

  const articleLines = articles.map((a) => `- ${a.title} (${a.category}, ${a.country}): ${a.summary?.slice(0, 120) || ''}`).join('\n');
  const trendLines = (trends.items || []).map((t) => `- ${t.topic} (${t.country}, score: ${t.score})`).join('\n');

  return { articleLines, trendLines };
}

export async function chatWithAssistant(message, history = []) {
  const { articleLines, trendLines } = await buildAssistantContext();
  const systemPrompt = `You are TrendWatch AI Assistant — a helpful news and trends expert inside the TrendWatch app.
Help users with news summaries, trending topics, category insights, and general questions about current events.
Use the context below when relevant. Be concise, friendly, and factual. If you don't know something, say so.

Recent articles from the platform:
${articleLines || 'No recent articles available.'}

Live Google trending topics:
${trendLines || 'No live trends available.'}`;

  const messages = [
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message }
  ];

  return geminiChat(messages, systemPrompt);
}

export async function analyzeArticle(article) {
  const started = Date.now();
  const provider = 'gemini';
  
  try {
    const result = await geminiAnalysis(article);
    await AiLog.create({ article: article._id, provider, status: 'success', durationMs: Date.now() - started });
    return { ...result, aiProvider: provider };
  } catch (error) {
    if (!isGeminiConfigError(error)) {
      await AiLog.create({ article: article._id, provider, status: 'failed', message: error.message, durationMs: Date.now() - started });
    }
    console.error('Gemini article analysis failed:', error);
    return {
      summary: article.description?.slice(0, 240) || article.title || '',
      keywords: [],
      sentiment: 'Neutral',
      sentimentScore: 0,
      category: article.category || 'Business',
      country: article.country || 'Global',
      aiProvider: 'fallback'
    };
  }
}
