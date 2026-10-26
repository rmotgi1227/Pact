// goal S5 (Shreyas). Deploys a tested build to Vercel. See build-plan.md, Phase E.
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type { Ctx, Skill } from '@pact/core';
import { must } from '@pact/core';
import { ops } from './ops.js';

export { deploy } from './deploy-cli.js';

async function share(buildId: string, ctx: Ctx) {
  const build = must(ctx.store.getBuild(buildId), `build ${buildId}`);
  const url = await ops.deploy(buildId, build.srcDir);
  ctx.store.updateBuild(buildId, { deployUrl: url });
  ctx.log.info('deployed', { buildId, url });
  await ctx.bus.publish('build.shared', { buildId, url });
}

// The tested source as files, without install/build output or deploy metadata.
async function sourceFiles(dir: string) {
  const files: { path: string; content: string }[] = [];
  for (const e of await readdir(dir, { recursive: true, withFileTypes: true })) {
    const path = join(e.parentPath, e.name);
    if (!e.isFile() || /(^|\/)(node_modules|\.next|\.vercel|\.git)(\/|$)/.test(relative(dir, path))) continue;
    files.push({ path: relative(dir, path), content: await readFile(path, 'utf8') });
  }
  return files;
}

// A tested prototype gets its own new GitHub repo, so engineering can start from it. Best effort: a GitHub
// hiccup must not stop the share link.
async function publishRepo(buildId: string, ctx: Ctx) {
  if (!process.env.GITHUB_TOKEN) return ctx.log.warn('prototype repo skipped: no GITHUB_TOKEN', { buildId });
  try {
    const build = must(ctx.store.getBuild(buildId), `build ${buildId}`);
    const repoUrl = await ctx.github.publishRepo(`pact-proto-${buildId.replace(/_/g, '-')}`, await sourceFiles(build.srcDir),
      `Booking prototype built by Pact from the approved SOW (build ${buildId}, all acceptance tests green)`);
    ctx.store.updateBuild(buildId, { repoUrl });
    ctx.log.info('prototype repo created', { buildId, repoUrl });
  } catch (err) { ctx.log.warn('prototype repo failed', { buildId, err: String(err) }); }
}

// On build.passed: only prototypes deploy automatically (and get their own repo). Engineering builds deploy
// only via share.requested.
export const onBuildPassed: Skill<{ buildId: string }, void> = async ({ buildId }, ctx) => {
  if (ctx.store.getBuild(buildId)?.kind !== 'prototype') return;
  await publishRepo(buildId, ctx);
  await share(buildId, ctx);
};

// Any tested build, e.g. Dana's review link on an 8/9 engineering build. Untested builds never deploy.
export const onShareRequested: Skill<{ buildId: string }, void> = async ({ buildId }, ctx) => {
  const status = must(ctx.store.getBuild(buildId), `build ${buildId}`).status;
  if (status !== 'passed' && status !== 'failed') { ctx.log.warn('not shared: build not tested yet', { buildId, status }); return; }
  // A prototype that build-features couldn't take all the way to green still gets its own repo before it deploys.
  const b = ctx.store.getBuild(buildId);
  if (b?.kind === 'prototype' && !b.repoUrl) await publishRepo(buildId, ctx);
  await share(buildId, ctx);
};
