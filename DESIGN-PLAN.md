# Kol's Korner — Design Refresh Plan

## The Problem

The site is clean and readable, but visually bland. It's missing personality, depth, and
visual rhythm. Everything reads "developer default" — solid backgrounds, flat cards,
single accent colour, no texture.

## What We Keep

- **Fira Sans** — the font is great, no change needed
- **Dark/light mode** — working well
- **Content-first layout** — posts remain the star
- **Red accent** — but we'll give it some friends

---

## Design Changes

### 1. Richer Colour Palette

**Current:** Red accent + neutral greys. That's it.

**Proposed:** Keep red as primary, add a warm secondary and a cool tertiary:

| Role | Light Mode | Dark Mode | Use |
|------|-----------|-----------|-----|
| Primary | `#dc2626` | `#f87171` | Links, CTAs, key accents |
| Secondary | `#f59e0b` (amber) | `#fbbf24` | Tags, badges, highlights |
| Tertiary | `#6366f1` (indigo) | `#818cf8` | Code blocks, secondary CTAs |
| Surface alt | `#f5f0eb` (warm cream) | `#262220` (warm dark) | Alternating sections |

This gives visual variety without being garish. Red stays dominant, amber adds warmth,
indigo adds depth.

### 2. Subtle Background Texture

Add a very faint noise/grain texture overlay to the page background. This is the single
biggest change for moving from "flat" to "crafted". Just 2-3% opacity.

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,..."); /* tiny noise pattern */
  pointer-events: none;
  z-index: 9999;
}
```

### 3. Cards with Depth

**Current:** Flat cards with 1px border, minimal shadow.

**Proposed:** Layered shadow system that feels tactile:

```css
.content-card {
  border: 1px solid var(--color-card-border);
  border-radius: 12px;
  box-shadow:
    0 1px 2px rgba(0,0,0,0.04),
    0 4px 8px rgba(0,0,0,0.04),
    0 12px 24px rgba(0,0,0,0.02);
  transition: transform 250ms ease, box-shadow 250ms ease;
}

.content-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 2px 4px rgba(0,0,0,0.04),
    0 8px 16px rgba(0,0,0,0.06),
    0 24px 48px rgba(0,0,0,0.04);
}
```

### 4. Hero/Header Area

Add a subtle gradient mesh behind the site title on the homepage. Not a full-bleed hero
image — just a soft, ambient gradient that gives the top of the page warmth:

```css
.page-header {
  background: radial-gradient(ellipse at 20% 50%, rgba(220,38,38,0.06) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.05) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 80%, rgba(245,158,11,0.04) 0%, transparent 50%);
}
```

### 5. Typography Hierarchy — More Drama

**Current:** Headings are different sizes but all look similar.

**Proposed:**
- Homepage title: Bump to 48px with letter-spacing: -0.03em (tighter, bolder)
- Post titles on cards: Add a subtle gradient text effect on hover
- Section dividers: Use a thin horizontal rule with a gradient instead of solid grey

### 6. Alternating Section Backgrounds

Break up the page with alternating background tones. Every other section gets the
"surface alt" colour. This creates visual rhythm as you scroll:

```css
.section:nth-child(even) {
  background-color: var(--color-surface-alt);
}
```

### 7. Tag Redesign

**Current:** Small pills with grey background.

**Proposed:** Colour-coded tags with category-specific colours (already partially in the
CSS as semantic colours — just need to actually use them more prominently). Make tags
slightly larger with a left-colour-bar accent:

```css
.tag {
  border-left: 3px solid var(--tag-colour);
  padding-left: 8px;
  background: var(--tag-bg);
}
```

### 8. Hover Micro-interactions

Add subtle life to the page:
- **Cards:** Already have translateY — keep it, add the deeper shadow
- **Nav links:** Animate an underline that slides in from the left instead of appearing
- **Tags:** Slight scale(1.05) on hover with colour shift
- **Images:** Keep the 1.05 zoom, add a subtle brightness increase

### 9. Featured Post Treatment

The newest or pinned post gets a distinct visual treatment on the homepage:
- Spans full width (instead of being in the 4-column grid)
- Larger image
- Subtle gradient border (red → amber)
- "Latest" badge

### 10. Footer Enhancement

**Current:** Minimal centred text.

**Proposed:** Add a subtle top-border gradient and a slightly richer layout:
- Gradient rule: `border-image: linear-gradient(to right, transparent, var(--color-primary), transparent) 1`
- Small "K" logo mark
- Social icons with hover colour transitions

---

## What This Does NOT Change

- No new JavaScript frameworks
- No layout overhaul — same grid, same structure
- No new fonts to load
- No heavy images or assets
- All CSS-only (except the noise texture SVG which is inline)
- Fully backwards compatible with the static build

## Priority Order

1. Background texture + layered card shadows (biggest visual impact, smallest code change)
2. Expanded colour palette (secondary + tertiary colours)
3. Hero gradient mesh on homepage
4. Alternating section backgrounds
5. Typography drama (bigger homepage title, gradient rules)
6. Hover micro-interactions (nav underline, tag scale)
7. Featured post treatment
8. Tag redesign
9. Footer enhancement
