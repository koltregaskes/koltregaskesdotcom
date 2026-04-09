# Kol's Korner

Personal website and publishing system for Kol Tregaskes.

## Deployment State

- Live GitHub Pages URL: https://koltregaskes.github.io/kols-korner/
- Intended production domain: https://koltregaskes.com/
- Custom-domain cutover still depends on external DNS changes and GitHub Pages domain verification

## What This Repo Is

- A custom Node.js static site generator
- Markdown content in `content/`
- Daily digests in `news-digests/`
- Generated, deployable output committed in `site/`
- GitHub Actions deployment to GitHub Pages on push to `main`
- Local Windows Task Scheduler automation for the twice-daily digest refresh

The shared news-gathering pipeline runs outside this repo. This repo consumes the generated digest inputs, publishes digest posts, builds the site, and deploys the finished static output.

## Build

```bash
node scripts/build.mjs
```

## Daily News

```bash
node scripts/fetch-news.mjs --date YYYY-MM-DD
node scripts/generate-daily-digest.mjs --date YYYY-MM-DD --allow-empty --force
node scripts/backfill-digests.mjs
```

- Raw digest files live in `news-digests/`
- Published digest posts live in `content/daily-digest-YYYY-MM-DD.md`
- `scripts/backfill-digests.mjs` publishes any raw digests that do not yet have a matching post
- `scripts/run-daily-news.ps1` is the primary production runner for digest refreshes
- The Windows scheduled task runs at 07:00 and 19:00 Europe/London
- `.github/workflows/daily-digest.yml` is a manual build-check workflow only
- `site/data/news-articles.json` is generated during build so the news page can load from one prebuilt payload instead of fetching every raw digest separately

Optional environment variables:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-key
CUSTOM_DOMAIN=koltregaskes.com
```

## Preview Locally

```bash
node scripts/build.mjs
cd site
npx http-server -p 8080
```

Visit `http://localhost:8080/`.

## Deploy

Push to `main`. GitHub Actions will:

1. Run `node scripts/build.mjs`
2. Upload `site/`
3. Deploy to GitHub Pages

The repo already includes a root `CNAME` file for `koltregaskes.com`, but the build only switches canonical URLs to the custom domain when `CUSTOM_DOMAIN` is set in the environment. Until then, the generated feed, sitemap, and robots file stay aligned with the working GitHub Pages URL.

## Content Model

Articles and digests use markdown with YAML frontmatter:

```yaml
---
title: My Post Title
kind: article
date: 2026-03-15
tags: [ai, tech]
summary: Short description for listings and previews
publish: true
image: my-image.png
---
```

Supported fields:

- `title`
- `kind`
- `date`
- `tags`
- `summary`
- `image`
- `url`
- `publish`

Posts with `publish: false` are excluded from the build.

## Key Paths

- `scripts/build.mjs` - Main build script
- `scripts/run-daily-news.ps1` - Production digest runner
- `content/` - Source articles and static page markdown
- `news-digests/` - Raw digest markdown used by the news section
- `site/` - Generated output that GitHub Pages deploys
- `site/data/news-digests.json` - Generated manifest for the news browser
- `site/data/news-articles.json` - Prebuilt article payload for the news browser
- `.github/workflows/pages.yml` - Main Pages deploy workflow
- `.github/workflows/daily-digest.yml` - Manual digest build-check workflow

## Notes

- UK English throughout
- Dark mode only; do not reintroduce the old theme toggle without a clear product decision
- No Notion content pipeline in the current architecture
- `site/` is intentionally committed
- Internal agent files such as `AGENTS.md`, `CLAUDE.md`, and local Claude settings are ignored and not part of the published project
