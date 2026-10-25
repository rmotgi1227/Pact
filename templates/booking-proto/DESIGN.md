# Design

## Mood
Airport rental counter at 7am — strip lighting, a shared tablet propped on the desk, three different fleet logos that used to hang above three different counters now sharing one screen. Plain, legible, no personality borrowed from any one of the three brands it has to serve.

## Color strategy
Restrained. Chroma-0 structural neutrals (bg, surface, border, ink) carry the whole UI; each brand swaps one low-chroma accent hue (<0.06C) for focus rings, the active nav state and the primary CTA. No brand's accent is close to that brand's real identity color — these are placeholders, not the real brands.

Bg is literal white (`oklch(1 0 0)`) in all three themes — the "mood" here is operational neutrality, not environment, so warmth stays out of the surface per the restrained-strategy rule. Brand voice lives only in the accent hue and the brand name in the switcher.

### Tokens (shared across all three themes)
```
--bg:        oklch(1.000 0.000 0)
--surface:   oklch(0.975 0.000 0)
--border:    oklch(0.880 0.000 0)
--ink:       oklch(0.180 0.000 0)   /* body text, ≥4.5:1 on bg/surface */
--ink-muted: oklch(0.420 0.000 0)   /* ≥4.5:1 on bg, used only for secondary text, never placeholders */
--danger:    oklch(0.500 0.180 25)
```

### Per-brand accent (text-only brand names, no logos)
```
Hertz   --accent: oklch(0.550 0.070 110)   /* olive-gray */
Dollar  --accent: oklch(0.550 0.070 250)   /* slate-blue-gray */
Thrifty --accent: oklch(0.550 0.070 330)   /* plum-gray */
```
Accent is used at AA-safe lightness against white (contrast ≥4.5:1 for accent-on-white text, ≥3:1 for the 44px-min CTA fill with white label) — verified per theme, not assumed from one.

## Typography
System UI stack (no webfont dependency for a throwaway prototype template: `-apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`). One family, weight does the hierarchy work (600 for headings/CTA, 400 body). Heading scale: 1.75rem (h1) / 1.25rem (h2) / 1rem (body), `clamp()` not needed at this scale — well under the 6rem ceiling. `text-wrap: balance` on h1/h2.

## Layout
- `search-form`: single column, stacked fields, full-width on phone; a flex row with wrapping from tablet up (`flex-wrap`, 1D — not grid).
- `results-grid`: CSS grid, `repeat(auto-fit, minmax(240px, 1fr))`, 16-24px gap. This single rule is what satisfies "≥2 cards per row at 768×1024/1024×768, 1 column at 375px, 3-4 at desktop" — verified by measured container widths (240px min × 2 = 480px fits 768px easily; 1024px fits 4).
- `result-card`: no nested cards, full border (not a side-stripe), consistent padding scale (12/16/24).
- Touch targets ≥44px: `search-submit`, `book-cta`, nav/brand-switcher controls.

## Motion
Minimal and purposeful: 150ms ease-out-quart on card hover/focus elevation and route-level fade on navigation. All wrapped in `@media (prefers-reduced-motion: reduce)` → instant, no transition. No layout-property animation.

## Components
`BrandSwitcher`, `SearchForm`, `ResultsGrid` + `ResultCard`, `BookingForm`, `ConfirmationBanner` — each its own file under `app/components/`, theme consumed via a CSS-variable class on `<html>`/`<body>` set by the brand switcher (client component, `localStorage`-persisted), never a conditional render fork per brand.
