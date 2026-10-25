import { test, expect, type Page } from '@playwright/test';

// Binding rule (build-plan.md Phase E): at 768x1024 and 1024x768, results-grid must not overflow
// horizontally and must lay out >=2 result-cards in its first row. Holds regardless of
// slots.showTabletLayout — that flag only toggles a density tweak, never the overflow/row-count rule.
const TABLET_SIZES = [
  { width: 768, height: 1024, label: '768x1024 portrait' },
  { width: 1024, height: 768, label: '1024x768 landscape' },
];

async function firstRowCardCount(page: Page): Promise<number> {
  const tops = await page.locator('[data-testid="result-card"]').evaluateAll((els) =>
    els.map((el) => Math.round(el.getBoundingClientRect().top)),
  );
  const smallestTop = Math.min(...tops);
  return tops.filter((t) => t === smallestTop).length;
}

for (const size of TABLET_SIZES) {
  test(`results-grid has no horizontal overflow and >=2 cards per row at ${size.label}`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.goto('/results');
    const grid = page.getByTestId('results-grid');
    await expect(grid.first()).toBeVisible();

    const [scrollWidth, clientWidth] = await grid.evaluate((el) => [el.scrollWidth, el.clientWidth]);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    expect(await firstRowCardCount(page)).toBeGreaterThanOrEqual(2);
  });
}

test('results-grid collapses to a single column at phone width (375px)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/results');
  const grid = page.getByTestId('results-grid');
  await expect(grid.first()).toBeVisible();

  const [scrollWidth, clientWidth] = await grid.evaluate((el) => [el.scrollWidth, el.clientWidth]);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  expect(await firstRowCardCount(page)).toBe(1);
});

test('results-grid shows 3-4 cards per row at desktop width (1440px)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/results');
  const grid = page.getByTestId('results-grid');
  await expect(grid.first()).toBeVisible();

  const perRow = await firstRowCardCount(page);
  expect(perRow).toBeGreaterThanOrEqual(3);
  expect(perRow).toBeLessThanOrEqual(4);
});
