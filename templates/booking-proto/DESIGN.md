# Design

## Mood
Airport rental counter at 7am — strip lighting, a shared tablet propped on the desk, three different fleet logos that used to hang above three different counters now sharing one screen. Plain, legible, no personality borrowed from any one of the three brands it has to serve.

## Color strategy
Updated (second review round, Rishab): Committed, not Restrained — the first pass read as a wireframe. Chroma-0 structural neutrals (bg, surface, border, ink) still carry body text and borders, but each brand now gets one confident, saturated accent hue (~0.13-0.14C, not the original <0.06C) used for the hero band's CTA, badges, icons, silhouettes and the active brand-switcher state, plus a shared deep-navy "chrome" token for the hero band itself. Still no brand's accent or chrome matches that brand's real identity color (Hertz's real yellow/black has no presence here) — these stay generic placeholders, just louder ones.

Bg is still literal white (`oklch(1 0 0)`) for all surface/card content; the hero band is the one surface allowed a strong fill (`--chrome`, a near-black navy shared across all three brands) so the accent reads as "this brand" without tinting the whole page.

### Tokens (shared across all three themes)
```
--bg:            oklch(1.000 0.000 0)
--surface:       oklch(0.975 0.000 0)
--surface-sunken: oklch(0.955 0.004 260)   /* trust row */
--border:        oklch(0.880 0.000 0)
--ink:           oklch(0.180 0.000 0)   /* body text, ≥4.5:1 on bg/surface */
--ink-muted:     oklch(0.420 0.000 0)   /* ≥4.5:1 on bg, used only for secondary text, never placeholders */
--danger:        oklch(0.500 0.180 25)
--chrome:        oklch(0.180 0.015 255)  /* hero band fill, shared across brands */
--chrome-ink:    oklch(0.985 0 0)
```

### Per-brand accent (text-only brand names, no logos)
```
Hertz   --accent: oklch(0.480 0.130 185)   /* deep teal */
Dollar  --accent: oklch(0.460 0.140 265)   /* indigo */
Thrifty --accent: oklch(0.470 0.140 340)   /* plum/wine */
```
Each accent is a dark, saturated fill (L~0.46-0.48) chosen so white text sits at ≥4.5:1 on it — verified per theme in-browser via the brand switcher, not assumed from one. `--accent-tint` (8% alpha) tints the car-silhouette art and trust-row check badges without touching contrast-bearing text.

## Typography
System UI stack (no webfont dependency for a throwaway prototype template: `-apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`). One family, weight does the hierarchy work (600-700 for headings/CTA, 400 body). Fixed rem scale: hero h1 2-2.5rem (640px breakpoint), page h1 1.5rem, h2 1.125-1.25rem, body 1rem. `text-wrap: balance` on h1/h2.

## Layout
- Top bar: wordmark (`{brand} Rentals`, text-only, changes with the active brand so it never duplicates the hero headline), nav-ish anchor links, brand switcher.
- Home: a dark hero band (headline + subline) with the search panel as a white card overlapping its bottom edge, a trust row (3 value props), then a "Popular cars" teaser grid below the fold.
- `search-form`: single column, stacked fields, full-width on phone; a flex row with wrapping from tablet up (`flex-wrap`, 1D — not grid).
- `results-grid`: CSS grid, `repeat(auto-fit, minmax(240px, 1fr))`, 16-24px gap. This single rule is what satisfies "≥2 cards per row at 768×1024/1024×768, 1 column at 375px, 3-4 at desktop" — verified by measured container widths (240px min × 2 = 480px fits 768px easily; 1024px fits 4). Results page adds a count + sort-order header row above the grid.
- `result-card`: no nested cards, full border (not a side-stripe), consistent padding scale (12/16/24), an inline SVG car silhouette, spec "chips" (seats/transmission with small icons), and a **stacked** footer (price row, then a full-width CTA beneath it) — not a price+button row, which is what overflowed on narrow tablet-grid cards before this pass.
- `book-layout`: single column under 860px; a 1.4fr/1fr two-column grid (form + sticky trip-summary card) from 860px up.
- Touch targets ≥44px: `search-submit`, `book-cta`, nav/brand-switcher controls.

## Motion
Minimal and purposeful: 150ms ease-out-quart on card hover/focus elevation (`result-card`, `popular-card`) and route-level fade on navigation. All wrapped in `@media (prefers-reduced-motion: reduce)` → instant, no transition. No layout-property animation.

## Components
`BrandSwitcher`, `SearchForm`, `ResultsGrid` + `ResultCard`, `CarSilhouette`, `TrustRow`, `PopularCars`, `BookingForm`, `TripSummary`, `ConfirmationBanner`, `Footer` — each its own file under `app/components/`, theme consumed via a CSS-variable class on `<html>`/`<body>` set by the brand switcher (client component, `localStorage`-persisted), never a conditional render fork per brand.
