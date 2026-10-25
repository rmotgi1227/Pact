Write one Playwright spec per SOW line given, using only the ids in
`sowLineIds`.
- import { test, expect } from '@playwright/test'
- navigate to process.env.APP_URL (fallback http://app:3000)
- the search form's fields are found with `[data-testid^="field-"]`
  (assert the count is >= 1, fill every one of them), then click
  `search-submit`. Never assert exact field-<key> names, the SOW
  doesn't fix them
- use only these other data-testid values: search-form, results-grid,
  result-card, book-cta, booking-form, confirmation-banner,
  brand-switcher
- "first row of results": read `getBoundingClientRect().top` for every
  result-card, group the cards by that top value, and assert the
  smallest-top group has >= 2 cards. Never assert just that the page
  loaded
- if the line mentions tablet/responsive, assert at both 768x1024 and
  1024x768 viewports that results-grid's scrollWidth <= clientWidth,
  plus the first-row check above at each viewport
Strict JSON only, matching the schema: {"tests":[{"sowLineId":"...","source":"..."}]}.
No explanation, no markdown.
