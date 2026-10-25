# Product

## Register

product

## Users
Two audiences, same screens: (1) a car-rental customer on a phone or an airport-counter tablet, searching and booking a car; (2) the Pact demo audience (sales, judges, Dana-the-client-stand-in) opening a shareable link to see "their" booking site actually running. There is no real backend — this is a prototype fed by local fixture data, built fresh per SOW and reviewed, not a production storefront.

## Product Purpose
A small, real (not mocked-on-screen) booking flow — search, results, book, confirm — that Pact's `generate-prototype` skill fills from SOW copy and ships as a working, deployable Next.js app. It proves the SOW's language translated into an app a stakeholder can click through on any device, including the counter-staff tablets called out in the SOW (§"tablet is in scope"). Success = every data-testid present, the tablet grid never overflows and shows ≥2 cards/row, and the same codebase re-themes across three brands with no code change.

## Brand Personality
Neutral, utilitarian, confidence-without-flash: a fleet-rental counter tool, not a consumer lifestyle brand. Three words: plain, sturdy, legible. It must stay brand-agnostic (generic palettes only, text-only brand names, no logos) since it stands in for three real brands without representing any of them.

## Anti-references
No consumer travel-app cliché (hero photography, gradient CTAs, playful illustration) — this is a fleet operations tool used at a counter under fluorescent light, often on a shared tablet. No warm cream/sand "AI-default" body background. No brand-colored chrome since the palette must stay generic across brand switches.

## Design Principles
- Static JSX, dynamic copy: every testid and the grid's structure are fixed in markup; only text/labels come from `slots.json`. The UI must never depend on the model getting markup right.
- Tablet is a first-class breakpoint, not an afterthought squeezed between phone and desktop — the SOW calls it out by name.
- One component tree, three palettes: brand switching is a token swap, never a conditional render fork.
- Legible under glare: counter tablets are used all shift, so contrast and tap targets are tuned for a bright, busy room, not a dim screen at a desk.

## Accessibility & Inclusion
WCAG AA contrast (≥4.5:1 body, ≥3:1 large text) across all three brand palettes. Touch targets ≥44px (counter staff use tablets, not just mice). Reduced-motion alternative for any transition. No color-only state signaling (brand switcher and form states also carry text/shape).
