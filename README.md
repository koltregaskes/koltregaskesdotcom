# notion-site-test

A static website generated from a Notion database and deployed to GitHub Pages.

## Features

- **Home page**: Hero section + latest posts
- **Posts page**: Full list of all articles with dates and tags
- **Tags page**: Browse posts by tag
- **About page**: Static about page
- **Individual post pages**: Full article content with table of contents
- **Automatic builds**: GitHub Actions fetches Notion content hourly and rebuilds site

## How It Works

1. **Notion Database**: Content is managed in a Notion database with these properties:
   - `Name` (Title): Post title
   - `Kind` (Select): Type of content (article, image, video)
   - `Publish` (Checkbox): Only published items appear on site
   - `Summary` (Rich Text): Short description
   - `Tags` (Multi-select): Post tags
   - `Drive URL` (URL): Optional external link

2. **GitHub Actions**: The workflow in `.github/workflows/pages.yml` runs hourly (or on push) to:
   - Fetch all published items from Notion
   - Generate static HTML pages for all posts
   - Build homepage, posts index, tags page, and about page
   - Deploy to GitHub Pages

3. **Static Site**: All pages are pre-generated HTML/CSS with no runtime dependencies

## Local Development

```bash
# Install dependencies (none required - uses Node built-ins)
npm install

# Fetch Notion data and build site
export NOTION_TOKEN="your_notion_integration_token"
export NOTION_DATABASE_ID="your_database_id"
node scripts/fetch-notion.mjs

# Serve locally (use any static file server)
npx http-server site -p 8080
# Visit http://localhost:8080
```

## Deployment

The site automatically deploys to GitHub Pages via Actions. Manual deployment:

1. Ensure secrets are set in GitHub repo settings:
   - `NOTION_TOKEN`
   - `NOTION_DATABASE_ID`

2. Push to `main` branch or manually trigger workflow

3. Site will be available at: `https://<username>.github.io/<repo-name>/`

## File Structure

```
.
├── .github/workflows/
│   └── pages.yml          # GitHub Actions workflow
├── scripts/
│   └── fetch-notion.mjs   # Notion API client & site generator
├── site/                  # Generated static site
│   ├── index.html         # Home page
│   ├── home-styles.css    # Styles for home/posts/tags/about
│   ├── post-styles.css    # Styles for individual posts
│   ├── posts/
│   │   ├── index.html     # All posts page
│   │   └── {slug}/
│   │       └── index.html # Individual post pages
│   ├── tags/
│   │   └── index.html     # Tags page
│   ├── about/
│   │   └── index.html     # About page
│   └── data/
│       └── notion.json    # Raw data (for backwards compatibility)
└── README.md
```

## Customisation

### Edit the About Page

Modify the `writeAboutPage()` function in `scripts/fetch-notion.mjs`.

### Change Styling

- Edit `site/home-styles.css` for home/posts/tags/about pages
- Edit `site/post-styles.css` for individual post pages

### Modify Build Frequency

Edit the `cron` schedule in `.github/workflows/pages.yml`:
```yaml
schedule:
  - cron: "17 * * * *"  # Every hour at :17
```

## Troubleshooting

**No posts showing:**
1. Verify posts have `Publish` checkbox enabled in Notion
2. Check GitHub Actions logs for build errors
3. Ensure `NOTION_TOKEN` and `NOTION_DATABASE_ID` secrets are set correctly

**Broken links:**
- Ensure all internal links use the repo base path (`/notion-site-test/`)
- Check that `localPath` is correctly generated in fetch script

**Styling issues:**
- Clear browser cache
- Verify CSS files are in the `site/` directory before build

## Task 1 Fix Summary

**Root Cause**: ID mismatch between HTML and JavaScript
- HTML had `<div id="grid">` but JS looked for `$("#list")`
- HTML had `<p id="meta">` but JS looked for `$("#count")`

**Fix Applied**:
- Updated `site/index.html` to use correct IDs
- Added comprehensive error handling in `site/app.js`
- Added debug logging to console for troubleshooting

## License

MIT
