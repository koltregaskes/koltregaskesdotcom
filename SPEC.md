# Kol's Korner — Design Specification
## koltregaskes.com | Personal Brand Authority Hub

**Version:** 1.0
**Created:** 2026-01-29
**Status:** Specification

---

## 1. Vision

Kol's Korner is a personal brand authority hub — the canonical home for Kol Tregaskes across tech, AI, creative experiments, and thought leadership. Seen by 18,000+ followers, the design must convey **editorial authority** with **cinematic presence**.

**Design DNA:** The warm editorial restraint of justoffbyone.com fused with the cinematic dark drama of landonorris.com.

---

## 2. Visual Design Direction

### 2.1 Colour Palette

```css
:root {
  /* Backgrounds — warm dark, cinema not terminal */
  --bg-base:        #0C0B0F;
  --bg-surface:     #1A1820;
  --bg-elevated:    #252330;
  --bg-hero:        linear-gradient(180deg, #0C0B0F 0%, #141218 100%);

  /* Text — warm off-whites, never pure white */
  --text-primary:   #F5F0EB;
  --text-secondary: #9B9498;
  --text-muted:     #6B6370;

  /* Accent — warm gold (bridges Off by One warmth with cinema) */
  --accent:         #C8A87C;
  --accent-hover:   #D4B88E;
  --accent-muted:   rgba(200, 168, 124, 0.15);

  /* Borders */
  --border:         #2E2C34;
  --border-hover:   #3E3C44;

  /* Semantic */
  --success:        #4CAF79;
  --error:          #E05252;
  --info:           #5299E0;
}
```

**Dark mode is the ONLY mode.** No light mode toggle. The cinematic darkness is the brand.

### 2.2 Typography

The current site uses **Fira Sans**. The new design elevates typography with a serif/sans pairing inspired by justoffbyone.com's editorial feel:

```css
:root {
  --font-heading:  'Source Serif 4', 'Newsreader', 'Lora', Georgia, serif;
  --font-body:     'Fira Sans', 'Inter', -apple-system, sans-serif;
  --font-mono:     'Berkeley Mono', 'JetBrains Mono', monospace;
}
```

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| Hero display | Serif | clamp(2.5rem, 5vw, 4rem) | 700 | 1.15 |
| Page title (H1) | Serif | clamp(1.875rem, 3vw, 2.5rem) | 700 | 1.2 |
| Section heading (H2) | Serif | clamp(1.5rem, 2.5vw, 2rem) | 600 | 1.25 |
| Card title (H3) | Sans | 1.25rem | 600 | 1.4 |
| Body text | Sans | 1.125rem (18px) | 400 | 1.7 |
| Meta / captions | Sans | 0.875rem | 400 | 1.5 |
| Code | Mono | 0.875rem | 400 | 1.6 |

**Key principle:** Serif headings create editorial gravity. Sans body ensures readability. 18px body text with 1.7 line-height matches Off by One's generous reading experience.

### 2.3 Imagery & Photography

- **Hero images:** Full-bleed, cinematic aspect ratios (21:9 or full viewport)
- **Post thumbnails:** 16:9 with subtle warm colour grading overlay
- **AI-generated art:** Displayed at native aspect ratio with subtle frame
- **Profile photo:** High-quality, editorial-style portrait
- **Treatment:** Slight desaturation + warm tone shift to match the palette

### 2.4 Motion & Animation

| Element | Effect | Duration |
|---------|--------|----------|
| Page enter | Fade + slide up | 300ms ease-out |
| Card hover | translateY(-4px) + shadow expansion | 200ms ease-out |
| Hero text | Staggered word reveal on load | 600ms total |
| Navigation links | Underline grow from centre | 200ms ease |
| Images | Fade in on scroll (IntersectionObserver) | 400ms ease-out |
| Newsletter CTA | Subtle pulse on gold accent | 2s infinite |

Respect `prefers-reduced-motion`.

---

## 3. Page Layouts

### 3.1 Homepage

```
┌──────────────────────────────────────────────────────────┐
│  Nav: Logo (left) · Blog · Videos · Music · About (right)│
│  ─ sticky, glass blur on scroll ─                         │
├──────────────────────────────────────────────────────────┤
│                                                           │
│     ┌─────────────────────────────────────────┐          │
│     │  HERO — Full viewport                    │          │
│     │  "Kol Tregaskes" (serif, massive)        │          │
│     │  Tagline: Tech · AI · Creative           │          │
│     │  [Subscribe to Newsletter] gold CTA       │          │
│     │  Scroll indicator ↓                       │          │
│     └─────────────────────────────────────────┘          │
│                                                           │
│  ── Featured Post (full-width card, cinematic) ──        │
│                                                           │
│  ── Latest Posts Grid ──                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                    │
│  │ Article │ │ Video   │ │ Music   │                    │
│  │ Card    │ │ Card    │ │ Card    │                    │
│  └─────────┘ └─────────┘ └─────────┘                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                    │
│  │ Article │ │ Image   │ │ Article │                    │
│  └─────────┘ └─────────┘ └─────────┘                    │
│                                                           │
│  [View All Posts →]                                       │
│                                                           │
│  ── Newsletter Section (full-width, accent bg) ──        │
│  "Stay in the loop" + email input + subscribe btn        │
│                                                           │
│  ── Categories / Explore (icon cards) ──                 │
│  [ Articles ]  [ Videos ]  [ Images ]  [ Music ]         │
│                                                           │
│  ── Footer ──                                            │
│  Social links · RSS · © 2026                             │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Blog Index (Posts Listing)

```
┌──────────────────────────────────────────────────────────┐
│  Nav                                                      │
├──────────────────────────────────────────────────────────┤
│  Page Title: "Articles" (serif, H1)                      │
│  Filter pills: [All] [Tech] [AI] [Creative] [Personal]  │
│  Sort: Latest · Most Read                                │
│                                                           │
│  ┌────────────────────────────────────────────┐          │
│  │  Featured Post — wide card, hero image     │          │
│  │  Title · Excerpt · 5 min read · 14 Jan 26  │          │
│  └────────────────────────────────────────────┘          │
│                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│  │ Post     │ │ Post     │ │ Post     │                 │
│  │ Thumb    │ │ Thumb    │ │ Thumb    │                 │
│  │ Title    │ │ Title    │ │ Title    │                 │
│  │ Excerpt  │ │ Excerpt  │ │ Excerpt  │                 │
│  │ 3 min ·  │ │ 7 min ·  │ │ 4 min ·  │                 │
│  │ Tags     │ │ Tags     │ │ Tags     │                 │
│  └──────────┘ └──────────┘ └──────────┘                 │
│                                                           │
│  [Load More] or pagination                               │
│  Footer                                                  │
└──────────────────────────────────────────────────────────┘
```

### 3.3 Single Post

```
┌──────────────────────────────────────────────────────────┐
│  Nav                                                      │
├──────────────────────────────────────────────────────────┤
│  ← Back to Articles                                      │
│                                                           │
│  ┌─────────────────────────────────────────┐             │
│  │  Hero Image (full-bleed, 21:9)          │             │
│  └─────────────────────────────────────────┘             │
│                                                           │
│  ┌─── max-width: 720px, centred ──────────┐             │
│  │                                         │             │
│  │  Title (serif, H1, massive)             │             │
│  │  Meta: 14 Jan 2026 · 5 min read         │             │
│  │  Tags: [AI] [Tech] [Midjourney]          │             │
│  │                                         │             │
│  │  Article body (18px, 1.7 line-height)   │             │
│  │  - Prose with generous whitespace       │             │
│  │  - Code blocks in mono with syntax hl   │             │
│  │  - Images break out to wider width      │             │
│  │  - Pull quotes in serif italic          │             │
│  │                                         │             │
│  │  ── Share Bar ──                        │             │
│  │  [X] [LinkedIn] [Copy Link]             │             │
│  │                                         │             │
│  │  ── Author Card ──                      │             │
│  │  Photo · Name · Bio · Social links      │             │
│  │                                         │             │
│  │  ── Related Posts (3 cards) ──          │             │
│  │                                         │             │
│  │  ── Newsletter CTA ──                   │             │
│  └─────────────────────────────────────────┘             │
│  Footer                                                  │
└──────────────────────────────────────────────────────────┘
```

### 3.4 Videos Page

Same grid as blog but with video embed thumbnails. Click opens embedded player (YouTube/Cloudflare Stream) in modal or inline expansion.

### 3.5 Music Page

Grid of music cards with:
- Album art / waveform visualisation
- Play button (inline audio player)
- Track title, duration, source (Suno)
- Tags and description

### 3.6 About Page

```
┌──────────────────────────────────────────────────────────┐
│  Nav                                                      │
├──────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐                │
│  │  Hero: Editorial portrait photo      │                │
│  │  overlaid with "Kol Tregaskes"       │                │
│  └──────────────────────────────────────┘                │
│                                                           │
│  ┌─── max-width: 720px ────────────────┐                │
│  │  Bio (editorial prose, serif H2s)    │                │
│  │  - Tech background                  │                │
│  │  - AI passion / experiments          │                │
│  │  - Creative projects                 │                │
│  │  - Community & following             │                │
│  │                                      │                │
│  │  Social Links (large, branded icons) │                │
│  │  X · LinkedIn · GitHub · Instagram   │                │
│  │  YouTube · Bluesky · Threads         │                │
│  │                                      │                │
│  │  Projects Showcase                   │                │
│  │  - Axy Lusion → link                │                │
│  │  - AI Resource Hub → link            │                │
│  │                                      │                │
│  │  Newsletter CTA                      │                │
│  └──────────────────────────────────────┘                │
│  Footer                                                  │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Component List

| Component | Purpose | Notes |
|-----------|---------|-------|
| **NavBar** | Sticky top nav with glass blur | Logo, nav links, dark only |
| **HeroSection** | Full-viewport cinematic hero | Serif title, tagline, CTA |
| **PostCard** | Blog/content listing card | Thumbnail, title, excerpt, meta, tags |
| **FeaturedPostCard** | Wide variant for featured content | Full-width hero image treatment |
| **VideoCard** | Video content card | Thumbnail with play overlay |
| **MusicCard** | Audio content card | Waveform/art, inline player |
| **TagPill** | Clickable tag badge | Filter by category/tag |
| **ReadingTime** | "5 min read" indicator | Auto-calculated from word count |
| **ShareBar** | Social sharing buttons | X, LinkedIn, copy link |
| **AuthorCard** | Post-footer author bio | Photo, name, bio, social links |
| **RelatedPosts** | 3-card related content row | Algorithmic or tag-based |
| **NewsletterCTA** | Email signup section | Email input + gold subscribe button |
| **CategoryNav** | Filter pills for content types | All, Articles, Videos, Images, Music |
| **Footer** | Site footer | Social links, RSS, copyright |
| **SEOHead** | Meta tags component | OG tags, Twitter cards, structured data |
| **Breadcrumb** | Navigation path | Home > Blog > Post Title |
| **CodeBlock** | Syntax-highlighted code | Mono font, copy button |
| **PullQuote** | Editorial pull quote | Serif italic, accent border |
| **ImageGallery** | Multi-image display in posts | Lightbox on click |
| **TableOfContents** | Sticky sidebar for long posts | Auto-generated from headings |
| **SearchOverlay** | ⌘K search modal | Full-text search across all content |
| **SkeletonLoader** | Loading state | Shimmer effect matching layout |

---

## 5. Data Requirements

### 5.1 Content Schema (from Notion CMS)

```typescript
interface Post {
  id: string;
  title: string;
  slug: string;
  type: 'article' | 'video' | 'image' | 'music';
  excerpt: string;
  content: string;           // Rendered HTML/MDX
  coverImage: string;        // URL
  coverImageAlt: string;
  publishedAt: string;       // ISO date
  updatedAt: string;
  author: Author;
  tags: string[];
  category: string;
  readingTime: number;       // minutes
  wordCount: number;
  featured: boolean;
  draft: boolean;
  seo: SEOMeta;
  videoUrl?: string;         // YouTube/embed URL
  audioUrl?: string;         // Audio file URL
  musicSource?: string;      // e.g. "Suno"
  relatedPosts?: string[];   // Post IDs
}

interface SEOMeta {
  title: string;
  description: string;
  ogImage: string;
  canonicalUrl: string;
  keywords: string[];
  structuredData: object;    // JSON-LD
}

interface Author {
  name: string;
  bio: string;
  avatar: string;
  socialLinks: SocialLink[];
}
```

### 5.2 SEO Requirements

| Element | Implementation |
|---------|---------------|
| **Title tags** | `{Post Title} — Kol Tregaskes` (max 60 chars) |
| **Meta description** | Excerpt or custom (max 155 chars) |
| **OG tags** | og:title, og:description, og:image (1200×630), og:url, og:type |
| **Twitter cards** | summary_large_image with dedicated card images |
| **Canonical URLs** | Self-referencing canonical on every page |
| **Structured data** | Article (BlogPosting), Person, BreadcrumbList, WebSite |
| **Sitemap** | Auto-generated sitemap.xml |
| **RSS feed** | /feed.xml (already exists) |
| **Robots.txt** | Allow all, reference sitemap |
| **Performance** | Core Web Vitals: LCP <2.5s, FID <100ms, CLS <0.1 |
| **Alt text** | Required on all images |
| **Heading hierarchy** | Single H1 per page, logical H2-H6 nesting |
| **Internal linking** | Related posts, tag pages, category pages |
| **llms.txt** | Already exists — maintain for AI discoverability |

---

## 6. Tech Stack Recommendation

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Astro 5 | Static-first, excellent SEO, island architecture for interactivity |
| **Styling** | Tailwind CSS 4 | Utility-first, matches design system, fast iteration |
| **CMS** | Notion API (existing) | Already set up with fetch-notion.mjs script |
| **Hosting** | Cloudflare Pages | Free, global CDN, edge functions, analytics |
| **Domain** | koltregaskes.com | Migrate from notion-site-test |
| **Images** | Cloudflare Images or R2 | Automatic resizing, WebP/AVIF, lazy loading |
| **Search** | Pagefind (static) | Zero-JS search, built at compile time |
| **Analytics** | Cloudflare Web Analytics | Privacy-respecting, no cookie banner needed |
| **Newsletter** | Buttondown or ConvertKit | API integration for signup forms |
| **Fonts** | Google Fonts (Source Serif 4 + Fira Sans) | Self-hosted subset for performance |
| **Icons** | Lucide | Consistent, tree-shakeable |

### Build Pipeline

```
Notion → fetch-notion.mjs → Markdown/JSON → Astro Build → Cloudflare Pages
```

Automated via GitHub Actions on push + scheduled Notion sync (every 6 hours).

---

## 7. Inspiration References

| Site | What to Take |
|------|-------------|
| **justoffbyone.com** | Serif typography, generous whitespace, warm editorial feel, reading-first layout |
| **landonorris.com** | Cinematic dark backgrounds, full-bleed heroes, editorial photography treatment, scroll drama |
| **linear.app** | Precision spacing, component quality, dark mode execution |
| **vercel.com** | Clean hierarchy, developer credibility, monochrome with selective colour |

---

## 8. Migration Notes

The current site (notion-site-test) already has:
- ✅ Notion API integration
- ✅ Content categories (articles, videos, images, music)
- ✅ RSS feed
- ✅ llms.txt
- ✅ Dark mode toggle (remove — dark only in redesign)
- ✅ Tag system
- ✅ Basic admin page

**Migration path:**
1. Build new Astro site alongside existing
2. Port Notion fetch script
3. Implement new design system
4. Test with existing content
5. DNS cutover to koltregaskes.com
6. Redirect old URLs

---

*Specification by Claude (subagent: website-design-specs) — 2026-01-29*
