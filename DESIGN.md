---
name: Jass Products
description: Authentic cold-pressed Ayurvedic formulations for Indian climate & hard water resilience
colors:
  primary: "#8b6d43"
  primary-dark: "#735835"
  accent-tan: "#9a7b4f"
  canvas: "#FAF9F6"
  canvas-warm: "#f7f5ef"
  surface-card: "#fbfbf8"
  border: "#d2c2ad"
  border-light: "#EAEAEA"
  text-heading: "#111111"
  text-body: "#2F3437"
  text-muted: "#787774"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 400
    lineHeight: 1.25
  body:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.75
  mono:
    fontFamily: "SF Mono, Menlo, monospace"
    fontSize: "0.75rem"
    letterSpacing: "0.12em"
rounded:
  sm: "6px"
  md: "12px"
  lg: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "12px 28px"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
  card-specimen:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: Jass Products

## Overview

**Creative North Star: "The Modern Ayurvedic Apothecary"**

Jass Products blends traditional Indian herbal medicine with contemporary editorial minimalism. Surfaces are calm, warm-monochromatic, and uncluttered. Content is delivered in document-style clarity with complete botanical ingredient disclosure rather than marketing hype.

Every visual decision respects the physical nature of cold-pressed oils, wild-harvested roots, and clay pots. Artificial neons, aggressive sales popups, and gradient glows are strictly banned.

**Key Characteristics:**
- Warm bone and sand canvas (`#FAF9F6`, `#f7f5ef`)
- Editorial serif headlines with tight tracking paired with neutral, highly readable body copy
- Earthy amber-gold primary action points (`#8b6d43`)
- Bento-grid specifications with precise 1px borders
- Respectful commerce: upfront INR pricing, clear COD terms, and PIN code delivery transparency

## Colors

Earthy, organic warm monochrome accented by deep medicinal botanical amber.

### Primary
- **Apothecary Amber-Gold** (`#8b6d43`): Primary call-to-action buttons, key category headers, and verified badges.
- **Deep Amber** (`#735835`): Active and hover state for interactive controls.

### Secondary
- **Warm Sandstone** (`#9a7b4f`): Secondary labels, step counters, and subtle iconography.
- **Herbal Laurel** (`#346538`): Semantic indicator for verified reviews, stock status, and botanical certifications.

### Neutral
- **Charcoal Ink** (`#111111`): Editorial titles, product names, and high-emphasis price tags.
- **Earth Umber** (`#2F3437`): Primary reading body text.
- **Muted Silt** (`#787774`): Meta labels, category breadcrumbs, secondary captions.
- **Warm Bone** (`#FAF9F6`): Base canvas tone across product surfaces.
- **Sunlit Parchment** (`#f7f5ef`): Sectional contrast background for ritual grids.
- **Structural Border** (`#EAEAEA` / `#d2c2ad`): 1px structural dividing lines.

## Typography

**Display Font:** Playfair Display, Georgia, serif  
**Body Font:** Helvetica Neue, Helvetica, Arial, sans-serif  
**Mono Font:** SF Mono, Menlo, monospace  

### Hierarchy
- **Display** (400 weight, clamp 2rem to 3.5rem, line-height 1.15): Hero section headings and product titles.
- **Headline** (400 weight, 1.75rem to 2.25rem, line-height 1.25): Section titles and bento headers.
- **Body** (400 weight, 15px/16px, line-height 1.75, max-width 65ch): Product descriptions, scientific explanations, and user reviews.
- **Label / Mono** (600 weight, 10px-12px, tracking 0.12em–0.2em, uppercase): Extraction specs, Latin binomial herb names, category indicators.

## Layout

- Desktop container constrained to `max-w-[1240px]` or `max-w-[1400px]` with generous vertical padding (`py-12` to `py-20`).
- Responsive grids: 12-column asymmetric hero splits on product pages, 2x3 bento spec tables, and clean card grids collapsing gracefully on mobile viewports (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).

## Elevation & Depth

Surfaces rely primarily on tonal layering and crisp 1px borders rather than heavy drop shadows. Cards sit flat on warm canvas surfaces with subtle micro-elevation on hover (`shadow-sm` transitioning to soft diffuse ambient shadow `rgba(0,0,0,0.06)`).

## Shapes

- **Interactive CTAs:** Full pill (`rounded-full`) or crisp structural rects (`rounded-md`, 6px).
- **Cards & Containers:** `rounded-xl` (12px) for specimen cards and `rounded-2xl` (24px) for prominent ritual blocks.
- **Borders:** Consistent 1px solid border (`#EAEAEA` on minimalist views, `#d2c2ad` on apothecary views).

## Components

### Buttons
- **Primary:** `#8b6d43` background, white text, uppercase wide tracking, full pill or 6px radius.
- **Secondary:** Transparent with 1px border (`#111111` or `#8b6d43`), responsive hover inversion.

### Badges & Tags
- Pill-shaped status chips (`text-[9px]`, uppercase tracking, font-bold) with semantic backgrounds (e.g. `#8b6d43` white text or `#EDF3EC` deep green text).

### Bento Cells
- 1px bordered containers (`#EAEAEA`), white or `#F7F6F3` interior, mono label above high-contrast value.
