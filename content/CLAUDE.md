# Content Folder

This folder contains all site content as Obsidian-compatible markdown files.

## Frontmatter Format

Each content file should have YAML frontmatter:

```yaml
---
title: Your Post Title
kind: article|image|video|music
date: 2026-01-01
tags: [tag1, tag2]
summary: Brief description for previews
image: images/hero.jpg  # Optional, for thumbnails
publish: true  # Set to false to hide
---
```

## Content Types

### Articles (kind: article)
Regular blog posts with markdown content.

### Images (kind: image)
Image gallery items. Use `image:` frontmatter for the file path.

### Videos (kind: video)
Video gallery items. Use `url:` frontmatter for the video URL.

### Music (kind: music)
Music gallery items. Use `url:` frontmatter for the audio URL.

## File Organisation

```
content/
  welcome.md           # Article
  my-predictions.md    # Article
  images/              # Image files for posts
    hero.jpg
  gallery/             # Gallery images/videos
    sunset.jpg
```

## Building

Run `node scripts/build.mjs` to generate the site from these files.
