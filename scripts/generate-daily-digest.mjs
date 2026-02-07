#!/usr/bin/env node
/**
 * Daily News Digest Generator
 *
 * Reads news items from configured source, generates a formatted
 * markdown blog post, and saves it to the content/ folder.
 *
 * Usage:
 *   node scripts/generate-daily-digest.mjs [--date YYYY-MM-DD] [--force] [--allow-empty]
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
// Priority: ENV var > local news/ folder > Agent Workspace (for local dev)
const getNewsSourcePath = () => {
  if (process.env.NEWS_SOURCE_PATH) return process.env.NEWS_SOURCE_PATH;

  const localNews = path.join(__dirname, '..', 'news');
  try {
    // Check if local news folder exists and has content
    const fs = require('fs');
    if (fs.existsSync(localNews) && fs.readdirSync(localNews).length > 0) {
      return localNews;
    }
  } catch {}

  // Fall back to Agent Workspace for local development
  return 'W:/Agent Workspace/Content/News';
};

const CONFIG = {
  newsSourcePath: getNewsSourcePath(),
  contentOutputPath: process.env.CONTENT_OUTPUT_PATH || path.join(__dirname, '..', 'content'),
  author: 'Kol',
  defaultTags: ['ai', 'news', 'digest']
};

// Parse command line arguments
function parseArgs(args) {
  const result = { date: null, force: false, allowEmpty: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--date' && args[i + 1]) {
      result.date = args[++i];
    } else if (args[i].startsWith('--date=')) {
      result.date = args[i].split('=')[1];
    } else if (args[i] === '--force') {
      result.force = true;
    } else if (args[i] === '--allow-empty') {
      result.allowEmpty = true;
    }
  }

  // Default to today
  if (!result.date) {
    result.date = new Date().toISOString().split('T')[0];
  }

  return result;
}

// Format date for display
function formatDateForDisplay(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Simple frontmatter parser
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Handle arrays
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    } else {
      value = value.replace(/^["']|["']$/g, '');
    }

    frontmatter[key] = value;
  }

  return { frontmatter, body: match[2] };
}

// Read news items for a given date
async function readNewsItems(date) {
  // Priority order:
  // 1. YYYY-MM-DD-digest.md (curated /news-gatherer output)
  // 2. YYYY-MM-DD/ directory (JSON files)
  // 3. YYYY-MM-DD.json
  // 4. YYYY-MM-DD.md
  const possiblePaths = [
    path.join(CONFIG.newsSourcePath, `${date}-digest.md`),  // Curated digest first!
    path.join(CONFIG.newsSourcePath, date),
    path.join(CONFIG.newsSourcePath, 'daily', date),
    path.join(CONFIG.newsSourcePath, `${date}.json`),
    path.join(CONFIG.newsSourcePath, `${date}.md`)
  ];

  for (const newsPath of possiblePaths) {
    try {
      const stats = await fs.stat(newsPath);

      if (stats.isDirectory()) {
        return await readNewsFromDirectory(newsPath);
      } else if (newsPath.endsWith('-digest.md')) {
        // Parse curated digest format from /news-gatherer
        const content = await fs.readFile(newsPath, 'utf-8');
        return parseNewsGathererDigest(content);
      } else if (newsPath.endsWith('.json')) {
        const content = await fs.readFile(newsPath, 'utf-8');
        const data = JSON.parse(content);
        return Array.isArray(data) ? data : data.items || [data];
      } else if (newsPath.endsWith('.md')) {
        const content = await fs.readFile(newsPath, 'utf-8');
        return [parseNewsMarkdown(content)];
      }
    } catch {
      continue;
    }
  }

  return [];
}

// Parse the /news-gatherer digest format
// Format: - **Title** ([Source](URL)) _YYYY-MM-DD_
//           Summary text here.
function parseNewsGathererDigest(content) {
  const items = [];
  let currentCategory = 'Top Stories';

  // Split into lines
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect category headers (## Top Stories, ## Research, etc.)
    const categoryMatch = line.match(/^##\s+(.+)$/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim();
      continue;
    }

    // Parse news items: - **Title** ([Source](URL)) _date_
    const itemMatch = line.match(/^-\s+\*\*(.+?)\*\*\s+\(\[(.+?)\]\((.+?)\)\)(?:\s+_(.+?)_)?$/);
    if (itemMatch) {
      const [, title, sourceName, url, date] = itemMatch;

      // Get summary from next line(s) - indented text
      let summary = '';
      let j = i + 1;
      while (j < lines.length && lines[j].match(/^\s{2,}/)) {
        summary += lines[j].trim() + ' ';
        j++;
      }

      // Skip navigation/junk items
      if (isJunkItem(title, url)) {
        continue;
      }

      items.push({
        title: title.trim(),
        source: sourceName.trim(),
        url: url.trim(),
        summary: summary.trim(),
        category: currentCategory,
        date: date ? date.trim() : null
      });
    }
  }

  return items;
}

// Filter out navigation links and junk items
function isJunkItem(title, url) {
  const junkTitles = [
    'Browse Business',
    'Browse Sustainability',
    'Sponsored Content',
    'View All Latest',
    'Momentum AI'
  ];

  const junkUrlPatterns = [
    /\/business\/?$/,
    /\/sustainability\/?$/,
    /\/sponsored\/?$/,
    /events\.reutersevents\.com/,
    /artificial-intelligence-news\/?$/
  ];

  if (junkTitles.some(t => title.includes(t))) return true;
  if (junkUrlPatterns.some(p => p.test(url))) return true;

  return false;
}

// Read news from a directory of markdown/json files
async function readNewsFromDirectory(dirPath) {
  const files = await fs.readdir(dirPath);
  const items = [];

  // Prefer JSON files - only fall back to MD if no JSON exists
  const jsonFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('_') && !f.includes('metadata'));
  const mdFiles = files.filter(f => f.endsWith('.md') && !f.includes('CLAUDE'));

  // If we have JSON files, use those (they're structured data from gather.py)
  if (jsonFiles.length > 0) {
    for (const file of jsonFiles) {
      const filePath = path.join(dirPath, file);
      const content = await fs.readFile(filePath, 'utf-8');
      try {
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
          items.push(...data);
        } else if (data.title) {
          items.push(data);
        }
      } catch {
        // Skip malformed JSON
      }
    }
  } else {
    // Fall back to markdown files
    for (const file of mdFiles) {
      const filePath = path.join(dirPath, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const item = parseNewsMarkdown(content, file);
      if (item) items.push(item);
    }
  }

  return items;
}

// Parse a markdown news item
function parseNewsMarkdown(content, filename = 'news') {
  const { frontmatter, body } = parseFrontmatter(content);

  // Extract title from heading if not in frontmatter
  let title = frontmatter.title;
  if (!title) {
    const headingMatch = body.match(/^#\s+(.+)$/m);
    title = headingMatch ? headingMatch[1] : filename.replace('.md', '');
  }

  // Extract summary
  const summary = frontmatter.summary || frontmatter.description ||
    body.replace(/^#.*$/gm, '').trim().split('\n\n')[0].slice(0, 200);

  return {
    title,
    summary,
    content: body.trim(),
    source: frontmatter.source || frontmatter.url,
    category: frontmatter.category || 'General',
    tags: frontmatter.tags || []
  };
}

// Generate the digest markdown
function generateDigestMarkdown(newsItems, date) {
  const displayDate = formatDateForDisplay(date);
  const slug = `daily-digest-${date}`;

  // Group by category
  const byCategory = {};
  for (const item of newsItems) {
    const cat = item.category || 'General';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);
  }

  // Collect all tags
  const allTags = [...new Set([
    ...CONFIG.defaultTags,
    ...newsItems.flatMap(item => Array.isArray(item.tags) ? item.tags : [])
  ])];

  let markdown = `---
title: "Daily Digest: ${displayDate}"
date: ${date}
tags: [${allTags.map(t => `"${t}"`).join(', ')}]
summary: "AI and technology news digest for ${displayDate}"
---

# Daily Digest: ${displayDate}

Welcome to today's roundup of the most interesting developments in AI and technology.

`;

  for (const [category, items] of Object.entries(byCategory)) {
    markdown += `## ${category}\n\n`;

    for (const item of items) {
      markdown += `### ${item.title}\n\n`;

      if (item.summary) {
        markdown += `${item.summary}\n\n`;
      }

      if (item.url) {
        markdown += `[Read more](${item.url})\n\n`;
      } else if (item.source && item.source.startsWith('http')) {
        markdown += `[Read more](${item.source})\n\n`;
      }

      markdown += '---\n\n';
    }
  }

  markdown += `\n*This digest was automatically generated.*\n`;

  return { markdown, slug };
}

// Generate empty placeholder digest
function generateEmptyDigest(date) {
  const displayDate = formatDateForDisplay(date);
  const slug = `daily-digest-${date}`;

  const markdown = `---
title: "Daily Digest: ${displayDate}"
date: ${date}
tags: ["digest"]
summary: "No news digest available for ${displayDate}"
publish: false
---

# Daily Digest: ${displayDate}

No news items were available for today's digest. Check back tomorrow!
`;

  return { markdown, slug };
}

// Save digest to file
async function saveDigest(markdown, slug, force) {
  const outputPath = path.join(CONFIG.contentOutputPath, `${slug}.md`);

  await fs.mkdir(CONFIG.contentOutputPath, { recursive: true });

  // Check if exists
  try {
    await fs.access(outputPath);
    if (!force) {
      console.log(`Digest already exists: ${outputPath}`);
      console.log('Use --force to overwrite');
      return false;
    }
  } catch {
    // File doesn't exist, proceed
  }

  await fs.writeFile(outputPath, markdown, 'utf-8');
  console.log(`Digest saved: ${outputPath}`);
  return true;
}

// Main
async function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log(`Generating digest for: ${args.date}`);

  const newsItems = await readNewsItems(args.date);

  if (newsItems.length === 0) {
    console.log('No news items found for this date.');

    if (args.allowEmpty) {
      console.log('Creating empty digest placeholder...');
      const { markdown, slug } = generateEmptyDigest(args.date);
      await saveDigest(markdown, slug, args.force);
    }

    return;
  }

  console.log(`Found ${newsItems.length} news items`);

  const { markdown, slug } = generateDigestMarkdown(newsItems, args.date);
  const saved = await saveDigest(markdown, slug, args.force);

  if (saved) {
    console.log('Digest generation complete!');
  }
}

main().catch(err => {
  console.error('Error generating digest:', err);
  process.exit(1);
});
