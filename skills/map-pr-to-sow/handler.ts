// goal A3 (Aryan). See build-plan.md, Phase D.
import type { Skill } from '@pact/core';

export const handler: Skill<{ buildId: string }, void> = async () => {
  throw new Error('not built yet: goal A3 (Aryan)');
};
