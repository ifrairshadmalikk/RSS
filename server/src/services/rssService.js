import Parser from 'rss-parser';
import { Article } from '../models/Article.js';
import { RssFeed } from '../models/RssFeed.js';
import { analyzeArticle } from './aiService.js';
import { detectTrends } from './trendService.js';

const parser = new Parser({
  customFields: {
    item: [['media:content', 'media'], ['media:thumbnail', 'thumbnail']]
  }
});

const feedTypes = ['application/rss+xml', 'application/atom+xml', 'application/feed+json', 'text/xml', 'application/xml'];
const commonFeedPaths = ['/feed', '/feed/', '/rss', '/rss.xml', '/atom.xml', '/feeds/posts/default'];
const knownFeedCandidates = {
  'bbc.com': ['https://feeds.bbci.co.uk/news/rss.xml'],
  'www.bbc.com': ['https://feeds.bbci.co.uk/news/rss.xml']
};

class FeedDiscoveryError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

function getImage(item) {
  return item.enclosure?.url || item.media?.$?.url || item.thumbnail?.$?.url || '';
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(value) {
  return decodeHtml(String(value || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' '));
}

async function canParseFeed(url) {
  try {
    const parsed = await parser.parseURL(url);
    return Boolean(parsed.items?.length || parsed.title || parsed.feedUrl);
  } catch {
    return false;
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function getAttribute(tag, attribute) {
  const match = tag.match(new RegExp(`${attribute}\\s*=\\s*["']([^"']+)["']`, 'i'));
  return match?.[1];
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'user-agent': 'TrendWatch RSS Discovery/1.0'
      }
    });
    if (!response.ok) throw new Error(`Website returned ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function findLinkedFeeds(html, baseUrl) {
  const links = html.match(/<link\b[^>]*>/gi) || [];
  return unique(
    links
      .filter((tag) => {
        const rel = getAttribute(tag, 'rel') || '';
        const type = getAttribute(tag, 'type') || '';
        return rel.toLowerCase().includes('alternate') && feedTypes.includes(type.toLowerCase());
      })
      .map((tag) => {
        const href = getAttribute(tag, 'href');
        return href ? new URL(href, baseUrl).toString() : null;
      })
  );
}

function findArticleLinks(html, baseUrl) {
  const anchors = html.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) || [];
  const base = new URL(baseUrl);
  const seen = new Set();
  const articles = [];

  for (const anchor of anchors) {
    const href = getAttribute(anchor, 'href');
    const title = stripTags(anchor);
    if (!href || title.length < 18) continue;

    let link;
    try {
      link = new URL(href, baseUrl);
    } catch {
      continue;
    }

    if (!['http:', 'https:'].includes(link.protocol)) continue;
    if (link.hostname !== base.hostname && !link.hostname.endsWith(`.${base.hostname}`)) continue;
    if (seen.has(link.toString())) continue;
    if (/\.(jpg|jpeg|png|gif|webp|pdf|mp4|mp3)$/i.test(link.pathname)) continue;

    const pathDepth = link.pathname.split('/').filter(Boolean).length;
    const looksLikeArticle = pathDepth >= 2 || /\d{4}|\d{5,}/.test(link.pathname);
    if (!looksLikeArticle) continue;

    seen.add(link.toString());
    articles.push({ title, link: link.toString() });
    if (articles.length >= 20) break;
  }

  return articles;
}

export async function resolveFeedUrl(inputUrl) {
  let normalized;
  try {
    normalized = new URL(inputUrl).toString();
  } catch {
    throw new FeedDiscoveryError('Please provide a valid website or RSS feed URL.');
  }

  if (await canParseFeed(normalized)) {
    return { feedUrl: normalized, websiteUrl: '', discoveredFrom: 'direct', sourceType: 'rss' };
  }

  const url = new URL(normalized);
  for (const candidate of knownFeedCandidates[url.hostname.toLowerCase()] || []) {
    if (await canParseFeed(candidate)) {
      return { feedUrl: candidate, websiteUrl: normalized, discoveredFrom: 'known-source', sourceType: 'rss' };
    }
  }

  let html = '';
  try {
    html = await fetchHtml(normalized);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new FeedDiscoveryError('The website took too long to respond while looking for RSS feeds.');
    }
    throw new FeedDiscoveryError(`Could not read this website while looking for RSS feeds. ${error.message}`);
  }

  const linkedFeeds = findLinkedFeeds(html, normalized);
  for (const candidate of linkedFeeds) {
    if (await canParseFeed(candidate)) {
      return { feedUrl: candidate, websiteUrl: normalized, discoveredFrom: 'html-link', sourceType: 'rss' };
    }
  }

  const origin = url.origin;
  for (const path of commonFeedPaths) {
    const candidate = new URL(path, origin).toString();
    if (await canParseFeed(candidate)) {
      return { feedUrl: candidate, websiteUrl: normalized, discoveredFrom: 'common-path', sourceType: 'rss' };
    }
  }

  throw new FeedDiscoveryError('No valid RSS/Atom feed found. Please provide a website with an RSS feed or the direct RSS feed URL.');
}

async function fetchRssFeed(feed) {
  let created = 0;
  const parsed = await parser.parseURL(feed.url);
  for (const item of parsed.items || []) {
    if (!item.link || await Article.exists({ link: item.link })) continue;
    const article = await Article.create({
      title: item.title || 'Untitled',
      description: item.contentSnippet || item.content || item.summary || '',
      source: feed.name,
      sourceFeed: feed._id,
      category: feed.category,
      link: item.link,
      image: getImage(item),
      publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
      raw: item
    });
    try {
      const analysis = await analyzeArticle(article);
      await Article.findByIdAndUpdate(article._id, analysis);
    } catch {
      await Article.findByIdAndUpdate(article._id, {
        summary: article.description?.slice(0, 240) || article.title,
        keywords: [],
        sentiment: 'Neutral',
        sentimentScore: 0,
        country: 'Global',
        aiProvider: 'fallback'
      });
    }
    created += 1;
  }
  return created;
}



export async function fetchAllFeeds() {
  const feeds = await RssFeed.find({ active: true });
  let created = 0;

  for (const feed of feeds) {
    try {
      created += await fetchRssFeed(feed);
      await RssFeed.findByIdAndUpdate(feed._id, { lastFetchedAt: new Date(), lastStatus: 'success', lastError: '' });
    } catch (error) {
      await RssFeed.findByIdAndUpdate(feed._id, { lastFetchedAt: new Date(), lastStatus: 'failed', lastError: error.message });
    }
  }

  await detectTrends();
  return { feeds: feeds.length, created };
}
