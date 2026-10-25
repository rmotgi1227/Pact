import { configDefaults, defineConfig } from 'vitest/config';

// Only the repo's own tests: skip agent worktrees under .claude/, the dashboard build output, and
// templates/booking-proto (its own project, own lockfile, own Playwright run via `pnpm test:e2e`).
export default defineConfig({
  test: { exclude: [...configDefaults.exclude, '.claude/**', 'dashboard/.next/**', 'templates/**'] },
});
