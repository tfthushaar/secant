# SECANT — Architecture Studio Website

**secant.in · Bengaluru · Est. 1999**

A digital presence for Secant Architects LLP — built as a luxury architectural experience that treats the browser as a drawing board.

---

## Design Direction

### Philosophy
The site deliberately avoids photography on the landing page. Instead, the hero is a live 3D architectural line drawing that rotates as you scroll — positioning SECANT as a firm that thinks in drawings, not renders.

### Visual Language
- **White background** — architectural drawing on paper
- **Raleway** (UI/body) — ultra-thin geometric sans that reads as architectural notation
- **EB Garamond** (display) — classical serif for titles and project names
- **Toon shading + edge detection** — 4-pass GPU rendering gives the 3D model a hand-drawn sketch quality with real directional shadow and crisp ink lines
- **No photography on homepage** — brand identity built entirely through geometry and typography

### Scroll Interaction
The 3D model is `position: fixed` and driven by page scroll progress. As content sections slide in from below, the camera orbits through 6 architectural viewpoints (front elevation → zoom-in → three-quarter right → aerial → three-quarter left → top-down plan). Camera snaps to target when at rest — zero flicker.

---

## Pages

### `/` — Homepage
- **Loader**: `SECANT` types in and backspaces before the page reveals (3.85s, black bg)
- **Hero**: Full-viewport SECANT wordmark over the live 3D model
- **StudioIntro** (scroll-driven, model always visible):
  - **Manifesto** — "Designing spaces that inspire, endure, and evolve."
  - **Stats** — 25+ years · 38 projects · 6 typologies · 3 partners
  - **Services** — Residential · Commercial · Institutional · Interiors · Sustainable
  - **Contact** — 535, 3rd Main, Rajajinagar 2nd Stage, Bangalore 560010

### `/work` — Project Categories
- CSS 3D coverflow with drag/scroll interaction
- 6 categories: Apartments · Commercial · Institutions · Interiors · Residences · Sketches

### `/work/[category]` — Category Gallery
- Full-viewport masonry grid, aspect-ratio-aware (images never cropped)
- Per-column scaling ensures no empty space
- Pile-up entrance animation, thumbnails → originals via IntersectionObserver

### `/work/render/[slug]` — Project Detail
- Two-column: metadata left (38%), full-quality image right (62%)
- Prev/Next navigation within category

### `/studio` — About

---

## 3D Rendering Pipeline

Four WebGL passes per frame:

| Pass | Material | Target | Purpose |
|------|----------|--------|---------|
| 1 | `MeshNormalMaterial` | normalTarget | Camera-space normals |
| 2 | Custom toon shader | colorTarget | 4-step directional shading |
| 3 | `MeshBasicMaterial` white | depthTarget | Depth texture |
| 4 | Composite GLSL | Screen | Toon + binary edge lines |

**Toon levels**: 1.00 → 0.88 → 0.74 → 0.60  
**Light**: upper-right-front `[0.7, 1.2, 0.8]`  
**Edges**: 8 neighbours at 1.5px, MAX operator, binary `step(0.5)` composite  
**Anti-flicker**: progress quantized to 0.1% steps, camera snaps within 0.001 world units

---

## Tech Stack

| Area | Technology |
|------|-----------|
| Framework | Next.js 15.3.3 (static export) |
| Animation | GSAP 3 + ScrollTrigger |
| Smooth scroll | Lenis |
| 3D / WebGL | Three.js + DRACO loader |
| Fonts | EB Garamond + Raleway via next/font |
| Styling | Tailwind CSS + inline styles |
| Hosting | Cloudflare Pages |

---

## Project Structure

```
app/
  page.tsx                        Homepage (fixed 3D + scrollable sections)
  layout.tsx                      Root layout, fonts, viewport meta
  globals.css                     Design tokens, animations, mobile rules
  work/
    page.tsx                      Coverflow category selector
    [category]/page.tsx           Masonry gallery
    render/[slug]/
      page.tsx                    Server component (generateStaticParams)
      RenderDetailClient.tsx      Client component (responsive layout)

components/
  Scene3D.tsx                     4-pass WebGL pipeline
  Loader.tsx                      SECANT typewriter animation
  Navigator.tsx                   Full-screen overlay menu
  Navigation.tsx                  sc · SECANT logo top-left
  Masonry.jsx                     Viewport-filling masonry, lazy loading
  CategoryDomeView.tsx            Category page wrapper
  sections/Hero.tsx               SECANT wordmark + scroll trigger
  sections/StudioIntro.tsx        4 landing page content sections

hooks/
  useIsMobile.ts                  Viewport breakpoint hook (768px)

lib/
  projects.ts                     All 42 project items + 6 categories

public/assets/
  base.glb                        3D model — flat-shaded bungalow, 120KB Draco
  web/small/                      Thumbnails (100-300KB)
  web/originals/[category]/       Full-quality originals for masonry + detail pages
```

---

## Image Strategy

| Context | Source | Size |
|---------|--------|------|
| Masonry initial | `web/small/` | ~150KB — instant display |
| Masonry upgrade | `web/originals/` | Full quality, lazy via IntersectionObserver |
| Detail page | `web/originals/` | Full quality, priority load |

---

## Mobile (≤768px)

- **Hero**: simplified, vertical text hidden
- **StudioIntro**: content pinned to bottom, model visible above, gradient backdrop
- **Work coverflow**: cards 500×316 → 240×152px
- **Detail page**: stacked — image top, details below
- **Masonry**: max 2 columns
- Custom cursor and grain overlay disabled on touch devices

---

## Deployment (Cloudflare Pages)

```bash
npm run build   # static export → /out
```

- Build command: `npm run build`
- Output: `out`
- Framework preset: None
- Cache: `/assets/*` immutable 1yr, `/*.html` no-store

---

## Content Summary

**SECANT Architects LLP** · Architecture · Interior Design · Sustainable Development  
535, 3rd Main, 'A' Block (FF), Rajajinagar 2nd Stage, Bangalore 560010  
[secant.in](https://secant.in)

**42 works across 6 categories:**  
Apartments (8) · Commercial (7) · Institutions (5) · Interiors (2) · Residences (7) · Sketches (13)
