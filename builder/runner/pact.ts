// Checked helpers for generated acceptance specs (goal S3/S4). Baked into the runner image at /tests/pact.ts;
// specs mounted at /tests/tests import them as '../pact'. They implement build-plan.md's binding
// "Generated test prompt" rules exactly, so a small model only has to choose which checks a SOW line needs.
import { expect, type Page } from '@playwright/test';

export const APP = process.env.APP_URL ?? 'http://app:3000';
export type Size = [width: number, height: number];

export async function open(page: Page, path = '/') {
  await page.goto(new URL(path, APP).toString());
}

// Search form: every [data-testid^="field-"] wraps one input or select. Fill text and date inputs,
// leave selects on their default ("Any"), then submit and wait for the results grid.
export async function search(page: Page) {
  await open(page, '/');
  await expect(page.getByTestId('search-form')).toBeVisible();
  const fields = page.locator('[data-testid^="field-"]');
  expect(await fields.count()).toBeGreaterThanOrEqual(1);
  for (const input of await fields.locator('input').all()) {
    await input.fill((await input.getAttribute('type')) === 'date' ? '2027-03-01' : 'Boston');
  }
  await page.getByTestId('search-submit').click();
  await expect(page.getByTestId('results-grid')).toBeVisible();
}

// "First row of results": group result-cards by their top edge; the smallest-top group is the first row.
export async function firstRowCount(page: Page) {
  const tops = await page.getByTestId('result-card').evaluateAll((els) =>
    els.map((el) => Math.round(el.getBoundingClientRect().top)));
  expect(tops.length).toBeGreaterThan(0);
  const first = Math.min(...tops);
  return tops.filter((t) => t === first).length;
}

export async function expectFirstRowAtLeast(page: Page, n: number) {
  expect(await firstRowCount(page)).toBeGreaterThanOrEqual(n);
}

export async function expectNoHorizontalOverflow(page: Page, testId = 'results-grid') {
  const [scrollWidth, clientWidth] = await page.getByTestId(testId).first().evaluate((el) => [el.scrollWidth, el.clientWidth]);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}

// Runs `check` once per viewport size, e.g. [[768, 1024], [1024, 768]] for tablet.
export async function atViewports(page: Page, sizes: Size[], check: () => Promise<void>) {
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await check();
  }
}

// From results: book the first car and land on the confirmation banner.
export async function bookFirstCar(page: Page) {
  await page.getByTestId('book-cta').first().click();
  const form = page.getByTestId('booking-form');
  await expect(form).toBeVisible();
  for (const input of await form.locator('input').all()) {
    await input.fill((await input.getAttribute('type')) === 'email' ? 'dana@example.com' : 'Dana Example');
  }
  await form.locator('button[type="submit"]').click();
  await expect(page.getByTestId('confirmation-banner')).toBeVisible();
}

// Brand switcher: every listed brand can be selected and the page keeps the same structure.
export async function switchBrand(page: Page, name: string) {
  const button = page.getByTestId('brand-switcher').getByRole('button', { name });
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('search-form')).toBeVisible();
}
