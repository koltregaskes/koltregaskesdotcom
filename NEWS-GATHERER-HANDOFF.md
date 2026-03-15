# News Gatherer — Handoff Prompt for New Local Session

Copy everything below the line into a new Claude Code session running on your local workspace.

---

## Context

I'm building a personal blog/news site called **Kol's Korner** (https://koltregaskes.github.io/koltregaskesdotcom/). The site is a custom Node.js static site generator deployed to GitHub Pages.

The repo is at: `https://github.com/koltregaskes/koltregaskesdotcom`

## The News Gatherer / News Scout

I have a news gathering system that needs to be rebuilt properly. Here's what exists and what's wrong:

### What currently exists (broken)

- `scripts/fetch-news.mjs` — An RSS feed fetcher that only has **3 sources** (TechCrunch, AI News, Reuters). This is wrong. I never asked for RSS feeds.
- `scripts/generate-daily-digest.mjs` — Takes raw digest markdown and converts it into publishable blog posts with YAML frontmatter.
- `.github/workflows/daily-digest.yml` — Runs daily at 6am UTC, calls fetch-news then generate-daily-digest then builds the site.
- `news-digests/` directory — Raw digest markdown files (the intermediate format).
- `content/daily-digest-*.md` — Published digest posts on the site.

### What I actually want

I have **60-70 curated news source websites** (not RSS feeds) covering AI, technology, and related topics. These are organised into categories. The sources were previously tracked in a document called `SOURCE-TESTING-TRACKER.md` (62 total sources: 34 fully working, 8 partial, 20 blocked/failed).

The news gatherer should:

1. **Scrape/fetch from the actual website URLs** I've provided — not RSS feeds
2. **Cover all 60-70 sources** across multiple categories (not just 3)
3. **Store results in a Supabase database** — I have a Supabase project set up at `https://gdktukmraxaircugxnls.supabase.co`
4. **Generate daily digests** from the database for the blog

### Categories of news sources

The sources are grouped into approximately 4-5 categories. You'll need me to provide the full list again, but they include sources like:
- Major tech outlets (TechCrunch, The Verge, Ars Technica, etc.)
- AI-specific outlets (AI News, Anthropic blog, OpenAI blog, Google DeepMind blog, etc.)
- General news with tech sections (Reuters, BBC, NPR, Washington Post, etc.)
- Research and newsletters (arXiv, Ben's Bites, Smol AI News, Sebastian Raschka, etc.)
- YouTube AI channels (approximately 10 channels)

### Supabase integration

- I have a Supabase project already created
- The `.env` file with the Supabase URL and keys is on my local machine — **you have access to it in local workspace sessions**
- The database should store:
  - News articles (title, source, URL, summary, category, date, etc.)
  - Source configuration (the 60-70 websites and their scraping settings)
  - Potentially subscriber data for the newsletter (future)

### What the output format should look like

The `generate-daily-digest.mjs` script expects digest files in this format:

```markdown
# AI News Digest — YYYY-MM-DD

> Generated automatically by News Scout. X stories from Y sources.

## Top Stories

- **Article Title** ([Source Name](https://url.com)) _YYYY-MM-DD_
  Summary text here.

## Industry

- **Article Title** ([Source Name](https://url.com)) _YYYY-MM-DD_
  Summary text here.

## Research & Products

...

## Policy & Ethics

...
```

These get saved to `news-digests/YYYY-MM-DD-digest.md` and then `generate-daily-digest.mjs` converts them into publishable blog posts in `content/daily-digest-YYYY-MM-DD.md`.

### The news app on the site

There's also a client-side news app at `site/news/` with `news-app.js` (33KB) that:
- Loads digest files from `news-digests/`
- Provides filtering by date, search, source
- Supports highlighting and archive browsing

### Key decisions needed

1. **How to fetch from websites** — Since these aren't RSS feeds, we need web scraping. Consider using `fetch` with HTML parsing, or a headwriting approach for sites that block scraping.
2. **Supabase schema** — Design the tables for articles, sources, and categories.
3. **Replace `fetch-news.mjs`** — The current RSS-based script needs to be replaced with the proper web scraping approach.
4. **Running locally vs GitHub Actions** — The scraping may need to run locally or on a server rather than in GitHub Actions (some sites block GitHub's IP ranges).

### Files to reference in the repo

- `scripts/fetch-news.mjs` — Current (broken) RSS fetcher, to be replaced
- `scripts/generate-daily-digest.mjs` — Digest generator (this works fine, keep it)
- `scripts/build.mjs` — Main site builder
- `.github/workflows/daily-digest.yml` — Daily automation workflow
- `site/news/news-app.js` — Client-side news app
- `news-digests/` — Example digest files for reference format

### First steps

1. Ask me for the full list of 60-70 news source URLs and their categories
2. Design the Supabase database schema
3. Build the news fetcher that scrapes from actual websites
4. Test with a few sources first, then scale up
5. Integrate with the existing `generate-daily-digest.mjs` pipeline
