// goal S4 (Shreyas). Real implementation builds a fresh Docker container per build and tests it.
// Honest stub: correct shape, no fake results. See build-plan.md, Phase D.
import type { Ctx, TestRun } from '@pact/core';

const notBuilt = (): never => { throw new Error('not built yet: goal S4 (Shreyas)'); };

export const builder = {
  enqueue(_buildId: string, _ctx: Ctx): void { notBuilt(); },
  async buildAndTest(_buildId: string, _ctx: Ctx): Promise<TestRun> { return notBuilt(); },
};
