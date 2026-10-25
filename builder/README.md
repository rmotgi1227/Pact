# builder/ (goals S4, S5, Shreyas)
- `build.ts`: one fresh container per build. It also holds `onBuildRequested`, `buildAndTest` and `testRef`.
- `Dockerfile.base` and `Dockerfile.app`.
- `runner/`: the Playwright test-runner image.
- `deploy.ts`: Vercel.

See build-plan.md, Phases D and E.
