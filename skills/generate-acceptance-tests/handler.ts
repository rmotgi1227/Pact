// goal S3 (Shreyas). See build-plan.md, Phase D.
import type { Skill } from '@pact/core';

export const handler: Skill<{ dealId: string; version: number }, void> = async () => {
  throw new Error('not built yet: goal S3 (Shreyas)');
};
