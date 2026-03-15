# Architecture

Technical overview of how Kol's Korner is built and deployed.

## System Overview

Kol's Korner is a custom static site generator.

```text
content/*.md + content/pages/*.md + news-digests/*.md
                    |
                    v
             scripts/build.mjs
                    |
                    v
                 site/
                    |
                    v
            GitHub Pages deployment
                    |
                    v
             https://koltregaskes.com
```

## Source of Truth

- `content/` stores published posts as markdown with YAML frontmatter
- `content/pages/` stores static page content such as the about page
- `news-digests/` stores raw daily digest markdown
- `site/` is generated output and is committed for deployment

The news-gatherer itself is separate infrastructure. This repo only uses the digest files it produces.

## Build Pipeline

[`scripts/build.mjs`](/W:/Websites/sites/koltregaskesdotcom/scripts/build.mjs) is responsible for:

1. Reading markdown content from `content/`
2. Parsing frontmatter and skipping unpublished posts
3. Converting markdown to HTML with the custom renderer
4. Generating article pages, digest pages, the homepage, posts index, tags page, about page, and newsletter page
5. Copying digest files into `site/news-digests/`
6. Writing `site/data/content.json`, `site/feed.xml`, and `site/CNAME`
7. Cleaning old generated output first so stale pages from previous builds are not deployed

## Deployment

GitHub Actions runs the build on pushes to `main`.

- [`.github/workflows/pages.yml`](/W:/Websites/sites/koltregaskesdotcom/.github/workflows/pages.yml) builds and deploys the site
- [`.github/workflows/daily-digest.yml`](/W:/Websites/sites/koltregaskesdotcom/.github/workflows/daily-digest.yml) builds digests and then rebuilds the site

The build can derive its canonical URL from:

- `CUSTOM_DOMAIN`
- the committed [`CNAME`](/W:/Websites/sites/koltregaskesdotcom/CNAME) file
- or the current GitHub owner/repo in Actions

## Generated Output

Common generated paths:

- `site/index.html`
- `site/posts/`
- `site/tags/`
- `site/about/`
- `site/subscribe/`
- `site/data/content.json`
- `site/feed.xml`
- `site/news-digests/`
- `site/CNAME`

Static assets that are maintained directly in `site/` include:

- `site/styles.css`
- `site/app.js`
- `site/news/`

## Frontmatter

Supported fields:

- `title`
- `kind`
- `date`
- `tags`
- `summary`
- `image`
- `url`
- `publish`

If `kind` is omitted, the build treats the file as an `article`.

## Important Conventions

- UK English
- `site/` is committed on purpose
- Internal/local agent files are not part of the published project
- The repo is markdown-first, not Notion-backed
