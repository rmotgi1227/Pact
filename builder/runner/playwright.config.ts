import { defineConfig } from '@playwright/test';

export default defineConfig({ testDir: './tests', timeout: 30_000, retries: 0, workers: 2,
  use: { baseURL: process.env.APP_URL ?? 'http://app:3000' } });
