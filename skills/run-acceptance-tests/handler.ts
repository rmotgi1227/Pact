// goal S4 (Shreyas). Plain code, no model. Coverage is computed on read from the tests' current status.
import type { Skill } from '@pact/core';

export const handler: Skill<{ buildId: string }, void> = async ({ buildId }, ctx) => {
  await ctx.builder.runTests(buildId, ctx);
};
