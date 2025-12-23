// scripts/fetch-notion.mjs
import fs from "node:fs/promises";
import path from "node:path";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
  console.error("Missing NOTION_TOKEN or NOTION_DATABASE_ID env vars.");
  process.exit(1);
}

const notionFetch = async (url, options = {}) => {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Notion API error ${res.status}: ${text}`);
  }
  return res.json();
};

const slugify = (s) =>
  (s || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "untitled";

const getProp = (page, name) => page?.properties?.[name];

const getTitle = (page) => {
  const p = getProp(page, "Name");
  const title = p?.title?.map(t => t.plain_text).join("") || "";
  return title || "Untitled";
};

const getSelect = (page, name) => getProp(page, name)?.select?.name || "";
const getCheckbox = (page, name) => !!getProp(page, name)?.checkbox;
const getRichText = (page, name) =>
  (getProp(page, name)?.rich_text || []).map(t => t.plain_text).join("");
const getMultiSelect = (page, name) =>
  (getProp(page, name)?.multi_select || []).map(t => t.name);

async function queryDatabaseAll() {
  const out = [];
  let cursor = undefined;

  while (true) {
    const body = {
      page_size: 100,
      filter: {
        property: "Publish",
        checkbox: { equals: true },
      },
      ...(cursor ? { start_cursor: cursor } : {}),
    };

    const data = await notionFetch(
      `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`,
      { method: "POST", body: JSON.stringify(body) }
    );

    out.push(...(data.results || []));
    if (!data.has_more) break;
    cursor = data.next_cursor;
  }

  return out;
}

async function fetchBlocksAll(blockId) {
  const blocks = [];
  let cursor = undefined;

  while (true) {
    const url = new URL(`https://api.notion.com/v1/blocks/${blockId}/children`);
    url.searchParams.set("page_size", "100");
    if (cursor) url.searchParams.set("start_cursor", cursor);

    const data = await notionFetch(url.toString(), { method: "GET" });

    blocks.push(...(data.results || []));
    if (!data.has_more) break;
    cursor = data.next_cursor;
  }

  return blocks;
}

const rtToHtml = (rtArr = []) =>
  rtArr.map(t => {
    const text = escapeHtml(t.plain_text || "");
    // very minimal formatting
    if (t.annotations?.code) return `<code>${text}</code>`;
    if (t.annotations?.bold) return `<strong>${text}</strong>`;
    if (t.annotations?.italic) return `<em>${text}</em>`;
    return text;
  }).join("");

function escapeHtml(s) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function blockToHtml(block) {
  const t = block.type;

  if (t === "paragraph") {
    const html = rtToHtml(block.paragraph?.rich_text || []);
    return html ? `<p>${html}</p>` : "";
  }

  if (t === "heading_1") return `<h2 id="${slugify(rtToHtml(block.heading_1?.rich_text || []))}">${rtToHtml(block.heading_1?.rich_text || [])}</h2>`;
  if (t === "heading_2") return `<h3 id="${slugify(rtToHtml(block.heading_2?.rich_text || []))}">${rtToHtml(block.heading_2?.rich_text || [])}</h3>`;
  if (t === "heading_3") return `<h4 id="${slugify(rtToHtml(block.heading_3?.rich_text || []))}">${rtToHtml(block.heading_3?.rich_text || [])}</h4>`;

  if (t === "quote") {
    const html = rtToHtml(block.quote?.rich_text || []);
    return html ? `<blockquote>${html}</blockquote>` : "";
  }

  if (t === "divider") return `<hr />`;

  if (t === "bulleted_list_item") {
    const html = rtToHtml(block.bulleted_list_item?.rich_text || []);
    return html ? `<li>${html}</li>` : "";
  }

  if (t === "numbered_list_item") {
    const html = rtToHtml(block.numbered_list_item?.rich_text || []);
    return html ? `<li>${html}</li>` : "";
  }

  if (t === "code") {
    const code = rtToHtml(block.code?.rich_text || []);
    const lang = escapeHtml(block.code?.language || "");
    return `<pre><code data-lang="${lang}">${code}</code></pre>`;
  }

  if (t === "image") {
    const src = block.image?.file?.url || block.image?.external?.url || "";
    const cap = rtToHtml(block.image?.caption || []);
    if (!src) return "";
    return `<figure><img src="${escapeHtml(src)}" alt="" loading="lazy" />${cap ? `<figcaption>${cap}</figcaption>` : ""}</figure>`;
  }

  return "";
}

function blocksToHtml(blocks) {
  let html = "";
  let inBullets = false;
  let inNumbers = false;

  for (const b of blocks) {
    if (b.type === "bulleted_list_item") {
      if (inNumbers) { html += `</ol>`; inNumbers = false; }
      if (!inBullets) { html += `<ul>`; inBullets = true; }
      html += blockToHtml(b);
      continue;
    }
    if (b.type === "numbered_list_item") {
      if (inBullets) { html += `</ul>`; inBullets = false; }
      if (!inNumbers) { html += `<ol>`; inNumbers = true; }
      html += blockToHtml(b);
      continue;
    }

    if (inBullets) { html += `</ul>`; inBullets = false; }
    if (inNumbers) { html += `</ol>`; inNumbers = false; }

    html += blockToHtml(b);
  }

  if (inBullets) html += `</ul>`;
  if (inNumbers) html += `</ol>`;
  return html;
}

function extractHeadings(blocks) {
  const headings = [];
  
  for (const b of blocks) {
    if (b.type === "heading_1" || b.type === "heading_2" || b.type === "heading_3") {
      const text = rtToHtml(b[b.type]?.rich_text || []);
      const level = b.type === "heading_1" ? 2 : b.type === "heading_2" ? 3 : 4;
      headings.push({
        text,
        id: slugify(text),
        level
      });
    }
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

async function writeArticlePage({ title, slug, contentHtml, tags, date, headings }) {
  const outDir = path.join("site", "posts", slug);
  await fs.mkdir(outDir, { recursive: true });

  const toc = generateTOC(headings);
  const tagsHtml = tags.length ? `<div class="post-tags">${tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>` : "";

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/notion-site-test/post-styles.css" />
</head>
<body>
  <header class="site-header">
    <div class="wrap">
      <nav class="site-nav">
        <a href="/notion-site-test/" class="logo">← Home</a>
        <div class="nav-links">
          <a href="/notion-site-test/posts/">Posts</a>
          <a href="/notion-site-test/tags/">Tags</a>
          <a href="/notion-site-test/about/">About</a>
        </div>
      </nav>
    </div>
  </header>

  <main class="post-layout">
    <div class="wrap">
      <div class="post-container">
        ${toc ? `<aside class="post-sidebar">${toc}</aside>` : ""}
        <article class="post-content">
          <header class="post-header">
            <h1>${escapeHtml(title)}</h1>
            ${date ? `<time class="post-date">${new Date(date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</time>` : ""}
            ${tagsHtml}
          </header>
          <div class="post-body">
            ${contentHtml}
          </div>
        </article>
      </div>
    </div>
  </main>

  <script>
    // Simple TOC highlight on scroll
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.getAttribute('id');
        const tocLink = document.querySelector(\`.toc a[href="#\${id}"]\`);
        if (tocLink) {
          if (entry.isIntersecting) {
            document.querySelectorAll('.toc a').forEach(l => l.classList.remove('active'));
            tocLink.classList.add('active');
          }
        }
      });
    }, { rootMargin: '-20% 0px -35% 0px' });

    document.querySelectorAll('h2[id], h3[id], h4[id]').forEach(heading => {
      observer.observe(heading);
    });
  </script>
</body>
</html>`;

  await fs.writeFile(path.join(outDir, "index.html"), html, "utf8");
  return `/posts/${slug}/`;
}

async function writeHomePage(items) {
  const articles = items.filter(i => i.kind === "article").slice(0, 6);
  
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Home</title>
  <link rel="stylesheet" href="./home-styles.css" />
</head>
<body>
  <header class="site-header">
    <div class="wrap">
      <nav class="site-nav">
        <a href="./" class="logo">Home</a>
        <div class="nav-links">
          <a href="./posts/">Posts</a>
          <a href="./tags/">Tags</a>
          <a href="./about/">About</a>
        </div>
      </nav>
    </div>
  </header>

  <main>
    <div class="wrap">
      <section class="hero">
        <h1>Welcome</h1>
        <p class="hero-subtitle">Thoughts, notes, and experiments from Notion</p>
      </section>

      <section class="latest-posts">
        <h2>Latest Posts</h2>
        <div class="post-grid">
          ${articles.map(item => `
            <article class="post-card">
              <a href="./posts/${item.slug}/" class="post-card-link">
                <h3>${escapeHtml(item.title)}</h3>
                ${item.summary ? `<p class="post-summary">${escapeHtml(item.summary)}</p>` : ""}
                ${item.tags.length ? `<div class="post-tags">${item.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>` : ""}
              </a>
            </article>
          `).join("")}
        </div>
        <div class="view-all">
          <a href="./posts/" class="btn">View all posts →</a>
        </div>
      </section>
    </div>
  </main>
</body>
</html>`;

  await fs.writeFile("site/index.html", html, "utf8");
}

async function writePostsPage(items) {
  const articles = items.filter(i => i.kind === "article");
  
  await fs.mkdir("site/posts", { recursive: true });
  
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>All Posts</title>
  <link rel="stylesheet" href="../home-styles.css" />
</head>
<body>
  <header class="site-header">
    <div class="wrap">
      <nav class="site-nav">
        <a href="../" class="logo">Home</a>
        <div class="nav-links">
          <a href="./" class="active">Posts</a>
          <a href="../tags/">Tags</a>
          <a href="../about/">About</a>
        </div>
      </nav>
    </div>
  </header>

  <main>
    <div class="wrap">
      <h1>All Posts</h1>
      
      <div class="post-list">
        ${articles.map(item => `
          <article class="post-list-item">
            <a href="../posts/${item.slug}/" class="post-list-link">
              <h2>${escapeHtml(item.title)}</h2>
              ${item.summary ? `<p class="post-summary">${escapeHtml(item.summary)}</p>` : ""}
              <div class="post-meta">
                <time>${new Date(item.updatedTime).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</time>
                ${item.tags.length ? `<span class="meta-sep">•</span>${item.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}` : ""}
              </div>
            </a>
          </article>
        `).join("")}
      </div>
    </div>
  </main>
</body>
</html>`;

  await fs.writeFile("site/posts/index.html", html, "utf8");
}

async function writeTagsPage(items) {
  const tagCounts = {};
  items.filter(i => i.kind === "article").forEach(item => {
    item.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  await fs.mkdir("site/tags", { recursive: true });
  
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tags</title>
  <link rel="stylesheet" href="../home-styles.css" />
</head>
<body>
  <header class="site-header">
    <div class="wrap">
      <nav class="site-nav">
        <a href="../" class="logo">Home</a>
        <div class="nav-links">
          <a href="../posts/">Posts</a>
          <a href="./" class="active">Tags</a>
          <a href="../about/">About</a>
        </div>
      </nav>
    </div>
  </header>

  <main>
    <div class="wrap">
      <h1>Tags</h1>
      
      <div class="tag-cloud">
        ${sortedTags.map(([tag, count]) => `
          <a href="#${slugify(tag)}" class="tag-item">
            <span class="tag-name">${escapeHtml(tag)}</span>
            <span class="tag-count">${count}</span>
          </a>
        `).join("")}
      </div>

      ${sortedTags.map(([tag]) => {
        const tagPosts = items.filter(i => i.kind === "article" && i.tags.includes(tag));
        return `
          <section class="tag-section" id="${slugify(tag)}">
            <h2>${escapeHtml(tag)}</h2>
            <div class="post-list">
              ${tagPosts.map(item => `
                <article class="post-list-item">
                  <a href="../posts/${item.slug}/">
                    <h3>${escapeHtml(item.title)}</h3>
                    ${item.summary ? `<p class="post-summary">${escapeHtml(item.summary)}</p>` : ""}
                  </a>
                </article>
              `).join("")}
            </div>
          </section>
        `;
      }).join("")}
    </div>
  </main>
</body>
</html>`;

  await fs.writeFile("site/tags/index.html", html, "utf8");
}

async function writeAboutPage() {
  await fs.mkdir("site/about", { recursive: true });
  
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>About</title>
  <link rel="stylesheet" href="../home-styles.css" />
</head>
<body>
  <header class="site-header">
    <div class="wrap">
      <nav class="site-nav">
        <a href="../" class="logo">Home</a>
        <div class="nav-links">
          <a href="../posts/">Posts</a>
          <a href="../tags/">Tags</a>
          <a href="./" class="active">About</a>
        </div>
      </nav>
    </div>
  </header>

  <main>
    <div class="wrap">
      <article class="about-content">
        <h1>About</h1>
        <p>This is a static site generated from a Notion database.</p>
        <p>Edit this content by modifying the <code>writeAboutPage</code> function in <code>scripts/fetch-notion.mjs</code>.</p>
      </article>
    </div>
  </main>
</body>
</html>`;

  await fs.writeFile("site/about/index.html", html, "utf8");
}

(async () => {
  const pages = await queryDatabaseAll();

  const items = [];
  for (const page of pages) {
    const title = getTitle(page);
    const kind = getSelect(page, "Kind") || "unknown";
    const summary = getRichText(page, "Summary") || "";
    const tags = getMultiSelect(page, "Tags");
    const driveUrl = (getProp(page, "Drive URL")?.url) || "";

    const slug = slugify(title);
    let localPath = "";
    let headings = [];

    if (kind === "article") {
      const blocks = await fetchBlocksAll(page.id);
      headings = extractHeadings(blocks);
      const contentHtml = blocksToHtml(blocks);
      localPath = await writeArticlePage({ 
        title, 
        slug, 
        contentHtml, 
        tags,
        date: page.last_edited_time,
        headings
      });
    }

    items.push({
      id: page.id,
      title,
      slug,
      kind,
      summary,
      tags,
      driveUrl,
      notionUrl: page.url,
      localPath,
      updatedTime: page.last_edited_time,
    });
  }

  // Write all pages
  await writeHomePage(items);
  await writePostsPage(items);
  await writeTagsPage(items);
  await writeAboutPage();

  // Keep the JSON for backwards compatibility
  await fs.mkdir("site/data", { recursive: true });
  await fs.writeFile("site/data/notion.json", JSON.stringify({ items }, null, 2), "utf8");

  console.log(`✓ Generated ${items.length} items`);
  console.log(`✓ Home page: site/index.html`);
  console.log(`✓ Posts page: site/posts/index.html`);
  console.log(`✓ Tags page: site/tags/index.html`);
  console.log(`✓ About page: site/about/index.html`);
  console.log(`✓ JSON data: site/data/notion.json`);
})();
