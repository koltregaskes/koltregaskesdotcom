// scripts/build.mjs
// Builds static site from Obsidian markdown files
import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

// ffmpeg path (full path for Windows compatibility)
const FFMPEG_PATH = process.env.FFMPEG_PATH ||
  "C:\\Users\\kolin\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.0.1-full_build\\bin\\ffmpeg.exe";

// Generate video thumbnail using ffmpeg
async function generateVideoThumbnail(videoPath, outputPath) {
  try {
    // Extract frame at 1 second (or first frame if video is shorter)
    const cmd = `"${FFMPEG_PATH}" -y -i "${videoPath}" -ss 00:00:01 -vframes 1 -vf "scale=640:-1" "${outputPath}"`;
    await execAsync(cmd);
    console.log(`  -> Generated thumbnail: ${path.basename(outputPath)}`);
    return true;
  } catch (error) {
    // Try first frame if 1 second fails
    try {
      const cmd = `"${FFMPEG_PATH}" -y -i "${videoPath}" -vframes 1 -vf "scale=640:-1" "${outputPath}"`;
      await execAsync(cmd);
      console.log(`  -> Generated thumbnail (first frame): ${path.basename(outputPath)}`);
      return true;
    } catch (e) {
      console.warn(`  -> Could not generate thumbnail: ${e.message}`);
      return false;
    }
  }
}

// Generate audio waveform image using ffmpeg
async function generateAudioWaveform(audioPath, outputPath) {
  try {
    // Create waveform visualization
    const cmd = `"${FFMPEG_PATH}" -y -i "${audioPath}" -filter_complex "showwavespic=s=640x200:colors=#4f46e5|#818cf8" -frames:v 1 "${outputPath}"`;
    await execAsync(cmd);
    console.log(`  -> Generated waveform: ${path.basename(outputPath)}`);
    return true;
  } catch (error) {
    console.warn(`  -> Could not generate waveform: ${error.message}`);
    return false;
  }
}

// Content source folder
const CONTENT_DIR = process.env.CONTENT_DIR || "content";

// Supabase configuration (injected at build time from GitHub secrets)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || '';
const SITE_NAME = process.env.SITE_NAME || "Kol's Korner";
const SITE_OWNER = process.env.SITE_OWNER || "Kol Tregaskes";
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'koltregaskes';
const REPO_NAME = process.env.GITHUB_REPO || process.env.REPO_NAME || 'kols-korner';
const ROOT_CNAME = fsSync.existsSync('CNAME') ? fsSync.readFileSync('CNAME', 'utf8').trim() : '';
const CUSTOM_DOMAIN = (process.env.CUSTOM_DOMAIN || '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
const DEPLOY_CNAME = (CUSTOM_DOMAIN || ROOT_CNAME || '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
const LEGACY_REPO_NAMES = ['koltregaskesdotcom', 'notion-site-test'];
const SITE_BASE_PATH = CUSTOM_DOMAIN ? '' : `/${REPO_NAME}`;
const SITE_URL = CUSTOM_DOMAIN
  ? `https://${CUSTOM_DOMAIN}`
  : `https://${GITHUB_OWNER}.github.io${SITE_BASE_PATH}`;
const NAV_ITEMS = [
  { key: 'posts', label: 'Posts', path: 'posts/' },
  { key: 'news', label: 'News', path: 'news/' },
  { key: 'tags', label: 'Tags', path: 'tags/' },
  { key: 'subscribe', label: 'Newsletter', path: 'subscribe/' },
  { key: 'about', label: 'About', path: 'about/' },
  { key: 'contact', label: 'Contact', path: 'contact/' }
];
const CONNECTED_PROJECTS = [
  {
    name: 'AI Resource Hub',
    label: 'Reference',
    description: 'Independent model comparisons, pricing snapshots, and benchmark notes for the tools worth tracking.',
    url: 'https://airesourcehub.com/'
  },
  {
    name: 'Axy Lusion',
    label: 'Creative AI',
    description: 'AI-generated art, motion, music, and visual experiments collected into one portfolio.',
    url: 'https://axylusion.com/'
  },
  {
    name: 'Ghost in the Models',
    label: 'Editorial Lab',
    description: 'A rotating AI publication written by Claude, Gemini, and Codex, focused on systems, workflows, and experiments.',
    url: 'https://koltregaskes.github.io/ghost-in-the-models/'
  },
  {
    name: 'Kol Tregaskes Photography',
    label: 'Photography',
    description: 'A quieter portfolio for still images, field notes, and visual work outside the AI feed cycle.',
    url: 'https://koltregaskesphotography.com/'
  }
];
const PROFILE_LINKS = [
  {
    name: 'X / Twitter',
    shortName: 'X',
    url: 'https://x.com/koltregaskes',
    icon: '<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>'
  },
  {
    name: 'Bluesky',
    shortName: 'Bluesky',
    url: 'https://bsky.app/profile/koltregaskes.bsky.social',
    icon: '<path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z"/>'
  },
  {
    name: 'Threads',
    shortName: 'Threads',
    url: 'https://www.threads.com/@koltregaskes',
    icon: '<path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.332-3.023.88-.73 2.123-1.149 3.503-1.18 1.016-.023 1.97.092 2.862.345-.034-1.466-.383-2.417-1.25-3.058-.707-.521-1.675-.79-2.878-.8h-.015c-1.124.01-2.038.267-2.716.764l-1.085-1.768c1.02-.749 2.326-1.128 3.887-1.128h.02c3.295.02 5.266 1.88 5.482 5.175.125.084.247.172.364.266 1.378 1.103 2.084 2.605 2.042 4.348-.06 2.467-1.217 4.381-3.255 5.381-1.456.714-3.282 1.075-5.434 1.075z"/>'
  },
  {
    name: 'Mastodon',
    shortName: 'Mastodon',
    url: 'https://mastodon.social/@koltregaskes',
    icon: '<path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.668 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z"/>'
  },
  {
    name: 'Instagram',
    shortName: 'Instagram',
    url: 'https://www.instagram.com/koltregaskes/',
    icon: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="none" stroke="currentColor" stroke-width="2"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" stroke-width="2"/>'
  },
  {
    name: 'YouTube',
    shortName: 'YouTube',
    url: 'https://www.youtube.com/koltregaskes',
    icon: '<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>'
  },
  {
    name: 'TikTok',
    shortName: 'TikTok',
    url: 'https://www.tiktok.com/@koltregaskes',
    icon: '<path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>'
  },
  {
    name: 'GitHub',
    shortName: 'GitHub',
    url: 'https://github.com/koltregaskes/',
    icon: '<path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>'
  }
];

function stripKnownBasePath(urlPath = '') {
  const knownBasePaths = [REPO_NAME, ...LEGACY_REPO_NAMES]
    .filter(Boolean)
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');

  if (!knownBasePaths) return urlPath.replace(/^\/+/, '');
  return urlPath.replace(new RegExp(`^\\/(${knownBasePaths})\\/`), '').replace(/^\/+/, '');
}

function getDigestDateKey(filename = '') {
  let match = filename.match(/^(\d{4})-(\d{2})-(\d{2})-digest\.md$/);
  if (!match) {
    match = filename.match(/^digest-(\d{4})-(\d{2})-(\d{2})\.md$/);
  }

  if (!match) return null;

  const [, year, month, day] = match;
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function isDigestPost(item) {
  const title = fixCommonEncoding(item?.title || '');
  const tags = Array.isArray(item?.tags) ? item.tags.map(normaliseTag) : [];
  const slug = String(item?.slug || '');
  const sourceFile = String(item?.sourceFile || '');
  const kind = String(item?.kind || '').toLowerCase();

  return Boolean(
    item?.isDigest ||
    kind === 'digest' ||
    tags.includes('digest') ||
    /^daily-digest-/i.test(sourceFile) ||
    /^daily-digest-/i.test(slug) ||
    /^digest-\d{4}-\d{2}-\d{2}$/i.test(slug) ||
    /^\d{4}-\d{2}-\d{2}$/i.test(slug) ||
    /^daily digest:/i.test(title) ||
    /^ai news digest/i.test(title)
  );
}

function getIsoDateKey(value = '') {
  const match = String(value || '').match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : '';
}

function getDigestSlug({ file = '', date = '', title = '' } = {}) {
  return (
    getIsoDateKey(date) ||
    getIsoDateKey(file) ||
    getIsoDateKey(title) ||
    slugify(title)
  );
}

function normaliseTag(tag = '') {
  return String(tag || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function fixCommonEncoding(text = '') {
  const value = String(text || '');
  if (!value) return '';

  if (/[\u00c3\u00c2\u00e2]/.test(value)) {
    try {
      const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0) & 0xff);
      const repaired = new TextDecoder('utf-8').decode(bytes);
      if (repaired && !repaired.includes('\uFFFD')) {
        return repaired;
      }
    } catch {
      // Fall back to targeted replacements below.
    }
  }

  return value
    .replace(/\u00e2\u20ac\u2122/g, "'")
    .replace(/\u00e2\u20ac\u02dc/g, "'")
    .replace(/\u00e2\u20ac\u0153/g, '"')
    .replace(/\u00e2\u20ac\u009d/g, '"')
    .replace(/\u00e2\u20ac"/g, '-')
    .replace(/\u00e2\u20ac\u201c/g, '-')
    .replace(/\u00e2\u20ac\u00a6/g, '...')
    .replace(/\u00c2/g, '');
}

function normaliseNewsUrl(url = '') {
  try {
    const parsed = new URL(String(url || '').trim());
    parsed.hash = '';
    parsed.searchParams.delete('utm_source');
    parsed.searchParams.delete('utm_medium');
    parsed.searchParams.delete('utm_campaign');
    parsed.searchParams.delete('utm_term');
    parsed.searchParams.delete('utm_content');
    const normalisedPath = parsed.pathname.replace(/\/+$/, '') || '/';
    return `${parsed.origin}${normalisedPath}${parsed.search}`;
  } catch {
    return String(url || '').trim();
  }
}

function formatTagLabel(tag = '') {
  const normalised = normaliseTag(tag);
  const explicitLabels = {
    ai: 'AI',
    'open-source': 'Open source'
  };

  if (explicitLabels[normalised]) {
    return explicitLabels[normalised];
  }

  return normalised
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function getTagEntries(items, newsArticles = []) {
  const ignoredTags = new Set(['digest', 'welcome', 'intro', 'news']);
  const entries = [];
  const seenNewsKeys = new Set();

  const editorialPosts = items
    .filter((item) => (item.kind || 'article').toLowerCase() === 'article' && !isDigestPost(item))
    .sort((a, b) => new Date(b.updatedTime || b.date) - new Date(a.updatedTime || a.date));

  for (const item of editorialPosts) {
    entries.push({
      entryType: 'post',
      title: item.title,
      summary: item.summary || '',
      date: item.updatedTime || item.date,
      href: `../posts/${item.slug}/`,
      hrefAttrs: '',
      meta: `${item.readingTime || 3} min read`,
      imageUrl: item.thumbnailUrl || '',
      tags: Array.from(new Set((item.tags || []).map(normaliseTag))).filter((tag) => tag && !ignoredTags.has(tag))
    });
  }

  for (const article of newsArticles) {
    const newsKey = normaliseNewsUrl(article.url) || normaliseTag(article.title);
    if (newsKey && seenNewsKeys.has(newsKey)) {
      continue;
    }

    if (newsKey) {
      seenNewsKeys.add(newsKey);
    }

    entries.push({
      entryType: 'news',
      title: fixCommonEncoding(article.title),
      summary: fixCommonEncoding(article.summary || ''),
      date: article.date,
      href: normaliseNewsUrl(article.url),
      hrefAttrs: ' target="_blank" rel="noopener"',
      meta: fixCommonEncoding(article.source || 'News story'),
      imageUrl: '',
      tags: Array.from(new Set((article.tags || []).map(normaliseTag))).filter((tag) => tag && !ignoredTags.has(tag))
    });
  }

  entries.sort((a, b) => new Date(b.date) - new Date(a.date));
  return entries;
}

function getTagCollections(items, newsArticles = []) {
  const entries = getTagEntries(items, newsArticles);
  const tagMap = new Map();
  const preferredTagOrder = [
    'ai',
    'models',
    'agents',
    'product',
    'enterprise',
    'infrastructure',
    'research',
    'safety',
    'regulation',
    'robotics',
    'vision',
    'coding',
    'healthcare',
    'funding',
    'startups',
    'open-source'
  ];

  for (const entry of entries) {
    for (const tag of entry.tags) {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, []);
      }
      tagMap.get(tag).push(entry);
    }
  }

  return Array.from(tagMap.entries())
    .map(([tag, tagEntries]) => ({
      tag,
      label: formatTagLabel(tag),
      count: tagEntries.length,
      entries: tagEntries
    }))
    .filter(({ tag, count }) => count >= 2 || preferredTagOrder.includes(tag))
    .sort((a, b) => {
      const orderA = preferredTagOrder.indexOf(a.tag);
      const orderB = preferredTagOrder.indexOf(b.tag);
      const hasOrderA = orderA !== -1;
      const hasOrderB = orderB !== -1;

      if (hasOrderA && hasOrderB && orderA !== orderB) {
        return orderA - orderB;
      }

      if (hasOrderA !== hasOrderB) {
        return hasOrderA ? -1 : 1;
      }

      if (b.count !== a.count) return b.count - a.count;
      return a.label.localeCompare(b.label);
    })
    .slice(0, 12);
}

function isJunkDigestItem(title = '', url = '') {
  const junkTitles = [
    'Browse Business',
    'Browse Sustainability',
    'Sponsored Content',
    'View All Latest',
    'Momentum AI',
    'Final 2 days to save up to $500 on your TechCrunch Disrupt 2026 ticket'
  ];

  const junkUrlPatterns = [
    /\/business\/?$/i,
    /\/sustainability\/?$/i,
    /\/sponsored\/?$/i,
    /events\.reutersevents\.com/i,
    /artificial-intelligence-news\/?$/i,
    /techcrunch\.com\/\d{4}\/\d{2}\/\d{2}\/.*disrupt.*ticket/i
  ];

  if (junkTitles.some((junkTitle) => title.includes(junkTitle))) return true;
  if (junkUrlPatterns.some((pattern) => pattern.test(url))) return true;

  return false;
}

function extractDigestSource(url = '') {
  if (!url) return 'Unknown';

  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const sourceMap = {
      'techcrunch.com': 'TechCrunch',
      'theinformation.com': 'The Information',
      'reuters.com': 'Reuters',
      'wsj.com': 'Wall Street Journal',
      'bloomberg.com': 'Bloomberg',
      'theguardian.com': 'The Guardian',
      'nytimes.com': 'New York Times',
      'bbc.com': 'BBC',
      'bbc.co.uk': 'BBC',
      'nature.com': 'Nature',
      'mit.edu': 'MIT News',
      'stanford.edu': 'Stanford HAI',
      'wired.com': 'Wired',
      'economist.com': 'The Economist',
      'ft.com': 'Financial Times',
      'theatlantic.com': 'The Atlantic',
      'technologyreview.com': 'MIT Technology Review',
      'hbr.org': 'Harvard Business Review',
      'newscientist.com': 'New Scientist',
      'arstechnica.com': 'Ars Technica',
      'theverge.com': 'The Verge',
      'venturebeat.com': 'VentureBeat',
      'anthropic.com': 'Anthropic',
      'openai.com': 'OpenAI',
      'deepmind.com': 'DeepMind'
    };

    for (const [domain, name] of Object.entries(sourceMap)) {
      if (hostname.includes(domain)) return name;
    }

    return hostname.replace('www.', '').split('.')[0];
  } catch {
    return 'Unknown';
  }
}

function generateDigestTags(title = '') {
  const tagPatterns = {
    agents: /\b(agent|agents|agentic)\b/i,
    models: /\b(gpt|claude|gemini|llama|mistral|model|llm|foundation)\b/i,
    research: /\b(research|paper|study|breakthrough|discover)\b/i,
    funding: /\b(raises|funding|invest|valuation|series [a-c]|million|billion|\$\d+[mb])\b/i,
    product: /\b(launch|release|announce|feature|update|new|beta)\b/i,
    enterprise: /\b(enterprise|business|company|corporate|b2b)\b/i,
    'open-source': /\b(open source|open-source|opensource|github|hugging face)\b/i,
    safety: /\b(safety|alignment|ethics|regulation|govern|policy)\b/i,
    robotics: /\b(robot|robotics|hardware|humanoid|physical)\b/i,
    vision: /\b(image|video|vision|multimodal|visual)\b/i,
    voice: /\b(voice|speech|audio|sound|music)\b/i,
    coding: /\b(code|coding|developer|programming|github copilot)\b/i,
    healthcare: /\b(health|medical|doctor|patient|diagnos)\b/i,
    regulation: /\b(law|lawsuit|legal|court|regulation|regulator|policy)\b/i,
    infrastructure: /\b(compute|gpu|data center|datacentre|infrastructure|chip|chips|semiconductor)\b/i,
    startups: /\b(startup|startups|founder|venture)\b/i
  };

  const tags = ['ai'];
  for (const [tag, pattern] of Object.entries(tagPatterns)) {
    if (pattern.test(title)) tags.push(tag);
  }

  const uniqueTags = Array.from(new Set(tags));
  if (uniqueTags.length === 1) uniqueTags.push('news');
  return uniqueTags.slice(0, 5);
}

async function getImageDimensions(filePath) {
  const buffer = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.png' && buffer.length >= 24 && buffer.toString('ascii', 1, 4) === 'PNG') {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20)
    };
  }

  if (ext === '.gif' && buffer.length >= 10 && buffer.toString('ascii', 0, 3) === 'GIF') {
    return {
      width: buffer.readUInt16LE(6),
      height: buffer.readUInt16LE(8)
    };
  }

  if ((ext === '.jpg' || ext === '.jpeg') && buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;

    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }

      const marker = buffer[offset + 1];
      const segmentLength = buffer.readUInt16BE(offset + 2);

      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return {
          width: buffer.readUInt16BE(offset + 7),
          height: buffer.readUInt16BE(offset + 5)
        };
      }

      if (segmentLength < 2) break;
      offset += 2 + segmentLength;
    }
  }

  if (ext === '.webp' && buffer.length >= 30 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    const chunkType = buffer.toString('ascii', 12, 16);

    if (chunkType === 'VP8X') {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3)
      };
    }

    if (chunkType === 'VP8 ' && buffer.length >= 30) {
      return {
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff
      };
    }

    if (chunkType === 'VP8L' && buffer.length >= 25) {
      const bits = buffer.readUInt32LE(21);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1
      };
    }
  }

  return null;
}

function resolveAssetPath(assetPath = '', basePath = '.') {
  if (!assetPath) return assetPath;
  if (/^(?:https?:|data:|blob:)/i.test(assetPath)) return assetPath;

  const cleanedPath = assetPath.replace(/^\.?\//, '');
  if (!basePath || basePath === '.') {
    return `./${cleanedPath}`;
  }

  return `${basePath.replace(/\/$/, '')}/${cleanedPath}`;
}

function renderThumbnailImage(item, title, basePath = '.') {
  const attributes = [
    `src="${escapeHtml(resolveAssetPath(item.thumbnailUrl, basePath))}"`,
    `alt="${title}"`,
    'loading="lazy"',
    'decoding="async"'
  ];

  if (item.thumbnailWidth && item.thumbnailHeight) {
    attributes.push(`width="${item.thumbnailWidth}"`, `height="${item.thumbnailHeight}"`);
  }

  return `<img ${attributes.join(' ')} />`;
}

async function prepareNewsArchiveData() {
  const newsDigestsDir = path.join(process.cwd(), 'news-digests');
  const digestCandidates = await fs.readdir(newsDigestsDir);
  const digestMap = new Map();

  for (const file of digestCandidates) {
    const dateKey = getDigestDateKey(file);
    if (!dateKey) continue;

    const canonicalFile = `${dateKey}-digest.md`;
    const existing = digestMap.get(dateKey);

    if (!existing || file === canonicalFile) {
      digestMap.set(dateKey, {
        sourceFile: file,
        outputFile: canonicalFile
      });
    }
  }

  const digestFiles = Array.from(digestMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([, entry]) => entry);
  const newsArticles = [];

  for (const digestFile of digestFiles) {
    const sourcePath = path.join(newsDigestsDir, digestFile.sourceFile);
    const digestContent = await fs.readFile(sourcePath, 'utf8');
    newsArticles.push(...parseDigestArticles(digestContent, digestFile.outputFile));
  }

  newsArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
  return { digestFiles, newsArticles };
}

function parseDigestArticles(content, filename) {
  const dateMatch = filename.match(/(\d{4})-(\d{2})-(\d{2})-digest\.md/);
  if (!dateMatch) return [];

  const [, year, month, day] = dateMatch;
  const fileDate = new Date(Number(year), Number(month) - 1, Number(day));
  const fallbackDateString = formatDisplayDate(fileDate);
  const articles = [];
  const lines = content.split('\n');
  let articleCountInDigest = 0;
  const topStoriesLimit = 5;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (/^##\s+(.+)$/.test(line)) {
      continue;
    }

    const itemMatch = line.match(/^-\s+\*\*(.+?)\*\*\s+\(\[(.+?)\]\((.+?)\)\)(?:\s+_(.+?)_)?$/);
    if (!itemMatch) continue;

    const [, rawTitle, rawSourceName, url, itemDate] = itemMatch;
    const title = fixCommonEncoding(rawTitle).trim();
    const sourceName = fixCommonEncoding(rawSourceName).trim();

    if (isJunkDigestItem(title, url)) {
      continue;
    }

    articleCountInDigest += 1;

    let summary = '';
    let nextLineIndex = i + 1;
    while (nextLineIndex < lines.length && /^\s{2,}/.test(lines[nextLineIndex])) {
      summary += `${fixCommonEncoding(lines[nextLineIndex].trim())} `;
      nextLineIndex += 1;
    }

    let articleDate = fileDate;
    let dateString = fallbackDateString;

    if (itemDate && itemDate.trim()) {
      const parsedDate = new Date(itemDate.trim());
      if (!Number.isNaN(parsedDate.getTime())) {
        articleDate = parsedDate;
        dateString = formatDisplayDate(parsedDate);
      }
    }

    articles.push({
      title,
      source: sourceName || extractDigestSource(url),
      url: url.trim(),
      summary: summary.trim(),
      category: articleCountInDigest <= topStoriesLimit ? 'Top Stories' : 'News',
      date: articleDate.toISOString(),
      dateString,
      filename,
      tags: generateDigestTags(title),
      time: dateString,
      imageUrl: null,
      isNoNews: false
    });

    i = nextLineIndex - 1;
  }

  return articles;
}

// Security headers for all pages
const getSecurityHeaders = () => `
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' https: data: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self'${SUPABASE_URL ? ` ${SUPABASE_URL}` : ''}; media-src 'self' https: blob:; object-src 'none'; base-uri 'self'; form-action 'self';">
  <meta name="referrer" content="strict-origin-when-cross-origin">`;

function getSharedHeadAssets(basePath) {
  return `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fira+Sans:wght@300;400;500;600;700&display=swap">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap">
  <link rel="icon" type="image/svg+xml" href="${basePath}/favicon.svg" />
  <link rel="stylesheet" href="${basePath}/styles.css" />`;
}

const slugify = (s) =>
  (s || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "untitled";

// Deterministic colour index (1-8) for a tag name
function tagColorIndex(tag) {
  let hash = 0;
  for (const ch of tag) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  return (Math.abs(hash) % 8) + 1;
}

// IntersectionObserver script for fade-in-up entrance animations
function getAnimationScript() {
  return `
    // Entrance animations
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            fadeObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -40px 0px', threshold: 0.1 });
      document.querySelectorAll('.fade-in-up').forEach(el => fadeObserver.observe(el));

      // Ensure below-the-fold sections never stay hidden if the observer misses them.
      window.setTimeout(() => {
        document.querySelectorAll('.fade-in-up:not(.is-visible)').forEach((el) => {
          el.classList.add('is-visible');
        });
      }, 900);
    }`;
}

function getSiteChromeScript({ animations = false } = {}) {
  return `
    const html = document.documentElement;
    const siteHeader = document.querySelector('.site-header');
    const navToggle = document.querySelector('.site-nav-toggle');
    const navLinks = document.getElementById('site-nav-links');

    html.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark');
    try {
      localStorage.removeItem('theme');
    } catch (error) {
      // Ignore storage access errors and keep the page in dark mode.
    }

    if (siteHeader && navToggle && navLinks) {
      const setNavOpen = (isOpen) => {
        siteHeader.dataset.navOpen = isOpen ? 'true' : 'false';
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      };

      navToggle.addEventListener('click', () => {
        const isOpen = siteHeader.dataset.navOpen === 'true';
        setNavOpen(!isOpen);
      });

      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => setNavOpen(false));
      });

      document.addEventListener('click', (event) => {
        if (siteHeader.dataset.navOpen !== 'true') return;
        if (siteHeader.contains(event.target)) return;
        setNavOpen(false);
      });

      const desktopQuery = window.matchMedia('(min-width: 769px)');
      const resetNav = (event) => {
        if (event.matches) {
          setNavOpen(false);
        }
      };

      if (desktopQuery.addEventListener) {
        desktopQuery.addEventListener('change', resetNav);
      } else if (desktopQuery.addListener) {
        desktopQuery.addListener(resetNav);
      }
    }

    ${animations ? getAnimationScript() : ''}
  `;
}

function escapeHtml(s) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Parse YAML frontmatter from markdown
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const yamlStr = match[1];
  const body = match[2];
  const frontmatter = {};

  // Simple YAML parser for common fields
  for (const line of yamlStr.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Handle arrays like [tag1, tag2]
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    }
    // Handle booleans
    else if (value === 'true') value = true;
    else if (value === 'false') value = false;
    // Handle quoted strings
    else if ((value.startsWith('"') && value.endsWith('"')) ||
             (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    frontmatter[key] = value;
  }

  return { frontmatter, body };
}

// Convert markdown to HTML (improved implementation)
function markdownToHtml(md) {
  let html = md;

  // Step 1: Extract and protect code blocks first (before any other processing)
  const codeBlocks = [];
  html = html.replace(/```(\w*)\r?\n([\s\S]*?)```/g, (match, lang, code) => {
    const placeholder = `CODEBLOCKPLACEHOLDER${codeBlocks.length}ENDCODEBLOCK`;
    codeBlocks.push(`<pre><code data-lang="${escapeHtml(lang)}">${escapeHtml(code.trim())}</code></pre>`);
    return placeholder;
  });

  // Step 2: Extract and process tables
  const tableRegex = /^\|(.+)\|\r?\n\|[-:\| ]+\|\r?\n((?:\|.+\|\r?\n?)+)/gm;
  html = html.replace(tableRegex, (match, headerRow, bodyRows) => {
    const headers = headerRow.split('|').map(h => h.trim()).filter(h => h);
    const rows = bodyRows.trim().split('\n').map(row =>
      row.split('|').map(cell => cell.trim()).filter(cell => cell)
    );

    let table = '<table>\n<thead>\n<tr>';
    headers.forEach(h => { table += `<th>${h}</th>`; });
    table += '</tr>\n</thead>\n<tbody>\n';
    rows.forEach(row => {
      table += '<tr>';
      row.forEach(cell => { table += `<td>${cell}</td>`; });
      table += '</tr>\n';
    });
    table += '</tbody>\n</table>';
    return table;
  });

  // Step 3: Process block-level elements

  // Headings (process before inline formatting)
  html = html.replace(/^### (.+)$/gm, (match, text) => {
    return `<h4 id="${slugify(text)}">${text}</h4>`;
  });
  html = html.replace(/^## (.+)$/gm, (match, text) => {
    return `<h3 id="${slugify(text)}">${text}</h3>`;
  });
  html = html.replace(/^# (.+)$/gm, (match, text) => {
    return `<h2 id="${slugify(text)}">${text}</h2>`;
  });

  // Callouts (must come before regular blockquotes)
  html = html.replace(/^> \[!(NOTE|TIP|WARNING|IMPORTANT)\]([^\n]*)\n((?:^>.*\n?)*)/gm, (match, type, title, content) => {
    const calloutType = type.toLowerCase();
    const displayTitle = title.trim() || type.charAt(0) + type.slice(1).toLowerCase();
    const cleanContent = content.split('\n').map(l => l.replace(/^>\s?/, '')).join('\n').trim();
    return `<div class="callout callout-${calloutType}"><div class="callout-title">${displayTitle}</div><div class="callout-content">${cleanContent}</div></div>`;
  });

  // Regular blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr />');
  html = html.replace(/^\*\*\*$/gm, '<hr />');

  // Step 4: Process lists
  // Process unordered lists
  const lines = html.split('\n');
  const processedLines = [];
  let inUl = false;
  let inOl = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for unordered list item
    const ulMatch = trimmed.match(/^[\-\*] (.+)$/);
    // Check for ordered list item
    const olMatch = trimmed.match(/^\d+\. (.+)$/);

    if (ulMatch) {
      if (inOl) { processedLines.push('</ol>'); inOl = false; }
      if (!inUl) { processedLines.push('<ul>'); inUl = true; }
      processedLines.push(`<li>${ulMatch[1]}</li>`);
    } else if (olMatch) {
      if (inUl) { processedLines.push('</ul>'); inUl = false; }
      if (!inOl) { processedLines.push('<ol>'); inOl = true; }
      processedLines.push(`<li>${olMatch[1]}</li>`);
    } else {
      if (inUl) { processedLines.push('</ul>'); inUl = false; }
      if (inOl) { processedLines.push('</ol>'); inOl = false; }
      processedLines.push(line);
    }
  }
  if (inUl) processedLines.push('</ul>');
  if (inOl) processedLines.push('</ol>');

  html = processedLines.join('\n');

  // Step 5: Process inline formatting

  // Images (before links to avoid conflict)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<figure><img src="$2" alt="$1" loading="lazy" /></figure>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Bold and italic (order matters: longest patterns first)
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Inline code (after bold/italic to avoid conflicts)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Highlighting
  html = html.replace(/==(.+?)==/g, '<mark>$1</mark>');

  // Wikilinks [[note]] or [[note|display text]]
  html = html.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, noteName, displayText) => {
    const slug = noteName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '').replace(/--+/g, '-');
    const linkText = displayText?.trim() || noteName.trim();
    return `<a href="../${slug}/" class="wikilink">${linkText}</a>`;
  });

  // Step 6: Wrap remaining lines in paragraphs
  const finalLines = html.split('\n');
  const wrapped = [];

  for (let line of finalLines) {
    const trimmed = line.trim();
    if (!trimmed) {
      wrapped.push('');
      continue;
    }
    // Skip lines that are already HTML elements or code block placeholders
    if (trimmed.startsWith('<') || trimmed.startsWith('CODEBLOCKPLACEHOLDER')) {
      wrapped.push(line);
      continue;
    }
    wrapped.push(`<p>${line}</p>`);
  }

  html = wrapped.join('\n');

  // Step 7: Restore code blocks
  codeBlocks.forEach((block, i) => {
    html = html.replace(`CODEBLOCKPLACEHOLDER${i}ENDCODEBLOCK`, block);
    html = html.replace(`<p>CODEBLOCKPLACEHOLDER${i}ENDCODEBLOCK</p>`, block);
  });

  // Clean up
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>(<h[234])/g, '$1');
  html = html.replace(/(<\/h[234]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<table)/g, '$1');
  html = html.replace(/(<\/table>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul|<ol|<\/ul|<\/ol|<li|<\/li|<hr|<blockquote|<\/blockquote|<figure|<pre)/g, '$1');

  return html;
}

// Extract headings for TOC
function extractHeadings(html) {
  const headings = [];
  const regex = /<h([234]) id="([^"]+)">(.+?)<\/h\1>/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      id: match[2],
      text: match[3].replace(/<[^>]+>/g, '')
    });
  }

  return headings;
}

function generateTOC(headings) {
  if (headings.length === 0) return "";

  return `
    <nav class="toc">
      <h4>Contents</h4>
      <ul>
        ${headings.map(h => `<li class="toc-${h.level}"><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`).join("")}
      </ul>
    </nav>
  `;
}

function stripLeadingArticleHeading(html = '', title = '') {
  const headingId = slugify(title);
  if (!headingId) return html;

  return String(html || '').replace(
    new RegExp(`^\\s*<h2 id="${headingId}">[\\s\\S]*?<\\/h2>\\s*`, 'i'),
    ''
  );
}

function stripMarkdownFormatting(text = '') {
  return fixCommonEncoding(String(text || ''))
    .replace(/^>\s*/gm, '')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/___(.+?)___/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function isSubstantiveDigestText(text = '') {
  const clean = stripMarkdownFormatting(text)
    .replace(/^\*?this digest was automatically generated\.?\*?$/i, '')
    .trim();
  if (!clean) return false;
  if (/^read more$/i.test(clean)) return false;
  if (/^update\b/i.test(clean) && clean.split(/\s+/).length < 4) return false;
  return clean.split(/\s+/).length >= 4 || clean.length >= 32;
}

function parseDigestMarkdown(body = '') {
  const sections = [];
  const lines = String(body || '').split('\n');
  let introLines = [];
  let currentSection = null;
  let currentItem = null;

  const finishItem = () => {
    if (!currentItem || !currentSection) {
      currentItem = null;
      return;
    }

    const summary = stripMarkdownFormatting(currentItem.summaryLines.join(' '));
    if (currentItem.title && (summary || currentItem.url)) {
      currentSection.items.push({
        title: currentItem.title,
        summary,
        url: currentItem.url,
        source: currentItem.url ? extractDigestSource(currentItem.url) : ''
      });
    }

    currentItem = null;
  };

  const finishSection = () => {
    if (!currentSection) return;
    finishItem();

    currentSection.intro = stripMarkdownFormatting(currentSection.introLines.join(' '));
    delete currentSection.introLines;

    currentSection.items = currentSection.items.filter(
      (item) => item.title && isSubstantiveDigestText(item.summary) && !isJunkDigestItem(item.title, item.url)
    );

    if (currentSection.intro || currentSection.items.length) {
      sections.push(currentSection);
    }

    currentSection = null;
  };

  for (const rawLine of lines) {
    const line = fixCommonEncoding(rawLine || '');
    const trimmed = line.trim();

    if (!trimmed) continue;
    if (/^\*This digest was automatically generated\.?\*$/i.test(trimmed)) continue;
    if (/^#\s+/.test(trimmed)) continue;

    const sectionMatch = trimmed.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      finishSection();
      currentSection = {
        title: stripMarkdownFormatting(sectionMatch[1]),
        introLines: [],
        items: []
      };
      continue;
    }

    const itemMatch = trimmed.match(/^###\s+(.+)$/);
    if (itemMatch) {
      if (!currentSection) {
        currentSection = {
          title: 'Highlights',
          introLines: [],
          items: []
        };
      }
      finishItem();
      currentItem = {
        title: stripMarkdownFormatting(itemMatch[1]),
        summaryLines: [],
        url: ''
      };
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      finishItem();
      continue;
    }

    const readMoreMatch = trimmed.match(/^\[Read more\]\((.+?)\)$/i);
    if (readMoreMatch) {
      if (currentItem) {
        currentItem.url = normaliseNewsUrl(readMoreMatch[1]);
      }
      continue;
    }

    if (!currentSection) {
      introLines.push(trimmed);
      continue;
    }

    if (currentItem) {
      currentItem.summaryLines.push(trimmed);
    } else {
      currentSection.introLines.push(trimmed);
    }
  }

  finishSection();

  return {
    intro: stripMarkdownFormatting(introLines.join(' ')),
    sections
  };
}

// Reusable header/navigation HTML (blog-only navigation)
function getHeaderHTML(basePath = '/', activePage = '') {
  return `
  <header class="site-header">
    <div class="header-content">
      <a href="${basePath}" class="site-logo">
        <span class="logo-icon">K</span>
        <span class="logo-text">${SITE_NAME}</span>
      </a>
      <div class="site-header-actions">
        <button class="site-nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav-links" aria-label="Toggle navigation">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
      <nav class="site-nav" id="site-nav-links">
        ${NAV_ITEMS.map((item) => `<a href="${basePath}${item.path}"${item.key === activePage ? ' class="active"' : ''}>${item.label}</a>`).join('\n        ')}
      </nav>
    </div>
  </header>`;
}

// Reusable footer HTML
function getFooterHTML() {
  return `
  <footer class="site-footer">
    <div class="footer-content">
      <p>&copy; 2026 ${SITE_OWNER}. All rights reserved.</p>
    </div>
    <div class="footer-social">
      <a href="https://x.com/koltregaskes" aria-label="X (Twitter)" target="_blank" rel="noopener">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </a>
      <a href="https://bsky.app/profile/koltregaskes.bsky.social" aria-label="Bluesky" target="_blank" rel="noopener">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z"/>
        </svg>
      </a>
      <a href="https://www.threads.com/@koltregaskes" aria-label="Threads" target="_blank" rel="noopener">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.332-3.023.88-.73 2.123-1.149 3.503-1.18 1.016-.023 1.97.092 2.862.345-.034-1.466-.383-2.417-1.25-3.058-.707-.521-1.675-.79-2.878-.8h-.015c-1.124.01-2.038.267-2.716.764l-1.085-1.768c1.02-.749 2.326-1.128 3.887-1.128h.02c3.295.02 5.266 1.88 5.482 5.175.125.084.247.172.364.266 1.378 1.103 2.084 2.605 2.042 4.348-.06 2.467-1.217 4.381-3.255 5.381-1.456.714-3.282 1.075-5.434 1.075z"/>
        </svg>
      </a>
      <a href="https://mastodon.social/@koltregaskes" aria-label="Mastodon" target="_blank" rel="noopener me">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.668 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z"/>
        </svg>
      </a>
      <a href="https://www.instagram.com/koltregaskes/" aria-label="Instagram" target="_blank" rel="noopener">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
        </svg>
      </a>
      <a href="https://www.youtube.com/koltregaskes" aria-label="YouTube" target="_blank" rel="noopener">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      </a>
      <a href="https://www.tiktok.com/@koltregaskes" aria-label="TikTok" target="_blank" rel="noopener">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      </a>
      <a href="https://github.com/koltregaskes" aria-label="GitHub" target="_blank" rel="noopener">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
      </a>
    </div>
  </footer>`;
}

// Copy media files to site folder and generate thumbnails
async function copyMedia(srcPath, title, kind = 'image') {
  if (!srcPath) return { mediaUrl: '', thumbnailUrl: '', mediaMeta: null, thumbnailMeta: null };

  try {
    const filename = path.basename(srcPath);
    const hash = crypto.createHash('md5').update(srcPath).digest('hex').slice(0, 8);
    const ext = path.extname(filename).toLowerCase();
    const newFilename = `${slugify(title)}${ext}`;
    const destDir = path.join('site', 'media');
    const destPath = path.join(destDir, newFilename);

    await fs.mkdir(destDir, { recursive: true });

    // Copy file
    await fs.copyFile(srcPath, destPath);
    console.log(`  -> Copied: ${newFilename}`);

    const mediaUrl = `./media/${newFilename}`;
    let thumbnailUrl = '';
    let mediaMeta = null;
    let thumbnailMeta = null;

    // Generate thumbnails for video/audio
    if (kind === 'video' && ['.mp4', '.webm', '.mov'].includes(ext)) {
      const thumbFilename = `${slugify(title)}-thumb.jpg`;
      const thumbPath = path.join(destDir, thumbFilename);
      const success = await generateVideoThumbnail(destPath, thumbPath);
      if (success) {
        thumbnailUrl = `./media/${thumbFilename}`;
        thumbnailMeta = await getImageDimensions(thumbPath);
      }
    } else if (kind === 'music' && ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) {
      const waveFilename = `${slugify(title)}-waveform.png`;
      const wavePath = path.join(destDir, waveFilename);
      const success = await generateAudioWaveform(destPath, wavePath);
      if (success) {
        thumbnailUrl = `./media/${waveFilename}`;
        thumbnailMeta = await getImageDimensions(wavePath);
      }
    } else if (kind === 'image') {
      thumbnailUrl = mediaUrl; // Images are their own thumbnails
      mediaMeta = await getImageDimensions(destPath);
      thumbnailMeta = mediaMeta;
    }

    return { mediaUrl, thumbnailUrl, mediaMeta, thumbnailMeta };
  } catch (error) {
    console.warn(`  -> Error copying media:`, error.message);
    return { mediaUrl: '', thumbnailUrl: '', mediaMeta: null, thumbnailMeta: null };
  }
}

// Read all content files
async function readContentFiles() {
  const items = [];

  try {
    const files = await fs.readdir(CONTENT_DIR, { recursive: true });

    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      // Skip CLAUDE.md files and pages/ folder (static pages handled separately)
      if (file.toUpperCase().includes('CLAUDE.MD')) continue;
      if (file.startsWith('pages/') || file.startsWith('pages\\')) continue;
      if (file.startsWith('templates/') || file.startsWith('templates\\')) continue;

      const filePath = path.join(CONTENT_DIR, file);
      const content = await fs.readFile(filePath, 'utf8');
      const { frontmatter, body } = parseFrontmatter(content);

      // Skip unpublished items
      if (frontmatter.publish === false) continue;

      const title = fixCommonEncoding(frontmatter.title || path.basename(file, '.md'));
      const kind = (frontmatter.kind || 'article').toLowerCase();
      const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
      const isDigest = isDigestPost({ title, tags, kind, sourceFile: file, date: frontmatter.date });
      const legacySlug = slugify(title);
      const slug = isDigest ? getDigestSlug({ file, date: frontmatter.date, title }) : legacySlug;

      console.log(`Processing: ${title} (${kind})`);

      // Handle media files
      let thumbnailUrl = '';
      let mediaUrl = '';
      let thumbnailMeta = null;

      // For images, use the image frontmatter
      if (frontmatter.image) {
        const imagePath = path.join(CONTENT_DIR, frontmatter.image);
        const result = await copyMedia(imagePath, title, 'image');
        thumbnailUrl = result.thumbnailUrl;
        mediaUrl = result.mediaUrl;
        thumbnailMeta = result.thumbnailMeta;
      }

      // For videos/music, use the url frontmatter
      if (frontmatter.url && (kind === 'video' || kind === 'music')) {
        // Check if it's already an absolute URL path (starts with /)
        if (frontmatter.url.startsWith('/')) {
          // It's an existing deployed path - check if file exists and generate thumbnail
          const existingPath = path.join('site', stripKnownBasePath(frontmatter.url));
          try {
            await fs.access(existingPath);
            mediaUrl = frontmatter.url;
            // Generate thumbnail from existing file
            const destDir = path.join('site', 'media');
            if (kind === 'video') {
              const thumbFilename = `${slugify(title)}-thumb.jpg`;
              const thumbPath = path.join(destDir, thumbFilename);
              const success = await generateVideoThumbnail(existingPath, thumbPath);
              if (success) {
                thumbnailUrl = `./media/${thumbFilename}`;
                thumbnailMeta = await getImageDimensions(thumbPath);
              }
            } else if (kind === 'music') {
              const waveFilename = `${slugify(title)}-waveform.png`;
              const wavePath = path.join(destDir, waveFilename);
              const success = await generateAudioWaveform(existingPath, wavePath);
              if (success) {
                thumbnailUrl = `./media/${waveFilename}`;
                thumbnailMeta = await getImageDimensions(wavePath);
              }
            }
          } catch {
            console.warn(`  -> Media file not found: ${existingPath}`);
          }
        } else {
          // It's a relative path - copy the file
          const mediaPath = path.join(CONTENT_DIR, frontmatter.url);
          const result = await copyMedia(mediaPath, title, kind);
          mediaUrl = result.mediaUrl;
          thumbnailUrl = result.thumbnailUrl || thumbnailUrl;
          thumbnailMeta = result.thumbnailMeta || thumbnailMeta;
        }
      }

      // Convert markdown to HTML for articles
      let contentHtml = '';
      let headings = [];
      let readingTime = 1;

      if (kind === 'article' || isDigest) {
        contentHtml = markdownToHtml(body);
        contentHtml = stripLeadingArticleHeading(contentHtml, title);
        headings = extractHeadings(contentHtml);

        // Calculate reading time
        const wordCount = body.split(/\s+/).filter(w => w.length > 0).length;
        readingTime = Math.max(1, Math.ceil(wordCount / 200));
      }

      items.push({
        title,
        slug,
        legacySlug,
        kind,
        isDigest,
        sourceFile: file,
        summary: fixCommonEncoding(frontmatter.summary || ''),
        tags,
        thumbnailUrl,
        thumbnailWidth: thumbnailMeta?.width || null,
        thumbnailHeight: thumbnailMeta?.height || null,
        driveUrl: mediaUrl || thumbnailUrl,
        contentHtml,
        bodyMarkdown: body,
        headings,
        readingTime,
        date: frontmatter.date || new Date().toISOString().split('T')[0],
        updatedTime: frontmatter.date || new Date().toISOString()
      });
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`Content directory "${CONTENT_DIR}" not found. Creating sample content...`);
      await createSampleContent();
      return readContentFiles();
    }
    throw error;
  }

  return items;
}

// Create sample content folder and files
async function createSampleContent() {
  await fs.mkdir(CONTENT_DIR, { recursive: true });

  const samplePost = `---
title: Welcome to Kol's Korner
kind: article
date: 2026-01-01
tags: [welcome, intro]
summary: Welcome to my new site! Here I'll share thoughts on tech, AI, and development.
publish: true
---

# Welcome

Hello and welcome to my new site!

## What to Expect

I'll be sharing:

- **Tech insights** - Latest developments in software
- **AI explorations** - Experiments and discoveries
- **Development tips** - Things I've learned along the way

## Stay Tuned

More content coming soon. Feel free to explore and check back regularly!

---

*Thanks for visiting!*
`;

  await fs.writeFile(path.join(CONTENT_DIR, 'welcome.md'), samplePost, 'utf8');
  console.log('Created sample content file: welcome.md');
}

async function writeArticlePage({
  title,
  slug,
  summary,
  contentHtml,
  tags,
  date,
  headings,
  readingTime,
  thumbnailUrl,
  thumbnailWidth,
  thumbnailHeight,
  previousPost,
  nextPost
}) {
  const outDir = path.join("site", "posts", slug);
  await fs.mkdir(outDir, { recursive: true });

  const toc = generateTOC(headings);
  const tagsHtml = tags.length ? `<div class="post-tags">${tags.map(t => `<a href="../../tags/#${slugify(t)}" class="tag" data-color="${tagColorIndex(t)}">${escapeHtml(t)}</a>`).join("")}</div>` : "";
  const description = escapeHtml(summary || contentHtml.replace(/<[^>]*>/g, '').slice(0, 160));
  const heroImage = thumbnailUrl && thumbnailUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    ? `<figure class="post-hero-media">
        ${renderThumbnailImage({
          thumbnailUrl,
          thumbnailWidth,
          thumbnailHeight
        }, escapeHtml(title), '../..')}
      </figure>`
    : '';
  const pagerHtml = previousPost || nextPost
    ? `<nav class="post-pagination" aria-label="Article navigation">
        ${nextPost ? `
        <a href="../${nextPost.slug}/" class="post-pagination-card">
          <span class="post-pagination-label">Newer post</span>
          <strong class="post-pagination-title">${escapeHtml(nextPost.title)}</strong>
        </a>` : '<span class="post-pagination-spacer" aria-hidden="true"></span>'}
        ${previousPost ? `
        <a href="../${previousPost.slug}/" class="post-pagination-card">
          <span class="post-pagination-label">Older post</span>
          <strong class="post-pagination-title">${escapeHtml(previousPost.title)}</strong>
        </a>` : '<span class="post-pagination-spacer" aria-hidden="true"></span>'}
      </nav>`
    : '';

  const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${getSecurityHeaders()}
  <title>${escapeHtml(title)} - ${SITE_NAME}</title>
  <meta name="description" content="${description}${description.length >= 160 ? '…' : ''}" />
  <meta name="author" content="${SITE_OWNER}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${description}${description.length >= 160 ? '…' : ''}" />
  <meta property="og:type" content="article" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:creator" content="@koltregaskes" />
  ${getSharedHeadAssets('../../')}
</head>
<body>
  ${getHeaderHTML('../../', 'posts')}

  <div class="page-container">
    ${toc ? `<aside class="sidebar">
      <div class="toc-wrapper">
        ${toc}
      </div>
    </aside>` : ""}

    <main class="post-main">
      <article class="post">
        <header class="post-header">
          <h1 class="post-title">${escapeHtml(title)}</h1>
          <div class="post-meta">
          <span class="post-author">${SITE_OWNER}</span>
            <span class="meta-sep">&bull;</span>
            <time class="post-date">${date ? new Date(date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }) : ""}</time>
            <span class="meta-sep">&bull;</span>
            <span class="reading-time">${readingTime} min read</span>
          </div>
          ${summary ? `<p class="post-summary">${escapeHtml(summary)}</p>` : ''}
          ${heroImage}
        </header>
        <div class="post-content">
          ${contentHtml}
        </div>
        ${tagsHtml}
        ${pagerHtml}
      </article>
    </main>
  </div>

  ${getFooterHTML()}

  <script>
    ${getSiteChromeScript()}

    const tocLinks = Array.from(document.querySelectorAll('.toc a'));
    const headings = tocLinks
      .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
      .filter(Boolean);

    const setActiveHeading = (id) => {
      tocLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === \`#\${id}\`);
      });
    };

    const updateActiveHeading = () => {
      if (!tocLinks.length || !headings.length) return;

      const threshold = window.innerHeight * 0.24;
      let activeHeading = headings[0];
      const nearPageEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80;

      if (nearPageEnd) {
        activeHeading = headings[headings.length - 1];
      }

      if (!nearPageEnd) {
        for (const heading of headings) {
          if (heading.getBoundingClientRect().top - threshold <= 0) {
            activeHeading = heading;
          } else {
            break;
          }
        }
      }

      if (activeHeading) {
        setActiveHeading(activeHeading.id);
      }
    };

    let ticking = false;
    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateActiveHeading();
        ticking = false;
      });
    };

    updateActiveHeading();
    document.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
  </script>
</body>
</html>`;

  await fs.writeFile(path.join(outDir, "index.html"), html.replace(/[ \t]+$/gm, ''), "utf8");
  return { localPath: `/posts/${slug}/`, readingTime };
}

// Write a dedicated digest page with special styling
async function writeDigestPage({ title, slug, bodyMarkdown, tags, date, readingTime, summary }) {
  const outDir = path.join("site", "posts", slug);
  await fs.mkdir(outDir, { recursive: true });

  const displayDate = new Date(date).toLocaleDateString("en-GB", {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const tagsHtml = tags.length ? `<div class="post-tags">${tags.map(t => `<a href="../../tags/#${slugify(t)}" class="tag" data-color="${tagColorIndex(t)}">${escapeHtml(t)}</a>`).join("")}</div>` : "";
  const digestContent = parseDigestMarkdown(bodyMarkdown);
  const digestIntro = digestContent.intro || summary || "A quick editorial sweep of the stories shaping AI, tools, research, and the companies building them.";
  const digestSectionsHtml = digestContent.sections.map((section) => `
        <section class="digest-section">
          <div class="digest-section-head">
            <h2>${escapeHtml(section.title)}</h2>
            ${section.intro ? `<p class="digest-section-intro">${escapeHtml(section.intro)}</p>` : ''}
          </div>
          ${section.items.length ? `
          <div class="digest-story-list">
            ${section.items.map((item) => `
            <article class="digest-story-card">
              <div class="digest-story-meta">
                <span>${escapeHtml(item.source || 'Digest item')}</span>
              </div>
              <h3>${item.url ? `<a href="${item.url}" target="_blank" rel="noopener">${escapeHtml(item.title)}</a>` : escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.summary)}</p>
              ${item.url ? `<a class="digest-story-link" href="${item.url}" target="_blank" rel="noopener">Read more</a>` : ''}
            </article>`).join('')}
          </div>` : ''}
        </section>`).join('');

  const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${getSecurityHeaders()}
  <title>${escapeHtml(title)} - ${SITE_NAME}</title>
  <meta name="description" content="AI and technology news digest for ${displayDate}" />
  <meta name="author" content="${SITE_OWNER}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="AI and technology news digest for ${displayDate}" />
  <meta property="og:type" content="article" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:creator" content="@koltregaskes" />
  ${getSharedHeadAssets('../../')}
</head>
<body>
  ${getHeaderHTML('../../', 'posts')}

  <main class="content-main">
    <article class="post">
      <header class="digest-header">
        <span class="digest-badge">Daily Digest</span>
        <h1 class="digest-title">${displayDate}</h1>
        <p class="digest-subtitle">${escapeHtml(digestIntro)}</p>
        <div class="digest-meta">
          <span>${readingTime} min read</span>
          <span class="meta-sep">&bull;</span>
          <span>Updated daily</span>
        </div>
      </header>

      <div class="digest-content">
        ${digestSectionsHtml}
      </div>

      <footer class="digest-footer">
        <p>This digest was automatically generated &bull; ${readingTime} min read</p>
      </footer>

      ${tagsHtml}
    </article>
  </main>

  ${getFooterHTML()}

  <script>
    ${getSiteChromeScript()}
  </script>
</body>
</html>`;

  await fs.writeFile(path.join(outDir, "index.html"), html.replace(/[ \t]+$/gm, ''), "utf8");
  return { localPath: `/posts/${slug}/`, readingTime };
}

async function writeLegacyRedirectPage(fromSlug, toSlug) {
  if (!fromSlug || !toSlug || fromSlug === toSlug) return;

  const outDir = path.join("site", "posts", fromSlug);
  await fs.mkdir(outDir, { recursive: true });

  const targetPath = `../${toSlug}/`;
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0; url=${targetPath}" />
  <link rel="canonical" href="${SITE_URL}/posts/${toSlug}/" />
  <title>Redirecting…</title>
</head>
<body>
  <p>Redirecting to <a href="${targetPath}">${targetPath}</a>.</p>
</body>
</html>`;

  await fs.writeFile(path.join(outDir, "index.html"), html.replace(/[ \t]+$/gm, ''), "utf8");
}

async function writeHomePage(items, newsArticles = []) {
  const sortedItems = [...items].sort((a, b) => new Date(b.updatedTime) - new Date(a.updatedTime));
  const articles = sortedItems.filter(item => (item.kind || 'article').toLowerCase() === 'article');
  const featurePosts = articles.filter(item => !isDigestPost(item));
  const leadStory = featurePosts[0] || articles[0];
  const featuredWriting = featurePosts.slice(0, 3);
  const recentWriting = featurePosts.slice(3, 7);
  const latestNews = newsArticles.slice(0, 5);
  const latestNewsDate = latestNews[0]?.date
    ? new Date(latestNews[0].date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : 'today';

  const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${getSecurityHeaders()}
  <title>${SITE_NAME} - Tech, AI, Development & More</title>
  <meta name="description" content="Hi. My name is ${SITE_OWNER}. I'm a software developer and AI enthusiast based in the UK. Writing about AI agents, creative tools, and technology." />
  <meta name="author" content="${SITE_OWNER}" />
  <meta property="og:title" content="${SITE_NAME}" />
  <meta property="og:description" content="Tech, AI, Development & More" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:creator" content="@koltregaskes" />
  ${getSharedHeadAssets('.')}
</head>
<body>
  ${getHeaderHTML('./')}

  <main class="home-main">
    <section class="home-hero fade-in-up">
      <div class="home-shell home-hero-grid">
        <div class="home-hero-copy">
          <p class="home-kicker">Daily AI creator buddy</p>
          <h1 class="home-hero-title">A sharper front page for daily AI news, grounded commentary, and the projects behind the work.</h1>
          <p class="home-hero-text">Kol's Korner is an editorial desk for the signal: quick daily news, proper opinion when it matters, and the wider creative ecosystem around the work.</p>
          <div class="home-hero-actions">
            <a href="./news/" class="button-primary">Open today's news</a>
            <a href="./posts/" class="button-secondary">Read the latest posts</a>
          </div>
        </div>
        <aside class="home-hero-panel">
          ${leadStory ? `
          <p class="home-panel-label">Lead story</p>
          <a href="./posts/${leadStory.slug}/" class="home-panel-story">
            ${leadStory.thumbnailUrl && leadStory.thumbnailUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? `
            <div class="home-panel-media">
              ${renderThumbnailImage(leadStory, escapeHtml(leadStory.title))}
            </div>` : ''}
            <div class="home-panel-story-copy">
              <h2>${escapeHtml(leadStory.title)}</h2>
              <p>${escapeHtml(leadStory.summary || 'Latest writing from Kol on AI, tools, and building with new technology.')}</p>
              <div class="home-panel-meta">
                <span>${new Date(leadStory.updatedTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span class="meta-sep">&bull;</span>
                <span>${leadStory.readingTime || 3} min read</span>
              </div>
            </div>
          </a>
          ` : ''}
          ${latestNews.length ? `
          <div class="home-panel-digest">
            <p class="home-panel-label">News desk</p>
            <strong>Freshly updated for ${escapeHtml(latestNewsDate)}</strong>
            <p>${latestNews.length} featured links are ready to browse without trawling the full archive.</p>
            <a href="./news/">Open the live news page</a>
          </div>
          ` : ''}
        </aside>
      </div>
    </section>

    ${latestNews.length ? `
    <section class="home-section fade-in-up">
      <div class="home-shell">
        <div class="home-section-heading">
          <div>
            <p class="section-eyebrow">Today's briefing</p>
            <h2>The five stories worth opening first</h2>
          </div>
          <a href="./news/" class="section-link">View the full news archive</a>
        </div>
        <div class="home-news-grid">
          ${latestNews.map(article => `
          <article class="home-news-card">
            <a href="./news/" class="home-news-link">
              <div class="home-news-meta">
                <span>${new Date(article.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                <span>${escapeHtml(article.source || 'Source')}</span>
              </div>
              <h3>${escapeHtml(article.title)}</h3>
              <p>${escapeHtml(article.summary || 'Latest AI and technology coverage from the live archive.')}</p>
            </a>
          </article>`).join('')}
        </div>
      </div>
    </section>
    ` : ''}

    ${featuredWriting.length ? `
    <section class="home-section fade-in-up">
      <div class="home-shell">
        <div class="home-section-heading">
          <div>
            <p class="section-eyebrow">Latest writing</p>
            <h2>Essays and opinion pieces with a point of view</h2>
          </div>
          <a href="./posts/" class="section-link">View all posts</a>
        </div>
        <div class="home-feature-grid">
          ${featuredWriting.map(item => {
            const title = escapeHtml(item.title);
            const summary = escapeHtml(item.summary || '');
            const hasImage = item.thumbnailUrl && item.thumbnailUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);

            return `
            <article class="home-feature-card">
              <a href="./posts/${item.slug}/" class="home-feature-link">
                ${hasImage ? `
                <div class="home-feature-media">
                  ${renderThumbnailImage(item, title)}
                </div>` : ''}
                <div class="home-feature-body">
                  <p class="home-feature-date">${new Date(item.updatedTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <h3>${title}</h3>
                  ${summary ? `<p>${summary}</p>` : ''}
                </div>
              </a>
            </article>`;
          }).join('')}
        </div>
      </div>
    </section>
    ` : ''}

    ${CONNECTED_PROJECTS.length ? `
    <section class="home-section fade-in-up">
      <div class="home-shell">
        <div class="home-section-heading">
          <div>
            <p class="section-eyebrow">Connected projects</p>
            <h2>The wider publishing ecosystem around Kol's Korner</h2>
          </div>
        </div>
        <div class="home-project-grid">
          ${CONNECTED_PROJECTS.map(project => `
          <a href="${project.url}" class="home-project-card" target="_blank" rel="noopener">
            <p class="home-project-label">${escapeHtml(project.label)}</p>
            <h3>${escapeHtml(project.name)}</h3>
            <p>${escapeHtml(project.description)}</p>
            <span>Visit site</span>
          </a>`).join('')}
        </div>
      </div>
    </section>
    ` : ''}

    ${recentWriting.length ? `
    <section class="home-section fade-in-up">
      <div class="home-shell">
        <div class="home-section-heading">
          <div>
            <p class="section-eyebrow">More from the archive</p>
            <h2>Recent pieces beyond the front row</h2>
          </div>
        </div>
        <div class="home-archive-grid">
          ${recentWriting.map(item => `
          <a href="./posts/${item.slug}/" class="home-archive-card">
            <span>${new Date(item.updatedTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.summary || "Commentary, analysis, and experiments from Kol's Korner.")}</p>
          </a>`).join('')}
        </div>
      </div>
    </section>
    ` : ''}
  </main>

  ${getFooterHTML()}

  <script>
    ${getSiteChromeScript({ animations: true })}
  </script>
</body>
</html>`;

  await fs.writeFile("site/index.html", html.replace(/[ \t]+$/gm, ''), "utf8");
}

async function writePostsPage(items) {
  const articles = [...items]
    .filter((item) => (item.kind || 'article').toLowerCase() === 'article')
    .sort((a, b) => new Date(b.updatedTime || b.date) - new Date(a.updatedTime || a.date));
  const editorialPosts = articles.filter((item) => !isDigestPost(item));
  const leadPost = editorialPosts[0] || articles[0] || null;
  const archivePosts = editorialPosts.slice(1);

  await fs.mkdir("site/posts", { recursive: true });

  const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${getSecurityHeaders()}
  <title>Posts - ${SITE_NAME}</title>
  <meta name="description" content="Browse all posts by ${SITE_OWNER} - Tech, Software Development & More" />
  <meta name="author" content="${SITE_OWNER}" />
  ${getSharedHeadAssets('..')}
</head>
<body>
  ${getHeaderHTML('../', 'posts')}

  <main class="content-main posts-main">
    <section class="posts-shell">
      <div class="home-section-heading posts-heading">
        <div>
          <p class="section-eyebrow">Posts</p>
          <h1 class="page-title">Essays, commentary, and practical takes with proper room to breathe.</h1>
        </div>
        <p class="posts-intro">This is the writing archive: longer pieces, sharper opinion, and a calmer read than the live news feed.</p>
      </div>

      ${leadPost ? `
      <article class="posts-lead-card fade-in-up">
        <a href="./${leadPost.slug}/" class="posts-lead-link">
          ${leadPost.thumbnailUrl && leadPost.thumbnailUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? `
          <div class="posts-lead-media">
            ${renderThumbnailImage(leadPost, escapeHtml(leadPost.title), '..')}
          </div>` : ''}
          <div class="posts-lead-copy">
            <p class="home-feature-date">${new Date(leadPost.updatedTime || leadPost.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            <h2>${escapeHtml(leadPost.title)}</h2>
            <p>${escapeHtml(leadPost.summary || 'The latest published commentary from Kol on AI, tools, and what matters underneath the headlines.')}</p>
            <div class="post-item-meta">
              <span>${leadPost.readingTime || 3} min read</span>
            </div>
          </div>
        </a>
      </article>` : ''}

      ${archivePosts.length ? `
      <section class="posts-stream fade-in-up" aria-label="Latest posts">
        ${archivePosts.map((item) => {
          const title = escapeHtml(item.title);
          const summary = escapeHtml(item.summary || '');
          const hasImage = item.thumbnailUrl && item.thumbnailUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);

          return `
          <article class="posts-stream-item">
            <a href="./${item.slug}/" class="posts-stream-link">
              ${hasImage ? `
              <div class="posts-stream-media">
                ${renderThumbnailImage(item, title, '..')}
              </div>` : ''}
              <div class="posts-stream-copy">
                <p class="home-feature-date">${new Date(item.updatedTime || item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <h3>${title}</h3>
                ${summary ? `<p>${summary}</p>` : ''}
                <div class="post-item-meta">
                  <span>${item.readingTime || 3} min read</span>
                </div>
              </div>
              <span class="posts-stream-cta">Read post</span>
            </a>
          </article>`;
        }).join('')}
      </section>` : ''}
    </section>
  </main>

  ${getFooterHTML()}

  <script>
    ${getSiteChromeScript({ animations: true })}
  </script>
</body>
</html>`;

  await fs.writeFile("site/posts/index.html", html.replace(/[ \t]+$/gm, ''), "utf8");
}

async function writeTagsPage(items, newsArticles = []) {
  const tagCollections = getTagCollections(items, newsArticles);
  const totalEntries = Array.from(
    new Set(
      tagCollections.flatMap(({ entries }) =>
        entries.map((entry) => `${entry.entryType}:${entry.href || entry.title}`)
      )
    )
  ).length;

  await fs.mkdir("site/tags", { recursive: true });

  const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${getSecurityHeaders()}
  <title>Tags - ${SITE_NAME}</title>
  <meta name="description" content="Browse posts by tag - Tech, Software Development & More" />
  ${getSharedHeadAssets('..')}
</head>
<body>
  ${getHeaderHTML('../', 'tags')}

  <main class="content-main tags-main">
    <section class="tags-shell">
      <div class="home-section-heading">
        <div>
          <p class="section-eyebrow">Topics</p>
          <h1 class="page-title">Browse the archive by useful themes, not random company names.</h1>
        </div>
        <p class="posts-intro">These groupings combine written posts with the live news archive, so tags like AI, agents, regulation, and infrastructure actually mean something.</p>
      </div>

      ${tagCollections.length === 0 ? '<p class="empty-message">No tags yet. Add tags to your posts!</p>' : `
      <nav class="tag-cloud" aria-label="Jump to tag">
        <a href="#" class="active" data-tag="all">All <span class="tag-count">(${totalEntries})</span></a>
        ${tagCollections.map(({ tag, label, count }) => {
          const tagId = slugify(tag);
          return `<a href="#${tagId}" data-tag="${tagId}">${escapeHtml(label)} <span class="tag-count">(${count})</span></a>`;
        }).join("\n        ")}
      </nav>

      ${tagCollections.map(({ tag, label, count, entries }) => {
        const tagId = slugify(tag);
        const featuredEntries = entries.slice(0, 6);

        return `
      <section class="tag-section" id="${tagId}" data-tag="${tagId}">
        <header class="tag-section-header">
          <div>
            <h2 class="tag-section-title"><span class="hash">#</span>${escapeHtml(label)}</h2>
            <p class="tag-section-description">Newest stories and posts filed under ${escapeHtml(label)}.</p>
          </div>
          <span class="tag-section-count">${count} item${count !== 1 ? 's' : ''}</span>
        </header>
        <div class="tag-entry-grid">
          ${featuredEntries.map((entry) => `
          <article class="tag-entry-card">
            <a href="${entry.href}" class="tag-entry-link"${entry.hrefAttrs}>
              <div class="tag-entry-meta">
                <span>${entry.entryType === 'news' ? 'News' : 'Post'}</span>
                <span class="meta-sep">&bull;</span>
                <span>${new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <h3>${escapeHtml(entry.title)}</h3>
              <p>${escapeHtml(entry.summary || (entry.entryType === 'news' ? 'Fresh coverage from the live news archive.' : 'Published commentary from Kol\'s Korner.'))}</p>
              <div class="tag-entry-footer">
                <span>${escapeHtml(entry.meta)}</span>
                <span>${entry.entryType === 'news' ? 'Open story' : 'Read post'}</span>
              </div>
            </a>
          </article>`).join("\n")}
        </div>
      </section>`;
      }).join("\n")}
      `}
    </section>
  </main>

  ${getFooterHTML()}

  <script>
    ${getSiteChromeScript()}

    // Tag filtering
    const tagCloud = document.querySelector('.tag-cloud');
    const tagSections = document.querySelectorAll('.tag-section');

    if (tagCloud) {
      tagCloud.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        e.preventDefault();
        const selectedTag = link.dataset.tag;

        // Update active state
        tagCloud.querySelectorAll('a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');

        // Filter sections
        tagSections.forEach(section => {
          if (selectedTag === 'all' || section.dataset.tag === selectedTag) {
            section.style.display = '';
          } else {
            section.style.display = 'none';
          }
        });

        // Scroll to section if specific tag selected
        if (selectedTag !== 'all') {
          const targetSection = document.getElementById(selectedTag);
          if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    }
  </script>
</body>
</html>`;

  await fs.writeFile("site/tags/index.html", html, "utf8");
}

async function writeStaticPage(slug, fallbackTitle, fallbackBody) {
  await fs.mkdir(`site/${slug}`, { recursive: true });

  // Try to read from content/pages/{slug}.md
  let title = fallbackTitle;
  let bodyHtml = fallbackBody;
  try {
    const mdPath = path.join(CONTENT_DIR, 'pages', `${slug}.md`);
    const raw = await fs.readFile(mdPath, 'utf8');
    const parsed = parseFrontmatter(raw);
    title = parsed.frontmatter.title || fallbackTitle;
    bodyHtml = markdownToHtml(parsed.body);
  } catch {
    // Use fallback content
  }

  const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${getSecurityHeaders()}
  <title>${escapeHtml(title)} - ${SITE_NAME}</title>
  <meta name="description" content="${escapeHtml(title)} - ${SITE_OWNER}" />
  ${getSharedHeadAssets('..')}
</head>
<body>
  ${getHeaderHTML('../', slug === 'about' ? 'about' : '')}

  <main class="content-main">
    <article class="about-content">
      <div class="about-body">
        ${bodyHtml}
      </div>
    </article>
  </main>

  ${getFooterHTML()}

  <script>
    ${getSiteChromeScript()}
  </script>
</body>
</html>`;

  await fs.writeFile(`site/${slug}/index.html`, html, "utf8");
}

async function writeAboutPage() {
  await fs.mkdir("site/about", { recursive: true });

  const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${getSecurityHeaders()}
  <title>About - ${SITE_NAME}</title>
  <meta name="description" content="About ${SITE_OWNER} - news curator, AI artist, AI musician, content maker, and lover of technology" />
  ${getSharedHeadAssets('..')}
</head>
<body>
  ${getHeaderHTML('../', 'about')}

  <main class="content-main about-page">
    <section class="about-shell">
      <section class="about-intro-card fade-in-up">
        <div class="about-avatar">
          <img src="../media/kol-profile.png" alt="${SITE_OWNER}" width="120" height="120" />
        </div>
        <div class="about-intro-copy">
          <p class="section-eyebrow">About</p>
          <h1 class="page-title">${SITE_OWNER}</h1>
          <p class="about-intro">I am a UK-based creator and builder working across AI news, creative experiments, automation, and publishing systems. Kol's Korner is where the daily signal lives: the stories worth opening, the commentary worth reading, and the projects that sit around the work.</p>
          <div class="about-start-grid">
            <a href="../news/" class="about-start-card">
              <span>Start with</span>
              <strong>AI news</strong>
              <p>The live archive is the fastest way to catch up on what matters today.</p>
            </a>
            <a href="../posts/" class="about-start-card">
              <span>Then read</span>
              <strong>Posts and essays</strong>
              <p>Longer writing, commentary, and practical takes from the publishing archive.</p>
            </a>
          </div>
        </div>
      </section>

      <div class="about-panel-grid fade-in-up">
        <section class="about-panel">
          <h2>What this site is for</h2>
          <p>Kol's Korner is built to be useful first: a cleaner front page for AI news, grounded writing when the hype needs cutting down, and a home for the systems that keep the whole thing moving every day.</p>
          <ul>
            <li>Daily AI and technology coverage surfaced from the shared source set</li>
            <li>Opinion and analysis when a story needs more than aggregation</li>
            <li>Creative work, experiments, and connected publishing projects</li>
          </ul>
        </section>

        <section class="about-panel">
          <h2>What I spend time on</h2>
          <ul>
            <li>Curating AI news and turning it into something quicker to scan</li>
            <li>Building multi-agent workflows, automation, and publishing tools</li>
            <li>Making AI art, music, videos, and adjacent creative work</li>
            <li>Sharing the useful bits without the marketing nonsense</li>
          </ul>
        </section>
      </div>

      <section class="about-panel fade-in-up">
        <div class="home-section-heading">
          <div>
            <p class="section-eyebrow">Connect</p>
            <h2>Find me across the channels where the day-to-day work actually gets shared.</h2>
          </div>
        </div>
        <div class="about-connect-grid">
          ${PROFILE_LINKS.map((link) => `
          <a href="${link.url}" class="about-connect-card" target="_blank" rel="noopener">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">${link.icon}</svg>
            <span>${link.name}</span>
          </a>`).join('')}
        </div>
      </section>
    </section>
  </main>

  ${getFooterHTML()}

  <script>
    ${getSiteChromeScript()}
  </script>
</body>
</html>`;

  await fs.writeFile("site/about/index.html", html, "utf8");
}

async function writeSubscribePage() {
  await fs.mkdir("site/subscribe", { recursive: true });

  const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${getSecurityHeaders()}
  <title>Newsletter - ${SITE_NAME}</title>
  <meta name="description" content="Newsletter updates for ${SITE_NAME}. The email edition has not launched yet, but the live news archive and published posts are already available on-site." />
  ${getSharedHeadAssets('..')}
</head>
<body>
  ${getHeaderHTML('../', 'subscribe')}

  <main class="content-main subscribe-main">
    <section class="subscribe-launch-note">
      <span class="subscribe-status-badge">Launching soon</span>
      <h1 class="page-title">The newsletter has not launched yet.</h1>
      <p class="subscribe-hero-text">The inbox version is still being prepared. Until it goes live, the fastest way to keep up is the on-site news archive and the published posts.</p>
      <div class="subscribe-actions">
        <a href="../news/" class="button-primary">Open AI news</a>
        <a href="../posts/" class="button-secondary">Read the latest posts</a>
      </div>
      <div class="subscribe-note">
        <h2>What to expect when it opens</h2>
        <p>A tighter email digest of the best stories, the sharper takes, and the publishing projects around the site. Until then, the live news page is the front door.</p>
      </div>
    </section>
  </main>

  ${getFooterHTML()}

  <script>
    ${getSiteChromeScript()}
  </script>
</body>
</html>`;

  await fs.writeFile("site/subscribe/index.html", html, "utf8");
}

async function writeContactPage() {
  await fs.mkdir("site/contact", { recursive: true });

  const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${getSecurityHeaders()}
  <title>Contact - ${SITE_NAME}</title>
  <meta name="description" content="Contact and social links for ${SITE_OWNER}." />
  ${getSharedHeadAssets('..')}
</head>
<body>
  ${getHeaderHTML('../', 'contact')}

  <main class="content-main contact-main">
    <section class="contact-shell">
      <section class="subscribe-launch-note fade-in-up">
        <span class="subscribe-status-badge">Contact</span>
        <h1 class="page-title">A protected contact form is still being set up.</h1>
        <p class="subscribe-hero-text">The long-term plan is a proper form with spam protection and human checks. Until that is wired in, the safest route is to reach me through the channels below.</p>
        <div class="subscribe-actions">
          <a href="../news/" class="button-primary">Open AI news</a>
          <a href="../about/" class="button-secondary">About Kol</a>
        </div>
      </section>

      <section class="about-panel fade-in-up">
        <div class="home-section-heading">
          <div>
            <p class="section-eyebrow">Reach out</p>
            <h2>Pick the channel that fits what you need.</h2>
          </div>
        </div>
        <div class="about-connect-grid">
          ${PROFILE_LINKS.map((link) => `
          <a href="${link.url}" class="about-connect-card" target="_blank" rel="noopener">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">${link.icon}</svg>
            <span>${link.name}</span>
          </a>`).join('')}
        </div>
      </section>
    </section>
  </main>

  ${getFooterHTML()}

  <script>
    ${getSiteChromeScript({ animations: true })}
  </script>
</body>
</html>`;

  await fs.writeFile("site/contact/index.html", html, "utf8");
}

// Generate RSS feed
async function writeRssFeed(items) {
  const articles = items
    .filter(item => item.kind === 'article' || isDigestPost(item))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20); // Last 20 articles

  const rssItems = articles.map(item => {
    const pubDate = new Date(item.date).toUTCString();
    const link = `${SITE_URL}/posts/${item.slug}/`;

    return `
    <item>
      <title>${escapeHtml(item.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeHtml(item.summary || '')}</description>
      ${item.tags.map(tag => `<category>${escapeHtml(tag)}</category>`).join('\n      ')}
    </item>`;
  }).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}</link>
    <description>Tech, AI, Development &amp; More by ${SITE_OWNER}</description>
    <language>en-gb</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`;

  await fs.writeFile('site/feed.xml', rss, 'utf8');
}

async function writeCnameFile() {
  const configuredDomain = DEPLOY_CNAME || (await fs.readFile('CNAME', 'utf8').catch(() => '')).trim();

  if (!configuredDomain) {
    await fs.rm('site/CNAME', { force: true }).catch(() => {});
    return;
  }

  await fs.writeFile('site/CNAME', `${configuredDomain}\n`, 'utf8');
}

async function writeRobotsTxt() {
  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
  await fs.writeFile('site/robots.txt', robots, 'utf8');
}

async function writeSitemap(items) {
  const urls = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/about/', changefreq: 'monthly', priority: '0.6' },
    { loc: '/posts/', changefreq: 'daily', priority: '0.8' },
    { loc: '/tags/', changefreq: 'weekly', priority: '0.5' },
    { loc: '/news/', changefreq: 'daily', priority: '0.8' },
    { loc: '/subscribe/', changefreq: 'monthly', priority: '0.4' },
    { loc: '/privacy.html', changefreq: 'yearly', priority: '0.2' }
  ];

  for (const item of items.filter((entry) => (entry.kind === 'article' || isDigestPost(entry)) && entry.localPath)) {
    urls.push({
      loc: item.localPath,
      changefreq: isDigestPost(item) ? 'daily' : 'monthly',
      priority: isDigestPost(item) ? '0.4' : '0.7',
      lastmod: item.updatedTime || item.date || ''
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url>\n    <loc>${SITE_URL}${url.loc}</loc>\n    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>\n    ` : ''}<changefreq>${url.changefreq}</changefreq>\n    <priority>${url.priority}</priority>\n  </url>`).join('\n')}\n</urlset>\n`;
  await fs.writeFile('site/sitemap.xml', xml, 'utf8');
}

async function removeWithRetries(targetPath, options = {}) {
  await fs.rm(targetPath, {
    force: true,
    maxRetries: 10,
    retryDelay: 200,
    ...options
  }).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
  });
}

async function cleanGeneratedOutput() {
  const generatedDirs = [
    'site/about',
    'site/contact',
    'site/data',
    'site/images',
    'site/music',
    'site/posts',
    'site/subscribe',
    'site/tags',
    'site/videos',
    'site/news-digests'
  ];
  const generatedFiles = [
    'site/admin.html',
    'site/app.js',
    'site/CNAME',
    'site/feed.xml',
    'site/index.html',
    'site/robots.txt',
    'site/sitemap.xml'
  ];

  await Promise.all(generatedDirs.map((dir) => removeWithRetries(dir, { recursive: true })));
  await Promise.all(generatedFiles.map((file) => removeWithRetries(file)));
}

// Main build function
(async () => {
  console.log('Building site from Obsidian markdown files...\n');
  console.log(`Content directory: ${CONTENT_DIR}\n`);

  await cleanGeneratedOutput();

  // Read all content
  const items = await readContentFiles();
  const { digestFiles, newsArticles } = await prepareNewsArchiveData();
  const editorialArticles = items
    .filter((item) => item.kind === 'article' && !isDigestPost(item))
    .sort((a, b) => new Date(b.updatedTime || b.date) - new Date(a.updatedTime || a.date));
  const articleNeighbours = new Map(
    editorialArticles.map((item, index) => [
      item.slug,
      {
        nextPost: editorialArticles[index - 1] || null,
        previousPost: editorialArticles[index + 1] || null
      }
    ])
  );

  // Write article pages
  for (const item of items) {
    if (item.kind === 'article' || isDigestPost(item)) {
      const isDigest = isDigestPost(item);

      let result;
      if (isDigest) {
        result = await writeDigestPage({
          title: item.title,
          slug: item.slug,
          bodyMarkdown: item.bodyMarkdown,
          tags: item.tags,
          date: item.date,
          readingTime: item.readingTime,
          summary: item.summary
        });
        await writeLegacyRedirectPage(item.legacySlug, item.slug);
      } else {
        const neighbours = articleNeighbours.get(item.slug) || {};
        result = await writeArticlePage({
          title: item.title,
          slug: item.slug,
          summary: item.summary,
          contentHtml: item.contentHtml,
          tags: item.tags,
          date: item.date,
          headings: item.headings,
          readingTime: item.readingTime,
          thumbnailUrl: item.thumbnailUrl,
          thumbnailWidth: item.thumbnailWidth,
          thumbnailHeight: item.thumbnailHeight,
          previousPost: neighbours.previousPost,
          nextPost: neighbours.nextPost
        });
      }
      item.localPath = result.localPath;
    }
  }

  // Write all pages
  await writeHomePage(items, newsArticles);
  await writePostsPage(items);
  await writeTagsPage(items, newsArticles);
  await writeAboutPage();
  await writeSubscribePage();
  await writeContactPage();
  // Write machine-readable data, feed, and crawl files
  await fs.mkdir("site/data", { recursive: true });
  await writeRssFeed(items);
  await writeSitemap(items);
  await writeRobotsTxt();
  await writeCnameFile();

  // Copy news-digests to site folder for the /news page
  const newsDigestsDir = path.join(process.cwd(), 'news-digests');
  const siteNewsDigestsDir = path.join(process.cwd(), 'site', 'news-digests');
  try {
    await fs.mkdir(siteNewsDigestsDir, { recursive: true });
    for (const digestFile of digestFiles) {
      const sourcePath = path.join(newsDigestsDir, digestFile.sourceFile);
      await fs.copyFile(
        sourcePath,
        path.join(siteNewsDigestsDir, digestFile.outputFile)
      );
    }

    await fs.writeFile(
      path.join(process.cwd(), 'site', 'data', 'news-digests.json'),
      JSON.stringify({ files: digestFiles.map((entry) => entry.outputFile) }, null, 2),
      'utf8'
    );
    await fs.writeFile(
      path.join(process.cwd(), 'site', 'data', 'news-articles.json'),
      JSON.stringify({ articles: newsArticles }, null, 2),
      'utf8'
    );

    console.log(`[ok] Copied ${digestFiles.length} news digests`);
  } catch (err) {
    console.warn('[warn] Could not copy news-digests:', err.message);
  }

  console.log(`\n[ok] Generated ${items.length} items`);
  console.log(`[ok] Home page: site/index.html`);
  console.log(`[ok] Posts page: site/posts/index.html`);
  console.log(`[ok] Tags page: site/tags/index.html`);
  console.log(`[ok] About page: site/about/index.html`);
  console.log(`[ok] Newsletter page: site/subscribe/index.html`);
  console.log(`[ok] Contact page: site/contact/index.html`);
  console.log(`[ok] RSS feed: site/feed.xml`);
  console.log(`[ok] Sitemap: site/sitemap.xml`);
  console.log(`[ok] Robots: site/robots.txt`);
  console.log(`[ok] News data: site/data/news-articles.json`);
  console.log('\nBuild complete!');
})();
