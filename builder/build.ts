// goal S4 (Shreyas). See build-plan.md, Phase D.
import type { Skill } from '@pact/core';

export const onBuildRequested: Skill<{ buildId: string }, void> = async ({ buildId }, ctx) => {
  ctx.builder.enqueue(buildId, ctx);
};
