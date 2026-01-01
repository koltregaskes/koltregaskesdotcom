# notion-site-test Action Plan

**Created:** 2026-01-01
**Priority:** HIGH - User's new homepage, 2026 AI predictions launch
**Goal:** Fix broken site and redesign to match justoffbyone.com style

---

## Executive Summary

The site at https://koltregaskes.github.io/notion-site-test/ has critical issues that prevent a proper launch:

1. **Broken images/videos** - All media shows broken image placeholders
2. **Design mismatch** - Current 4-column grid doesn't match the desired minimal justoffbyone.com style
3. **Minor issues** - Wrong copyright year, inconsistent footer links

---

## Issue #1: Broken Images (CRITICAL)

### Root Cause
**Notion file URLs expire after approximately 1 hour.**

In `scripts/fetch-notion.mjs`, the code embeds Notion's signed AWS S3 URLs directly into the HTML:

```javascript
const thumbnailUrl = files.length > 0 ? files[0].url : "";
// These URLs look like: https://prod-files-secure.s3.us-west-2.amazonaws.com/...?X-Amz-Expires=3600
```

When the site builds:
1. Build fetches file URLs from Notion API ✅
2. URLs are valid at build time ✅
3. URLs embedded in HTML ✅
4. After ~1 hour, URLs expire ❌
5. Images show broken placeholders ❌

### Solution Options

#### Option A: Download Images During Build (Recommended)
**Effort:** Medium | **Reliability:** High

Modify `fetch-notion.mjs` to:
1. Download each image/video file from Notion
2. Save to `site/assets/` or `site/media/`
3. Reference local files in HTML instead of Notion URLs

**Pros:**
- Permanent URLs that never expire
- Faster page loads (no Notion redirect)
- Works offline
- Full control over image optimisation

**Cons:**
- Larger repository size
- Longer build times
- Need to handle deduplication

**Implementation:**
```javascript
// Add to fetch-notion.mjs
async function downloadAndSaveFile(url, filename) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const localPath = `site/media/${filename}`;
  await fs.writeFile(localPath, Buffer.from(buffer));
  return `/notion-site-test/media/${filename}`;
}
```

#### Option B: Use Drive URL Property
**Effort:** Low | **Reliability:** Medium

Use permanent URLs (Google Drive, Cloudinary, etc.) in the "Drive URL" property instead of Notion uploads.

**Pros:**
- No code changes needed
- Quick fix

**Cons:**
- Google Drive URLs require special handling
- Depends on external services
- Manual process for each image

#### Option C: Use External Image Host
**Effort:** Medium | **Reliability:** High

Upload images to Cloudinary/imgbb/GitHub directly and use those URLs.

**Recommended:** Option A (download during build)

---

## Issue #2: Design Mismatch

### Current Design
- 4-column responsive grid
- Dark cards with badges
- Content type filters (Articles, Images, Videos, Music)
- "Perplexity-inspired" aesthetic

### Desired Design (justoffbyone.com)
- Single-column layout
- Minimal, clean design
- Expandable post previews with:
  - Title
  - Brief excerpt
  - Date
  - Reading time
- Dark/light mode toggle (already have)
- Generous whitespace
- Serif/sans-serif typography mix

### Design Changes Required

#### Phase 1: Home Page Redesign
- [ ] Remove 4-column grid, use single-column list
- [ ] Remove content type filters
- [ ] Simplify card design to just: title, excerpt, date, reading time
- [ ] Add expand/collapse for post previews
- [ ] Increase whitespace and typography scale

#### Phase 2: Navigation
- [ ] Simplify header navigation (currently 7 links)
- [ ] Consider horizontal nav with fewer items:
  - Home
  - Posts
  - About
  - Newsletter

#### Phase 3: Typography
- [ ] Use serif font for headings
- [ ] Sans-serif for body text
- [ ] Larger base font size
- [ ] Better line height

#### Phase 4: Footer
- [ ] Simplify footer
- [ ] Fix link to koltregaskes.com (not justoffbyone.com)

---

## Issue #3: Minor Issues

### Copyright Year
**Current:** © 2025
**Should be:** © 2026

**Files to update:**
- `scripts/fetch-notion.mjs` - Multiple locations (lines 335, 469, 669, 815)

### Footer Social Link
**Current:** Website link points to https://justoffbyone.com
**Should be:** https://koltregaskes.com

**Files to update:**
- `scripts/fetch-notion.mjs` - Line 356-362

---

## Recommended Implementation Order

### Sprint 1: Fix Critical Issues (Launch Blocker)
**Target:** 1-2 days

1. [ ] Fix image download/caching in build script
2. [ ] Test with sample images in Notion
3. [ ] Verify images persist after 1 hour
4. [ ] Update copyright to 2026
5. [ ] Fix footer website link

### Sprint 2: Design Overhaul
**Target:** 2-3 days

1. [ ] Redesign home page to single-column layout
2. [ ] Update CSS for new typography
3. [ ] Simplify navigation
4. [ ] Add expandable post previews
5. [ ] Test dark/light modes

### Sprint 3: Content Preparation
**Target:** 1 day

1. [ ] Draft 2026 AI predictions article in Notion
2. [ ] Add any hero images
3. [ ] Set Publish toggle
4. [ ] Test full build and deploy

### Sprint 4: Launch
**Target:** Launch day

1. [ ] Final review of all pages
2. [ ] Manual deploy trigger
3. [ ] Verify live site
4. [ ] Share on social media

---

## Technical Implementation Details

### Image Download Solution (Sprint 1)

Add this to `scripts/fetch-notion.mjs`:

```javascript
import crypto from 'node:crypto';

// Download and cache images locally
async function downloadMedia(url, title) {
  if (!url) return '';

  try {
    // Create hash-based filename to avoid duplicates
    const hash = crypto.createHash('md5').update(url.split('?')[0]).digest('hex').slice(0, 8);
    const ext = url.match(/\.(jpg|jpeg|png|gif|webp|mp4|mov)/i)?.[1] || 'jpg';
    const filename = `${slugify(title)}-${hash}.${ext}`;
    const localPath = path.join('site', 'media', filename);

    // Create media directory
    await fs.mkdir(path.join('site', 'media'), { recursive: true });

    // Download file
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to download: ${url}`);
      return '';
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(localPath, buffer);

    console.log(`✓ Downloaded: ${filename}`);
    return `/notion-site-test/media/${filename}`;
  } catch (error) {
    console.warn(`Error downloading ${url}:`, error.message);
    return '';
  }
}
```

Then update the main processing loop to download images:

```javascript
// Replace lines 1216-1218 with:
const files = getFiles(page, "Upload");
let thumbnailUrl = '';
if (files.length > 0 && files[0].url) {
  thumbnailUrl = await downloadMedia(files[0].url, title);
}
```

### CSS Design Changes (Sprint 2)

Key CSS changes for justoffbyone.com style:

```css
/* Single column layout */
.content-grid {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 680px;
  margin: 0 auto;
}

/* Simplified card */
.content-card {
  border: none;
  background: transparent;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 2rem;
}

/* Typography */
:root {
  --font-serif: 'Georgia', 'Times New Roman', serif;
  --font-sans: 'Inter', -apple-system, sans-serif;
}

h1, h2, h3 {
  font-family: var(--font-serif);
}

body {
  font-family: var(--font-sans);
  font-size: 18px;
  line-height: 1.7;
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `scripts/fetch-notion.mjs` | Add image download, update year, fix footer link |
| `site/styles.css` | Complete redesign for minimal aesthetic |
| `.github/workflows/build.yml` | May need increased timeout for image downloads |

---

## Success Criteria

- [ ] All images display correctly 24+ hours after build
- [ ] Site matches justoffbyone.com aesthetic
- [ ] Copyright shows 2026
- [ ] 2026 AI predictions article is live
- [ ] Site loads fast (< 3s first paint)
- [ ] Dark/light mode works
- [ ] Mobile responsive

---

## Resources

- **Design inspiration:** https://justoffbyone.com/
- **Current site:** https://koltregaskes.github.io/notion-site-test/
- **Notion API docs:** https://developers.notion.com/
- **GitHub Actions:** Check `.github/workflows/` folder

---

## Questions for Kol

1. **Gallery pages (Images/Videos/Music):** Keep these or focus only on posts?
2. **Newsletter:** Keep the placeholder form or remove until integrated?
3. **Navigation:** Which links to keep? Suggest: Home, Posts, About, Newsletter
4. **Content type filters:** Remove entirely or move to Posts page?
5. **About page:** Current content is minimal - want to expand?

---

**Next Action:** Start Sprint 1 - Fix the image caching issue to unblock the launch.
