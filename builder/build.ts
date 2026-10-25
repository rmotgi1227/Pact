// goal S4 (Shreyas). One fresh container per build, on its own internal network. See build-plan.md, Phase D.
import { execa } from 'execa';
import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Ctx, Skill, TestRun } from '@pact/core';
import { must } from '@pact/core';

const DOCKERFILE_APP = resolve(import.meta.dirname, 'Dockerfile.app');
export const net = (buildId: string) => `pact-test-${buildId}`;
export const buildDir = (buildId: string) => `/tmp/pact-builds/${buildId}`;
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
  const src = `${buildDir(buildId)}/src`;
  try {
    ctx.store.updateBuild(buildId, { status: 'building' });
    await mkdir(src, { recursive: true });
    // Real source per build: a prototype copies generate-prototype's output dir; a pr/main
    // build is the exact commit from the booking repo.
    if (build.kind === 'prototype') {
      if (build.srcDir !== src) await cp(build.srcDir, src, { recursive: true });
    } else {
      const repo = must(process.env.BOOKING_REPO, 'BOOKING_REPO env');
      await execa('git', ['-C', repo, 'fetch', '-q']);
      await execa('sh', ['-c', `git -C "$0" archive "$1" | tar -x -C "$2"`, repo, build.ref, src]);
    }
    ctx.store.updateBuild(buildId, { srcDir: src });

    const tag = `pact-build:${buildId}`;
    const t0 = Date.now();
    await execa('docker', ['build', '-q', '-f', DOCKERFILE_APP, '-t', tag, src], { timeout: 120_000 });
    await execa('docker', ['network', 'create', '--internal', net(buildId)]);
    await execa('docker', ['run', '-d', '--name', `app-${buildId}`, '--network', net(buildId), '--network-alias', 'app', tag]);
    await waitHealthy(buildId);
    ctx.log.info('container ready', { buildId, seconds: Math.round((Date.now() - t0) / 1000) });

    ctx.store.updateBuild(buildId, { status: 'ready' });
    await ctx.bus.emit('build.ready', { buildId: build.id });
  } catch (err) {
    ctx.store.updateBuild(buildId, { status: 'failed' });
    await teardown(buildId);
    ctx.log.error('build failed', { buildId, err: String(err) });
    await ctx.bus.emit('build.failed', { buildId }); // so anyone awaiting this build (triage) gets an answer
  } finally {
    busy = false;
    const next = queue.shift();
    if (next) enqueue(next, ctx);
  }
}

// No published ports: the probe runs inside the app container with node's fetch (the slim image has no wget).
async function waitHealthy(buildId: string, tries = 40) {
  const probe = "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))";
  for (let i = 0; i < tries; i++) {
    const { exitCode } = await execa('docker', ['exec', `app-${buildId}`, 'node', '-e', probe], { reject: false });
    if (exitCode === 0) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('app container never became healthy');
}

// Keyed by name, so it works even if the container never started. Always both, so nothing outlives its build.
export async function teardown(buildId: string) {
  await execa('docker', ['rm', '-f', `runner-${buildId}`, `app-${buildId}`], { reject: false });
  await execa('docker', ['network', 'rm', net(buildId)], { reject: false });
}
