# Prompt 13: koltregaskes.com — Personal Brand Authority Hub

**Target:** Google Gemini 3 Deep Think (free tier)
**Purpose:** Elevate the personal website homepage design beyond its current justoffbyone.com inspiration, refine the editorial aesthetic, and ensure the news page, content pipeline, and deployment are production-ready
**Created:** 2026-02-19
**Part of:** Workspace 2.0 — Website Management Hub

---

## 1. `<role>` - Define Identity and Expertise

You are a senior web designer and developer specialising in editorial personal brand websites with deep expertise in:
- **Editorial web design** — luxury editorial layouts inspired by long-form journalism sites, with serif/sans typography pairing, generous whitespace, and cinematic imagery
- **Static site generators** — Node.js-based build pipelines that compile markdown + YAML frontmatter into production HTML
- **Dark-mode editorial aesthetics** — warm dark palettes (not cold terminal black) with gold/amber accents and off-white text
- **Typography systems** — pairing serif headings with sans body text for editorial authority, using `clamp()` for fluid scaling
- **Homepage design** — creating distinctive, memorable landing pages that establish personal brand identity
- **Content management** — Notion-to-markdown pipelines, YAML frontmatter, automated builds
- **News page systems** — static JSON-based article feeds with client-side filtering and rendering
- **SEO & performance** — semantic HTML, Open Graph, structured data, lazy loading, critical CSS
- **GitHub Actions CI/CD** — automated hourly/daily builds and deployments

You produce production-ready HTML, CSS, and JavaScript. Your design sense leans toward editorial restraint — every element earns its place.

---

## 2. `<constraints>` - Hard Requirements

### Technical Stack (Existing)
- **Build system:** Node.js — `build.mjs` (1,406 lines) compiles markdown to static HTML
- **Content source:** Markdown files with YAML frontmatter in `content/` directory
- **Notion integration:** Content can be sourced from Notion via `fetch-notion.mjs`
- **News digests:** Pre-compiled markdown in `news-digests/` directory
- **Deployment:** GitHub Actions (hourly builds) → GitHub Pages or Vercel
- **No framework:** Pure static HTML output, no React/Vue/Angular at runtime
- **Package manager:** npm (package.json exists)

### Design Tokens (Current Specification)
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

  /* Accent — warm gold */
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

### Typography (Current Specification)
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

### Absolute Rules
1. **Dark mode only** — no light mode. The cinematic darkness IS the brand.
2. **Warm palette** — backgrounds are warm dark (#0C0B0F), not cold (#0a0a0a). Text is warm off-white (#F5F0EB), never pure white.
3. **Gold accent** — #C8A87C throughout. No other accent colours.
4. **Serif headings, sans body** — this pairing is locked in. Source Serif 4 for editorial gravity.
5. **18px body text, 1.7 line-height** — generous reading experience, matching Off by One's feel.
6. **UK English** throughout all copy and code comments.
7. **Accessible** — WCAG 2.1 AA. Respect `prefers-reduced-motion`.
8. **Fast** — no unnecessary JS. Static HTML. Lazy load images. Critical CSS.

---

## 3. `<architecture>` - System Design

### Current Build Pipeline
```
Source:
  content/*.md (articles with YAML frontmatter)
  news-digests/*.md (daily AI news)
  Notion API (optional — fetch-notion.mjs)
       ↓
  build.mjs (1,406 lines)
    - Reads all markdown files
    - Parses YAML frontmatter
    - Converts markdown → HTML
    - Generates page HTML from templates
    - Outputs static files to site/
       ↓
  site/ (static output)
    - index.html (homepage)
    - posts/*.html (individual articles)
    - news/*.html (news digests)
    - assets/ (CSS, JS, images)
       ↓
  GitHub Actions (hourly cron)
    - Runs build.mjs
    - Deploys to hosting
```

### Design Inspiration
The site's specification references two inspiration sources:
1. **justoffbyone.com** — editorial warmth, serif typography, generous whitespace, warm dark tones
2. **landonorris.com** — cinematic hero imagery, dramatic full-bleed sections, modern personal branding

**The owner's feedback:** "I love the font. The look is decent. Still not quite confident, still not quite happy with the design, particularly the front page. Maybe we just need to depart away from that third-party website."

**Your mission:** Keep the fonts and warm editorial aesthetic but create a **distinctive homepage** that doesn't feel derivative. The homepage should feel uniquely Kol's — not a clone of justoffbyone.com.

### Homepage Layout (Current Spec — Rethink This)
```
Current planned layout:
  Hero (full viewport) → Featured Post → Latest Posts Grid → Newsletter CTA → Categories → Footer

Issues to address:
  - Too similar to justoffbyone.com structure
  - Hero section needs more personality
  - Featured post section feels generic
  - Categories section may not be needed
```

### Navigation
```
Nav: Logo (left) · Blog · Videos · Music · About (right)
     Sticky, glass blur on scroll
     Mobile: hamburger menu
```

### Content Types
```
Articles:   Long-form tech/AI writing (markdown)
Videos:     YouTube embeds + commentary
Music:      AI-generated music showcases (links to Suno/Spotify)
News:       Daily AI news digests (automated from LLATOS)
```

---

## 4. `<schema>` - Data Structures

### Article Frontmatter (Existing)
```yaml
---
title: "Building with AI Agents: Lessons from the Trenches"
date: 2026-02-15
category: tech
tags: [ai, agents, automation]
excerpt: "What I learned from building a multi-agent workspace..."
featured: true
image: /assets/images/ai-agents-hero.webp
readTime: 7
---
```

### News Digest (Existing)
```yaml
---
title: "AI News Digest — 10 January 2026"
date: 2026-01-10
type: news-digest
---
```

### Site Configuration (build.mjs)
```javascript
const config = {
    siteName: "Kol Tregaskes",
    siteUrl: "https://koltregaskes.com",
    description: "Tech · AI · Creative",
    social: {
        x: "https://x.com/kaboramedia",
        youtube: "https://youtube.com/@koltregaskes",
        instagram: "https://instagram.com/koltregaskes",
        github: "https://github.com/koltregaskes",
        linkedin: "https://linkedin.com/in/koltregaskes",
        substack: "https://koltregaskes.substack.com"
    }
};
```

---

## 5. `<existing-code>` - Current Implementation

### Homepage Structure (Current from build.mjs)
The build script generates the homepage with these sections:
1. **Header** — Logo + navigation + social icons
2. **Hero** — Name, tagline, CTA
3. **Featured post** — Latest featured article, full-width
4. **Recent posts** — Grid of 6 latest posts
5. **Newsletter CTA** — Email signup section
6. **Footer** — Social links, copyright, "Design inspired by justoffbyone.com" credit

### Reusable Functions (build.mjs)
```javascript
getHeaderHTML(basePath)   // Generates nav with logo, links, social icons
getFooterHTML()           // Generates footer with social, copyright, credits
```

### CSS Variables (Currently Implemented)
```css
:root {
  --bg-base: #0C0B0F;
  --text-primary: #F5F0EB;
  --accent: #C8A87C;
  --font-heading: 'Source Serif 4', Georgia, serif;
  --font-body: 'Fira Sans', sans-serif;
  --font-mono: 'Berkeley Mono', monospace;
}
```

---

## 6. `<design-system>` - Visual Language

### The Problem to Solve
The homepage currently follows justoffbyone.com too closely. The owner loves the **fonts** and **warm editorial feel** but wants the homepage to feel **distinctively his own**.

### Design Direction: "Editorial Command Centre"
Instead of a standard blog homepage, think of it as a **personal brand command centre** — Kol is someone who builds AI agent systems, creates digital art, makes music, writes about tech, and trades. The homepage should reflect this breadth.

**Key differentiators from justoffbyone.com:**
1. **Multi-format content showcase** — not just articles. Videos, images, music, and news all appear on the homepage.
2. **Personal presence** — Kol's identity is front and centre. A cinematic hero that says "this is a person who builds things."
3. **Activity indicators** — subtle signals that this site is alive (latest news timestamp, recent activity, "currently working on" widget).
4. **Cross-site connections** — links to Axy Lusion (art), Synthetic Thoughts (AI blog), AI Resource Hub (models).

### Proposed Homepage Redesign
```
┌──────────────────────────────────────────────────────────┐
│  Nav: Logo (left) · Blog · News · Projects · About (right)│
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  HERO — Cinematic, NOT full viewport (70vh max)      │ │
│  │                                                       │ │
│  │  "Kol Tregaskes"  (Source Serif 4, massive)          │ │
│  │                                                       │ │
│  │  Building autonomous AI systems.                      │ │
│  │  Creating digital art. Writing about what's next.     │ │
│  │                                                       │ │
│  │  [Latest Article →]     [Subscribe]                   │ │
│  │                                                       │ │
│  │  ── Subtle activity bar: "Last published 2h ago" ──  │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ── "What's New" — Mixed content stream ──              │
│  2-column asymmetric layout:                             │
│  ┌───────────────────────┐ ┌──────────────────┐         │
│  │  Featured Article      │ │  Latest Video    │         │
│  │  (large card, hero img)│ │  (YouTube embed) │         │
│  │                        │ ├──────────────────┤         │
│  │                        │ │  Latest Music    │         │
│  │                        │ │  (Suno embed)    │         │
│  └───────────────────────┘ └──────────────────┘         │
│                                                           │
│  ── Latest Articles ──                                   │
│  3-column grid of recent posts                           │
│  [View All Articles →]                                   │
│                                                           │
│  ── AI News Ticker ──                                    │
│  Horizontal scroll of latest AI news headlines           │
│  Updated daily from LLATOS                               │
│  [Read Full News Digest →]                               │
│                                                           │
│  ── Connected Projects ──                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │Axy Lusion│ │Synthetic │ │AI Resource│                │
│  │AI Art    │ │Thoughts  │ │Hub       │                │
│  │→ visit   │ │→ visit   │ │→ visit   │                │
│  └──────────┘ └──────────┘ └──────────┘                │
│                                                           │
│  ── Newsletter ──                                        │
│  "Stay in the loop" + email input + subscribe            │
│  Warm accent background strip                            │
│                                                           │
│  ── Footer ──                                            │
│  Social links · RSS · © 2026 Kol Tregaskes              │
└──────────────────────────────────────────────────────────┘
```

### Animation & Motion
| Element | Effect | Duration |
|---------|--------|----------|
| Page enter | Fade + slide up | 300ms ease-out |
| Card hover | translateY(-4px) + shadow expansion | 200ms ease-out |
| Hero text | Staggered word reveal on load | 600ms total |
| Nav links | Underline grow from centre | 200ms ease |
| Images | Fade in on scroll (IntersectionObserver) | 400ms ease-out |
| Newsletter CTA | Subtle pulse on gold accent | 2s infinite |
| News ticker | Smooth horizontal auto-scroll | Continuous, pausable |

Respect `prefers-reduced-motion` for all animations.

### Glassmorphism Navigation
```css
.nav-sticky {
    background: rgba(12, 11, 15, 0.8);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
}
```

---

## 7. `<task>` - Deliverables

### Deliverable 1: Homepage Redesign
Produce a complete redesigned homepage that departs from justoffbyone.com while keeping the editorial warmth:
1. **index.html template** (or the `generateHomepage()` function in build.mjs) — full HTML structure
2. **Hero section** — cinematic but not full-viewport. 70vh max. Personal presence with activity indicator.
3. **"What's New" section** — asymmetric 2-column layout mixing articles, videos, and music
4. **Latest articles grid** — 3-column, card-based
5. **AI News ticker** — horizontal scrolling headlines from daily digests
6. **Connected Projects section** — cards linking to Axy Lusion, Synthetic Thoughts, AI Resource Hub
7. **Newsletter CTA** — warm accent background strip with email input
8. **CSS** — all homepage-specific styles using existing design tokens

### Deliverable 2: News Page Enhancement
The site already has news digests. Enhance the news page:
1. **news/index.html template** — listing page for all news digests
2. **Filter by month/topic** — client-side filtering
3. **Card design** — consistent with article cards but with "news" visual treatment (maybe a coloured left border)
4. **Auto-generated** — build.mjs already processes news-digests/ folder. Ensure output is clean.

### Deliverable 3: Shared News Architecture
Document how the news page pattern can be reused across Axy Lusion (filtered for creative AI) and koltregaskes.com (broader AI news):
1. **Shared news data format** — JSON schema that both sites consume
2. **Filter configuration** — how each site specifies which categories to show
3. **Shared rendering logic** — DRY JavaScript for card rendering, filtering, pagination
4. **LLATOS integration point** — where the news hub agent outputs data that both sites consume

### Deliverable 4: Build Pipeline Updates
Update build.mjs (or document changes needed) to support:
1. **Homepage content mixing** — pulling latest article, video, music, and news for the "What's New" section
2. **News ticker data** — generating a `latest-headlines.json` for the ticker component
3. **Connected projects** — configurable list of external project links

### Deliverable 5: Mobile Responsive Design
Provide complete responsive CSS for all new components:
1. **Mobile (< 640px):** Single column, stacked layout, no news ticker (show as list instead)
2. **Tablet (640px–1024px):** 2-column grid, condensed hero
3. **Desktop (> 1024px):** Full layout as designed above

---

## Self-Verification Checklist

Before submitting, verify every item:

### Homepage Design
- [ ] Homepage does NOT look like a clone of justoffbyone.com
- [ ] Hero section has personal presence and activity indicator
- [ ] "What's New" section shows mixed content (articles + videos + music)
- [ ] Latest articles grid displays correctly (3 columns desktop, responsive)
- [ ] AI News ticker scrolls smoothly and pauses on hover
- [ ] Connected Projects section links to Axy Lusion, Synthetic Thoughts, AI Resource Hub
- [ ] Newsletter CTA has warm accent styling
- [ ] Footer includes social links and copyright

### Typography & Colour
- [ ] Source Serif 4 used for all headings
- [ ] Fira Sans used for body text at 18px / 1.7 line-height
- [ ] Berkeley Mono used for code/meta text
- [ ] Gold accent (#C8A87C) used consistently — no other accent colours
- [ ] Backgrounds are warm dark (#0C0B0F), not cold black
- [ ] Text is warm off-white (#F5F0EB), never pure white
- [ ] All colours reference CSS custom properties, no hardcoded values

### Responsive & Accessible
- [ ] Mobile layout works at 320px width
- [ ] Tablet layout works at 768px width
- [ ] `prefers-reduced-motion` respected
- [ ] All interactive elements keyboard-accessible
- [ ] Images have alt text
- [ ] Colour contrast meets WCAG 2.1 AA

### Build & Deploy
- [ ] Changes integrate with existing build.mjs pipeline
- [ ] No new build tools or dependencies required (unless clearly justified)
- [ ] News page data format documented
- [ ] Shared news architecture documented for cross-site reuse
- [ ] GitHub Actions hourly build continues to work

### Distinctiveness
- [ ] Homepage feels distinctively "Kol's" — not generic, not derivative
- [ ] Multi-format content (articles, videos, music, news, art) represented
- [ ] Connected projects showcase the breadth of Kol's work
- [ ] Activity indicators give the site a "living" feel
