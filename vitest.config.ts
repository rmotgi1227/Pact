import { configDefaults, defineConfig } from 'vitest/config';

// Only the repo's own tests: skip agent worktrees under .claude/ and the dashboard build output.
export default defineConfig({ test: { exclude: [...configDefaults.exclude, '.claude/**', 'dashboard/.next/**'] } });
