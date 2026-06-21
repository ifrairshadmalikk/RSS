import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: [
      ['ht:approx_traffic', 'traffic'],
      ['ht:news_item', 'newsItems', { keepArray: true }]
    ]
  },
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; TrendWatch/1.0; +https://trendwatch.app)',
    Accept: 'application/rss+xml, application/xml, text/xml, */*'
  }
});

export const TREND_COUNTRIES = [
  'Global',
  'United States',
  'United Kingdom',
  'India',
  'Pakistan',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Japan',
  'Brazil',
  'UAE',
  'Saudi Arabia',
  'Turkey',
  'South Africa'
];

export const TREND_CATEGORIES = [
  'Technology',
  'Business',
  'Sports',
  'Health',
  'Entertainment',
  'Science',
  'Politics',
  'World'
];

const COUNTRY_CONFIG = {
  Global: { geo: 'US', hl: 'en-US', gl: 'US', ceid: 'US:en' },
  'United States': { geo: 'US', hl: 'en-US', gl: 'US', ceid: 'US:en' },
  'United Kingdom': { geo: 'GB', hl: 'en-GB', gl: 'GB', ceid: 'GB:en' },
  India: { geo: 'IN', hl: 'en-IN', gl: 'IN', ceid: 'IN:en' },
  Pakistan: { geo: 'PK', hl: 'en-PK', gl: 'PK', ceid: 'PK:en' },
  Canada: { geo: 'CA', hl: 'en-CA', gl: 'CA', ceid: 'CA:en' },
  Australia: { geo: 'AU', hl: 'en-AU', gl: 'AU', ceid: 'AU:en' },
  Germany: { geo: 'DE', hl: 'de-DE', gl: 'DE', ceid: 'DE:de' },
  France: { geo: 'FR', hl: 'fr-FR', gl: 'FR', ceid: 'FR:fr' },
  Japan: { geo: 'JP', hl: 'ja-JP', gl: 'JP', ceid: 'JP:ja' },
  Brazil: { geo: 'BR', hl: 'pt-BR', gl: 'BR', ceid: 'BR:pt-419' },
  UAE: { geo: 'AE', hl: 'en-AE', gl: 'AE', ceid: 'AE:en' },
  'Saudi Arabia': { geo: 'SA', hl: 'ar-SA', gl: 'SA', ceid: 'SA:ar' },
  Turkey: { geo: 'TR', hl: 'tr-TR', gl: 'TR', ceid: 'TR:tr' },
  'South Africa': { geo: 'ZA', hl: 'en-ZA', gl: 'ZA', ceid: 'ZA:en' }
};

const GOOGLE_NEWS_TOPICS = {
  Technology: 'TECHNOLOGY',
  Business: 'BUSINESS',
  Sports: 'SPORTS',
  Health: 'HEALTH',
  Entertainment: 'ENTERTAINMENT',
  Science: 'SCIENCE',
  Politics: 'NATION',
  World: 'WORLD'
};

function pickValue(value) {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

function parseTraffic(raw) {
  if (!raw) return 0;
  const num = parseInt(String(raw).replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(num) ? num : 0;
}

function extractNewsItems(item) {
  const raw = item.newsItems || item['ht:news_item'];
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((entry) => ({
    title: pickValue(entry['ht:news_item_title'] || entry.title),
    link: pickValue(entry['ht:news_item_url'] || entry.url),
    source: pickValue(entry['ht:news_item_source'] || entry.source) || 'Google News'
  })).filter((a) => a.title && a.link);
}

function headlineToTopic(title) {
  return title.split(/[:\-|–—]/)[0].trim().slice(0, 80);
}

async function fetchGoogleTrends(country) {
  const config = COUNTRY_CONFIG[country] || COUNTRY_CONFIG.Global;
  const url = `https://trends.google.com/trending/rss?geo=${config.geo}`;
  const feed = await parser.parseURL(url);
  return (feed.items || []).map((item, index) => {
    const traffic = parseTraffic(item.traffic);
    const relatedArticles = extractNewsItems(item);
    return {
      _id: `gt-${config.geo}-${index}-${item.title}`,
      topic: item.title || 'Unknown',
      category: 'Trending',
      country,
      mentions: traffic || relatedArticles.length * 1000,
      previousMentions: 0,
      growthRate: Math.max(10, 100 - index * 5),
      sentiment: 'Neutral',
      score: traffic || (100 - index) * 100,
      isBreaking: index < 3 && (traffic > 500 || relatedArticles.length >= 2),
      relatedArticles: relatedArticles.slice(0, 5),
      lastUpdated: item.pubDate ? new Date(item.pubDate) : new Date(),
      source: 'Google Trends'
    };
  });
}

async function fetchGoogleNewsHeadlines(country, topicKey) {
  const config = COUNTRY_CONFIG[country] || COUNTRY_CONFIG.Global;
  const topic = GOOGLE_NEWS_TOPICS[topicKey];
  const url = topic
    ? `https://news.google.com/rss/headlines/section/topic/${topic}?hl=${config.hl}&gl=${config.gl}&ceid=${config.ceid}`
    : `https://news.google.com/rss?hl=${config.hl}&gl=${config.gl}&ceid=${config.ceid}`;
  const feed = await parser.parseURL(url);
  const grouped = new Map();

  for (const item of feed.items || []) {
    const topicName = headlineToTopic(item.title || '');
    if (!topicName) continue;
    if (!grouped.has(topicName)) {
      grouped.set(topicName, {
        _id: `gn-${config.geo}-${topicKey || 'top'}-${topicName}`,
        topic: topicName,
        category: topicKey || 'Trending',
        country,
        mentions: 0,
        previousMentions: 0,
        growthRate: 0,
        sentiment: 'Neutral',
        score: 0,
        isBreaking: false,
        relatedArticles: [],
        lastUpdated: item.pubDate ? new Date(item.pubDate) : new Date(),
        source: 'Google News'
      });
    }
    const trend = grouped.get(topicName);
    trend.mentions += 1;
    trend.score += 100;
    if (trend.relatedArticles.length < 5) {
      trend.relatedArticles.push({ title: item.title, link: item.link, source: item.creator || 'Google News' });
    }
  }

  return [...grouped.values()]
    .sort((a, b) => b.score - a.score)
    .map((trend, index) => ({
      ...trend,
      growthRate: Math.max(5, 80 - index * 4),
      isBreaking: index < 2 && trend.mentions >= 2
    }));
}

export async function fetchLiveTrends({ country = 'Global', category = '', limit = 50 } = {}) {
  const resolvedCountry = TREND_COUNTRIES.includes(country) ? country : 'Global';

  let items = [];
  if (category && GOOGLE_NEWS_TOPICS[category]) {
    items = await fetchGoogleNewsHeadlines(resolvedCountry, category);
  } else {
    try {
      items = await fetchGoogleTrends(resolvedCountry);
    } catch (error) {
      console.warn('Google Trends RSS failed, falling back to Google News:', error.message);
      items = await fetchGoogleNewsHeadlines(resolvedCountry, '');
    }
  }

  if (!items.length && category) {
    items = await fetchGoogleNewsHeadlines(resolvedCountry, category);
  }

  return { items: items.slice(0, limit), source: 'google' };
}
