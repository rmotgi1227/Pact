import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3100',
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'pnpm start -p 3100',
        url: 'http://localhost:3100/health',
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
