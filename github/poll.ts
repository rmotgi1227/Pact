// goal A3 (Aryan). Polls the booking-site repo every 5s for newly merged PRs and publishes build.requested.
import type { Ctx } from '@pact/core';

const DEAL_ID = 'hertz-demo'; // the one demo deal; every PR build belongs to it

export async function startPolling(ctx: Ctx, everyMs = 5_000): Promise<void> {
  if (!process.env.GITHUB_TOKEN || !process.env.BOOKING_REPO_SLUG) {
    return ctx.log.warn('GitHub polling off: set GITHUB_TOKEN and BOOKING_REPO_SLUG');
  }
  // Mark every already-merged PR seen first, so a restart doesn't rebuild history.
  for (const pr of await ctx.github.listMergedPrs(50)) ctx.store.markPrSeen(pr.number);
  ctx.log.info('GitHub polling started');
  setInterval(() => poll(ctx).catch((e) => ctx.log.error('poll failed', { err: String(e) })), everyMs);
}

export async function poll(ctx: Ctx) {
  for (const pr of await ctx.github.listMergedPrs()) {
    if (ctx.store.isPrSeen(pr.number)) continue;
    ctx.store.markPrSeen(pr.number); // before emitting, so a slow handler can't cause a double build
    const build = ctx.store.createBuild({ dealId: DEAL_ID, kind: 'pr', ref: pr.sha, prNumber: pr.number, author: pr.author });
    ctx.log.info(`PR #${pr.number} merged by ${pr.author}: building`, { buildId: build.id });
    await ctx.bus.emit('build.requested', { buildId: build.id });
  }
}
