import { test, expect } from '@playwright/test';

test('every required data-testid exists across the booking flow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('search-form')).toBeVisible();
  await expect(page.getByTestId('brand-switcher')).toBeVisible();
  const fieldCount = await page.locator('[data-testid^="field-"]').count();
  expect(fieldCount).toBeGreaterThanOrEqual(1);
  await expect(page.getByTestId('search-submit')).toBeVisible();

  await page.getByTestId('search-submit').click();
  await expect(page).toHaveURL(/\/results/);
  await expect(page.getByTestId('results-grid')).toBeVisible();
  await expect(page.getByTestId('result-card').first()).toBeVisible();
  await expect(page.getByTestId('book-cta').first()).toBeVisible();

  await page.getByTestId('book-cta').first().click();
  await expect(page).toHaveURL(/\/book/);
  await expect(page.getByTestId('booking-form')).toBeVisible();

  await page.getByLabel('Full name').fill('Dana Example');
  await page.getByLabel('Email').fill('dana@example.com');
  await page.getByTestId('booking-form').locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/\/confirm/);
  await expect(page.getByTestId('confirmation-banner')).toBeVisible();
});

test('health route answers 200 ok with no model/slot dependency', async ({ request }) => {
  const res = await request.get('/health');
  expect(res.status()).toBe(200);
  expect(await res.text()).toBe('ok');
});

test('brand switcher swaps the active brand without changing the page structure', async ({ page }) => {
  await page.goto('/');
  const switcher = page.getByTestId('brand-switcher');
  await expect(switcher.getByRole('button', { name: 'Hertz' })).toHaveAttribute('aria-pressed', 'true');

  await switcher.getByRole('button', { name: 'Dollar' }).click();
  await expect(switcher.getByRole('button', { name: 'Dollar' })).toHaveAttribute('aria-pressed', 'true');
  await expect(switcher.getByRole('button', { name: 'Hertz' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('html')).toHaveAttribute('data-brand', 'dollar');
  await expect(page.getByTestId('search-form')).toBeVisible();
});
