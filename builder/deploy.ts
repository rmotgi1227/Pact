// goal S5 (Shreyas). Real implementation deploys a tested build to Vercel. See build-plan.md, Phase E.
import type { Skill } from '@pact/core';

const notBuilt = (): never => { throw new Error('not built yet: goal S5 (Shreyas)'); };

export const onBuildPassed: Skill<{ buildId: string }, void> = async () => notBuilt(); // prototypes only
export const onShareRequested: Skill<{ buildId: string }, void> = async () => notBuilt();
