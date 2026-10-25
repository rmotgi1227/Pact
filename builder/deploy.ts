// goal S5 (Shreyas). Deploys a tested build to Vercel. See build-plan.md, Phase E.
import { execa } from 'execa';
import { cp, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Ctx, Skill } from '@pact/core';
import { must } from '@pact/core';

const LINK_DIR = '/tmp/pact-builds/.vercel-link'; // linked once, its .vercel/ copied into each build
let linked: Promise<void> | undefined;
const token = () => ['--token', must(process.env.VERCEL_DEPLOY_TOKEN, 'VERCEL_DEPLOY_TOKEN env')];
// VERCEL_SCOPE = the team the pact-proto project lives in (fix from Rishab's R4 run; Shreyas owns this file).
const scope = () => (process.env.VERCEL_SCOPE ? ['--scope', process.env.VERCEL_SCOPE] : []);

const link = () => linked ??= (async () => {
  await mkdir(LINK_DIR, { recursive: true });
  await execa('vercel', ['link', '--yes', '--project', process.env.VERCEL_PROJECT ?? 'pact-proto', ...token(), ...scope()], { cwd: LINK_DIR });
  await execa('vercel', ['pull', '--yes', '--environment=preview', ...token(), ...scope()], { cwd: LINK_DIR });
})().catch((e) => { linked = undefined; throw e; });

// The box uploads only the tested source. Vercel's build machines install and build it,
// so the GB10 needs no package registry access, only the Vercel API.
export async function deploy(srcDir: string) {
  await link();
  await cp(join(LINK_DIR, '.vercel'), join(srcDir, '.vercel'), { recursive: true });
  const { stdout } = await execa('vercel', ['deploy', '--yes', ...token(), ...scope()], { cwd: srcDir, timeout: 280_000 });
  const url = stdout.trim().split('\n').pop()!.trim();
  if (!/^https:\/\/\S+\.vercel\.app$/.test(url)) throw new Error(`unexpected vercel output: ${url}`);
  return url;
}

async function share(buildId: string, ctx: Ctx) {
  const build = must(ctx.store.getBuild(buildId), `build ${buildId}`);
  const url = await deploy(build.srcDir);
  ctx.store.updateBuild(buildId, { deployUrl: url });
  ctx.log.info('deployed', { buildId, url });
  await ctx.bus.publish('build.shared', { buildId, url });
}

// On build.passed: only prototypes deploy automatically. Engineering builds deploy only via share.requested.
export const onBuildPassed: Skill<{ buildId: string }, void> = async ({ buildId }, ctx) => {
  if (ctx.store.getBuild(buildId)?.kind !== 'prototype') return;
  await share(buildId, ctx);
};

// Any tested build, e.g. Dana's review link on an 8/9 engineering build. Untested builds never deploy.
export const onShareRequested: Skill<{ buildId: string }, void> = async ({ buildId }, ctx) => {
  const status = must(ctx.store.getBuild(buildId), `build ${buildId}`).status;
  if (status !== 'passed' && status !== 'failed') { ctx.log.warn('not shared: build not tested yet', { buildId, status }); return; }
  await share(buildId, ctx);
};
