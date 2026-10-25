// goal A3 (Aryan). Real implementation polls the booking-site repo every 5s for newly merged PRs
// and publishes build.requested. See build-plan.md, Phase D.
import type { Ctx } from '@pact/core';

export async function startPolling(ctx: Ctx): Promise<void> {
  if (!process.env.GITHUB_TOKEN) return; // nothing to poll without a token; the agent still starts
  ctx.log.warn('GitHub polling not built yet: goal A3 (Aryan)');
}
