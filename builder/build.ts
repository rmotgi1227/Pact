// goal S4 (Shreyas). One fresh container per build, on its own internal network. See build-plan.md, Phase D.
import type { Ctx, Skill, TestRun } from '@pact/core';
import { must } from '@pact/core';
import { ops } from './ops.js';

export { buildDir, net } from './ops.js';
const noRun = (buildId: string): TestRun => ({ id: `run_none_${buildId}`, buildId, at: Date.now(), results: [] });

let busy = false;
const queue: string[] = []; // buildIds waiting their turn; drained as each build finishes

// Registered on 'build.requested' by skills/index.ts.
export const onBuildRequested: Skill<{ buildId: string }, void> = async ({ buildId }, ctx) => {
  ctx.builder.enqueue(buildId, ctx);
};

export function enqueue(buildId: string, ctx: Ctx) {
  // Redelivery guard: only a queued build that isn't already waiting gets built.
  if (ctx.store.getBuild(buildId)?.status !== 'queued' || queue.includes(buildId)) return;
  if (busy) { queue.push(buildId); return; }
  busy = true;
  run(buildId, ctx).catch((e) => ctx.log.error('build failed', { buildId, err: String(e) }));
}

// Resolves with the build's stored TestRun once build.passed/build.failed fires for it.
// A build that failed before any test ran has no TestRun: that counts as every test failing.
export const waitForResult = (buildId: string, ctx: Ctx) => new Promise<TestRun>((done) => {
  const stop = ctx.bus.listen(({ topic, payload }) => {
    if (payload?.buildId !== buildId || (topic !== 'build.passed' && topic !== 'build.failed')) return;
    stop();
    done(ctx.store.latestTestRun(buildId) ?? noRun(buildId));
  });
});

// Used by triage-ticket: fire a build and await its one real outcome.
export function buildAndTest(buildId: string, ctx: Ctx): Promise<TestRun> {
  const result = waitForResult(buildId, ctx);
  enqueue(buildId, ctx);
  return result;
}

// Reuse the build for this commit if one exists (e.g. the poll already built the merged regression),
// wait for it if it's still running, else start one.
export async function testRef(dealId: string, sha: string, ctx: Ctx): Promise<TestRun> {
  const existing = ctx.store.listBuilds().filter((b) => b.ref === sha && b.kind !== 'prototype').at(-1);
  if (existing?.status === 'passed' || existing?.status === 'failed')
    return ctx.store.latestTestRun(existing.id) ?? noRun(existing.id);
  if (existing) return waitForResult(existing.id, ctx);
  return buildAndTest(ctx.store.createBuild({ dealId, kind: 'main', ref: sha }).id, ctx);
}

async function run(buildId: string, ctx: Ctx) {
  const build = must(ctx.store.getBuild(buildId), `build ${buildId}`);
  try {
    ctx.store.updateBuild(buildId, { status: 'building' });
    const t0 = Date.now();
    const { srcDir } = await ops.up(build);
    ctx.store.updateBuild(buildId, { srcDir });
    ctx.log.info('container ready', { buildId, seconds: Math.round((Date.now() - t0) / 1000) });

    ctx.store.updateBuild(buildId, { status: 'ready' });
    // Don't hold the builder while this build's tests (and, for a prototype, Qwen3-Coder's rounds) run:
    // the next queued build (e.g. a merged engineering PR) starts right away in its own container.
    void ctx.bus.emit('build.ready', { buildId: build.id });
  } catch (err) {
    ctx.store.updateBuild(buildId, { status: 'failed' });
    ctx.store.put('buildError', buildId, { msg: String((err as Error).message ?? err).slice(-2000) }); // for build-features
    await teardown(buildId);
    ctx.log.error('build failed', { buildId, err: String(err) });
    await ctx.bus.emit('build.failed', { buildId }); // so anyone awaiting this build (triage) gets an answer
  } finally {
    busy = false;
    const next = queue.shift();
    if (next) enqueue(next, ctx);
  }
}

// Keyed by name, so it works even if the container never started. Always both, so nothing outlives its build.
export const teardown = (buildId: string) => ops.down(buildId);
