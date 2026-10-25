// goal R4 (Rishab). See build-plan.md, Phase E.
import type { Skill } from '@pact/core';

export const handler: Skill<{ dealId: string; version: number }, void> = async () => {
  throw new Error('not built yet: goal R4 (Rishab)');
};
