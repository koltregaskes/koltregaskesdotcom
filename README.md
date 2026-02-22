# Kol's Korner

Personal website built from Obsidian markdown files, deployed to GitHub Pages.

**Live site:** https://koltregaskes.github.io/koltregaskesdotcom/

## Features

- **Obsidian-powered** - Write content in Obsidian markdown
- **Auto-deploy** - Push to main branch, site updates automatically
- **Dark/Light mode** - Theme toggle with localStorage persistence
- **Multiple content types** - Articles, images, videos, music
- **Content filters** - Toggle content types on home page
- **Gallery navigation** - Keyboard, mouse wheel, prev/next buttons
- **SEO optimised** - Meta tags, Open Graph, Twitter Cards
- **Security headers** - CSP, XSS protection, clickjacking protection
- **Responsive design** - Works on desktop, tablet, and mobile

## Quick Start

### 1. Add Content

Create markdown files in the `content/` folder:

```markdown
---
title: My Post Title
kind: article
date: 2026-01-01
tags: [tech, ai]
summary: Brief description
publish: true
---

# My Post

Write your content here in markdown...
```

### 2. Build Locally (Optional)

```bash
node scripts/build.mjs
```

Then serve the `site/` folder:

```bash
cd site
npx http-server -p 8080
```

Visit: http://localhost:8080/koltregaskesdotcom/

### 3. Deploy

Push to the `main` branch. GitHub Actions will automatically build and deploy.

```bash
git add .
git commit -m "Add new post"
git push
```

## Content Types

| Kind | Description | Frontmatter |
|------|-------------|-------------|
| `article` | Blog posts | `kind: article` |
| `image` | Image gallery | `kind: image`, `image: path/to/file.jpg` |
| `video` | Video gallery | `kind: video`, `url: https://...` |
| `music` | Music gallery | `kind: music`, `url: https://...` |

## Frontmatter Reference

```yaml
---
title: Post Title          # Required
kind: article              # article|image|video|music
date: 2026-01-01          # Publication date
tags: [tag1, tag2]        # Array of tags
summary: Brief text       # Preview text
image: images/hero.jpg    # Thumbnail/hero image
url: https://...          # External URL (for media)
publish: true             # Set false to hide
---
```

## Folder Structure

```
koltregaskesdotcom/
  content/              # Your markdown content
    welcome.md
    images/             # Images for posts
  scripts/
    build.mjs           # Build script
  site/                 # Generated output (don't edit)
    index.html
    posts/
    media/
    styles.css
  .github/workflows/    # GitHub Actions
    pages.yml
```

## Site Pages

- **Home** - Grid of all content with filters
- **Posts** - List of articles
- **Tags** - Articles grouped by tag
- **Images** - Image gallery
- **Videos** - Video gallery
- **Music** - Music gallery
- **About** - About page
- **Newsletter** - Subscription form

## Design

Inspired by [justoffbyone.com](https://justoffbyone.com/).

## Development

### Prerequisites

- Node.js 18+

### Local Development

```bash
# Build site
node scripts/build.mjs

# Serve locally
cd site && npx http-server -p 8080

# Visit http://localhost:8080/koltregaskesdotcom/
```

### Customisation

- **Styles:** Edit `site/styles.css`
- **Templates:** Edit page generation in `scripts/build.mjs`
- **Content:** Add/edit files in `content/`

## Deployment

GitHub Actions automatically:
1. Triggers on push to `main`
2. Runs `node scripts/build.mjs`
3. Deploys `site/` to GitHub Pages

Manual trigger: Go to Actions tab → "Build and deploy" → "Run workflow"

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical details
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues

---

Made in the UK by Kol Tregaskes
