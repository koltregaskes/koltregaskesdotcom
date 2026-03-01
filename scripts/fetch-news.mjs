#!/usr/bin/env node
/**
 * RSS News Fetcher
 *
 * Fetches AI news from RSS feeds and generates a digest file
 * in the format expected by generate-daily-digest.mjs.
 *
 * Replaces the external "News Scout" tool — runs entirely
 * within GitHub Actions with zero dependencies.
 *
 * Usage:
 *   node scripts/fetch-news.mjs [--date YYYY-MM-DD]
 *
 * Sources:
 *   - TechCrunch AI
 *   - Artificial Intelligence News
 *   - Reuters Technology
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// RSS feed sources
const FEEDS = [
  {
    name: 'TechCrunch AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    fallbackUrl: 'https://techcrunch.com/feed/'
  },
  {
    name: 'AI News',
    url: 'https://www.artificialintelligence-news.com/feed/',
    fallbackUrl: null
  },
  {
    name: 'Reuters Technology',
    url: 'https://www.reuters.com/technology/rss',
    fallbackUrl: 'https://feeds.reuters.com/reuters/technologyNews'
  }
];

// AI-related keywords for filtering general feeds
const AI_KEYWORDS = [
  'artificial intelligence', 'ai ', ' ai,', ' ai.', 'machine learning',
  'deep learning', 'neural network', 'large language model', 'llm',
  'chatbot', 'openai', 'anthropic', 'claude', 'gpt', 'gemini',
  'deepmind', 'midjourney', 'stable diffusion', 'generative ai',
  'ai model', 'ai agent', 'transformer', 'diffusion model',
  'copilot', 'automation', 'robotics', 'computer vision',
  'natural language', 'nlp', 'reinforcement learning',
  'ai startup', 'ai company', 'ai chip', 'gpu', 'nvidia',
  'ai regulation', 'ai safety', 'ai ethics', 'deepfake'
];

// Parse command line arguments
function parseArgs(args) {
  const result = { date: null };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--date' && args[i + 1]) {
      result.date = args[++i];
    } else if (args[i].startsWith('--date=')) {
      result.date = args[i].split('=')[1];
    }
  }

  if (!result.date) {
    result.date = new Date().toISOString().split('T')[0];
  }

  return result;
}

// Fetch URL with timeout and retries
async function fetchWithRetry(url, retries = 3, timeoutMs = 15000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'KolsKorner-NewsBot/1.0 (+https://koltregaskes.github.io/koltregaskesdotcom/)'
        }
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (err) {
      console.warn(`  Attempt ${attempt}/${retries} failed for ${url}: ${err.message}`);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }
    }
  }

  return null;
}

// Simple XML tag extractor (no dependencies needed)
function extractTag(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  if (!match) return '';

  let value = match[1].trim();

  // Handle CDATA
  const cdataMatch = value.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  if (cdataMatch) {
    value = cdataMatch[1].trim();
  }

  return value;
}

// Extract all occurrences of a tag
function extractAllTags(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const matches = [];
  let match;

  while ((match = regex.exec(xml)) !== null) {
    let value = match[1].trim();
    const cdataMatch = value.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
    if (cdataMatch) {
      value = cdataMatch[1].trim();
    }
    matches.push(value);
  }

  return matches;
}

// Parse RSS XML into items
function parseRSS(xml, sourceName) {
  const items = [];

  // Extract items (works for both RSS <item> and Atom <entry>)
  const itemBlocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ||
                     xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];

  for (const block of itemBlocks) {
    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link') ||
                 (block.match(/<link[^>]+href="([^"]+)"/i) || [])[1] || '';
    const description = extractTag(block, 'description') ||
                        extractTag(block, 'summary') ||
                        extractTag(block, 'content');
    const pubDate = extractTag(block, 'pubDate') ||
                    extractTag(block, 'published') ||
                    extractTag(block, 'updated');

    if (!title) continue;

    // Strip HTML from description
    const summary = description
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#160;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 300);

    // Clean title
    const cleanTitle = title
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#8217;/g, "'")
      .replace(/&#8216;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .trim();

    items.push({
      title: cleanTitle,
      url: link.trim(),
      summary,
      source: sourceName,
      pubDate: pubDate ? new Date(pubDate) : null,
      dateStr: pubDate ? new Date(pubDate).toISOString().split('T')[0] : null
    });
  }

  return items;
}

// Check if an item is AI-related (for general feeds)
function isAIRelated(item) {
  const text = `${item.title} ${item.summary}`.toLowerCase();
  return AI_KEYWORDS.some(keyword => text.includes(keyword));
}

// Fetch all feeds and collect items
async function fetchAllFeeds(targetDate) {
  const allItems = [];

  for (const feed of FEEDS) {
    console.log(`Fetching: ${feed.name}...`);

    let xml = await fetchWithRetry(feed.url);

    if (!xml && feed.fallbackUrl) {
      console.log(`  Trying fallback URL for ${feed.name}...`);
      xml = await fetchWithRetry(feed.fallbackUrl);
    }

    if (!xml) {
      console.warn(`  Failed to fetch ${feed.name}, skipping.`);
      continue;
    }

    const items = parseRSS(xml, feed.name);
    console.log(`  Found ${items.length} items from ${feed.name}`);

    // Filter: only AI-related items from general feeds
    const isAIFeed = feed.name.toLowerCase().includes('ai') ||
                     feed.url.includes('artificial-intelligence');
    const filtered = isAIFeed ? items : items.filter(isAIRelated);

    if (filtered.length < items.length) {
      console.log(`  Filtered to ${filtered.length} AI-related items`);
    }

    allItems.push(...filtered);
  }

  // Filter to items from recent days (within 3 days of target)
  const target = new Date(targetDate);
  const threeDaysAgo = new Date(target);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const recent = allItems.filter(item => {
    if (!item.pubDate) return true; // Keep items without dates
    return item.pubDate >= threeDaysAgo && item.pubDate <= new Date(targetDate + 'T23:59:59Z');
  });

  console.log(`\nTotal: ${allItems.length} items, ${recent.length} within date range`);

  // Deduplicate by title similarity
  const seen = new Set();
  const unique = recent.filter(item => {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`After dedup: ${unique.length} unique items`);

  // Sort by date (newest first)
  unique.sort((a, b) => {
    if (!a.pubDate) return 1;
    if (!b.pubDate) return -1;
    return b.pubDate - a.pubDate;
  });

  return unique;
}

// Group items into categories based on content
function categorise(items) {
  const categories = {
    'Top Stories': [],
    'Industry': [],
    'Research & Products': [],
    'Policy & Ethics': []
  };

  const policyKeywords = ['regulation', 'law', 'ban', 'policy', 'ethics', 'safety', 'govern', 'legislation', 'compliance', 'privacy'];
  const researchKeywords = ['model', 'benchmark', 'paper', 'release', 'launch', 'update', 'feature', 'tool', 'api'];

  for (const item of items) {
    const text = `${item.title} ${item.summary}`.toLowerCase();

    if (policyKeywords.some(k => text.includes(k))) {
      categories['Policy & Ethics'].push(item);
    } else if (researchKeywords.some(k => text.includes(k))) {
      categories['Research & Products'].push(item);
    } else {
      categories['Industry'].push(item);
    }
  }

  // Move top items from largest categories to Top Stories
  const allCats = ['Industry', 'Research & Products', 'Policy & Ethics'];
  for (const cat of allCats) {
    while (categories[cat].length > 5 && categories['Top Stories'].length < 8) {
      categories['Top Stories'].push(categories[cat].shift());
    }
  }

  // If Top Stories is still empty, take from each category
  if (categories['Top Stories'].length === 0) {
    for (const cat of allCats) {
      if (categories[cat].length > 0) {
        categories['Top Stories'].push(categories[cat].shift());
      }
    }
  }

  // Remove empty categories
  for (const [key, val] of Object.entries(categories)) {
    if (val.length === 0) delete categories[key];
  }

  return categories;
}

// Generate digest markdown in the format expected by generate-daily-digest.mjs
function generateDigestMarkdown(categories, date, totalCount) {
  const sourceNames = [...new Set(
    Object.values(categories).flat().map(i => i.source)
  )];

  let md = `# AI News Digest — ${date}\n\n`;
  md += `> Generated automatically by RSS News Fetcher. ${totalCount} stories from ${sourceNames.length} sources.\n\n`;

  for (const [category, items] of Object.entries(categories)) {
    md += `## ${category}\n\n`;

    for (const item of items) {
      md += `- **${item.title}** ([${item.source}](${item.url}))`;
      if (item.dateStr) {
        md += ` _${item.dateStr}_`;
      }
      md += '\n';

      if (item.summary) {
        md += `  ${item.summary}\n`;
      }

      md += '\n';
    }
  }

  return md;
}

// Main
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outputDir = path.join(__dirname, '..', 'news-digests');

  console.log(`Fetching news for: ${args.date}\n`);

  const items = await fetchAllFeeds(args.date);

  if (items.length === 0) {
    console.log('\nNo news items found. No digest file created.');
    process.exit(0);
  }

  const categories = categorise(items);
  const markdown = generateDigestMarkdown(categories, args.date, items.length);

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `${args.date}-digest.md`);
  await fs.writeFile(outputPath, markdown, 'utf-8');

  console.log(`\nDigest saved: ${outputPath}`);
  console.log(`Items: ${items.length}`);
}

main().catch(err => {
  console.error('Error fetching news:', err);
  process.exit(1);
});
