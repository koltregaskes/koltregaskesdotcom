// Generates sitemap.xml for Kol's Korner from the site directory.
// Run: node scripts/generate-sitemap.mjs
// Output: site/sitemap.xml

import { readdirSync, writeFileSync, statSync } from 'fs';
import path from 'path';

const SITE_DIR = path.join(process.cwd(), 'site');
const DOMAIN = 'https://koltregaskes.com';
const OUTPUT = path.join(SITE_DIR, 'sitemap.xml');

const urls = [];

// Main pages
urls.push({ loc: '/', changefreq: 'daily', priority: '1.0' });
urls.push({ loc: '/about/', changefreq: 'monthly', priority: '0.6' });
urls.push({ loc: '/posts/', changefreq: 'daily', priority: '0.8' });
urls.push({ loc: '/tags/', changefreq: 'weekly', priority: '0.5' });
urls.push({ loc: '/news/', changefreq: 'daily', priority: '0.8' });
urls.push({ loc: '/subscribe/', changefreq: 'monthly', priority: '0.4' });
urls.push({ loc: '/privacy.html', changefreq: 'yearly', priority: '0.2' });

// All posts
const postsDir = path.join(SITE_DIR, 'posts');
try {
  const posts = readdirSync(postsDir).filter(f => {
    const fullPath = path.join(postsDir, f);
    return statSync(fullPath).isDirectory() && !f.startsWith('.');
  });

  for (const slug of posts) {
    const isDigest = slug.startsWith('daily-digest-');
    urls.push({
      loc: `/posts/${slug}/`,
      changefreq: 'monthly',
      priority: isDigest ? '0.4' : '0.7',
    });
  }
} catch (e) {
  console.error('Could not read posts directory:', e.message);
}

// Build XML
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${DOMAIN}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

writeFileSync(OUTPUT, xml, 'utf8');
console.log(`Generated sitemap with ${urls.length} URLs at ${OUTPUT}`);
