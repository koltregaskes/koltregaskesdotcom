# Kol's Korner

Personal website and publishing system for [koltregaskes.com](https://koltregaskes.com).

## What This Repo Is

- A custom Node.js static site generator
- Markdown content in `content/`
- Daily digests in `news-digests/`
- Generated, deployable output committed in `site/`
- GitHub Pages deployment for the production domain `koltregaskes.com`

The news-gathering pipeline is not maintained in this repo. This site only consumes the generated digest files.

## Build

```bash
node scripts/build.mjs
```

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

The repo is configured for a custom domain via the committed [`CNAME`](/W:/Websites/sites/koltregaskesdotcom/CNAME) file and can also read `CUSTOM_DOMAIN` from repository variables.

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
- `content/` - Source articles and static page markdown
- `news-digests/` - Raw digest markdown used by the news section
- `site/` - Generated output that GitHub Pages deploys
- `.github/workflows/pages.yml` - Main Pages deploy workflow
- `.github/workflows/daily-digest.yml` - Digest build workflow

## Notes

- UK English throughout
- No external runtime framework
- `site/` is intentionally committed
- Internal agent files such as `AGENTS.md`, `CLAUDE.md`, and local Claude settings are ignored and not part of the published project
