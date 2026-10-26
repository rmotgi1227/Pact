// build.failed (prototype) -> Pact builds the promised features itself. The prototype starts from the booking
// template; every SOW line whose acceptance test still fails goes to Qwen3-Coder with the test, its Playwright
// error and the prototype's source. Code applies the change to a fresh copy and starts a new prototype build: the
// normal pipeline builds it in a fresh container and runs every test. A pass deploys (deploy.ts pushes the source to
// a new repo and Vercel deploys that source); a fail comes back here, up to MAX_ROUNDS, always building on the best
// build so far. Out of rounds -> the best tested build deploys anyway, showing which lines pass. Never a fake green.
import { cp, readdir, readFile, writeFile, appendFile, mkdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import type { Build, Ctx, Skill } from '@pact/core';
import { must } from '@pact/core';
import { BuildFeaturesOutput } from '../../prompts/build-features/schema.js';

export const MAX_ROUNDS = 3;
const round = (ctx: Ctx, buildId: string) => (ctx.store.get('protoRound', buildId) as { n: number } | undefined)?.n ?? 0;
// Each prototype from generate-prototype is a root; feature rounds remember it, so a SOW v2 prototype starts fresh.
const rootOf = (ctx: Ctx, buildId: string) => (ctx.store.get('protoRoot', buildId) as { id: string } | undefined)?.id ?? buildId;
const greens = (ctx: Ctx, buildId: string) => ctx.store.latestTestRun(buildId)?.results.filter((r) => r.pass).length ?? -1;

// The prototype source the coder sees: every .ts/.tsx under app/ lib/ theme/ data/, plus the top of globals.css
// (its CSS variables). Skips build output.
async function sourceFiles(dir: string) {
  const files: { path: string; content: string }[] = [];
  for (const top of ['app', 'lib', 'theme', 'data']) {
    const entries = await readdir(join(dir, top), { recursive: true, withFileTypes: true }).catch(() => []);
    for (const e of entries) {
      const path = join(e.parentPath, e.name), rel = relative(dir, path);
      if (e.isFile() && /\.(tsx?)$/.test(e.name)) files.push({ path: rel, content: await readFile(path, 'utf8') });
    }
  }
  const css = await readFile(join(dir, 'app/globals.css'), 'utf8').catch(() => '');
  files.push({ path: 'app/globals.css (first 3000 chars; add CSS via "css")', content: css.slice(0, 3000) });
  return files;
}

// This prototype's builds (its root and every feature round), best first: most green tests, then newest.
function ranked(ctx: Ctx, root: string): Build[] {
  return ctx.store.listBuilds().filter((b) => b.kind === 'prototype' && rootOf(ctx, b.id) === root && ctx.store.latestTestRun(b.id))
    .sort((a, b) => greens(ctx, b.id) - greens(ctx, a.id) || b.createdAt - a.createdAt);
}

export const handler: Skill<{ buildId: string }, void> = async ({ buildId }, ctx) => {
  const build = ctx.store.getBuild(buildId);
  if (build?.kind !== 'prototype') return; // engineering builds are judged, never rewritten
  const n = round(ctx, buildId);
  const root = rootOf(ctx, buildId);
  const best = ranked(ctx, root)[0];
  if (!best) return ctx.log.warn('no tested prototype build to improve', { buildId });

  if (n >= MAX_ROUNDS) {
    ctx.log.warn(`features: ${MAX_ROUNDS} rounds done; deploying the best build (${greens(ctx, best.id)} tests green)`, { buildId: best.id });
    await ctx.bus.emit('share.requested', { buildId: best.id }); // tested, not all green: deploys with its real results
    return;
  }

  const sow = must(ctx.store.getApprovedSow(build.dealId), 'approved SOW');
  const tests = ctx.store.listAcceptanceTests(build.dealId);
  const run = must(ctx.store.latestTestRun(best.id), `test run for ${best.id}`);
  const lineOf = (testId: string) => sow.lines.find((l) => tests.find((t) => t.id === testId)?.sowLineId === l.id);
  const failing = await Promise.all(run.results.filter((r) => !r.pass).map(async (r) => {
    const line = lineOf(r.testId), test = tests.find((t) => t.id === r.testId);
    return { sowLineId: line?.id, title: line?.title, criterion: line?.criterion, error: r.error,
      test: test ? await ctx.files.readSpec(build.dealId, test.id).catch(() => '') : '' };
  }));
  if (!failing.length) return; // the best build is all green: it already deployed
  const passing = run.results.filter((r) => r.pass).map((r) => lineOf(r.testId)?.title).filter(Boolean);
  const compileError = build.id !== best.id ? (ctx.store.get('buildError', build.id) as { msg: string } | undefined)?.msg : undefined;

  ctx.log.info(`features round ${n + 1}/${MAX_ROUNDS}: Qwen3-Coder is building ${failing.map((f) => f.sowLineId).join(', ')}`,
    { from: best.id, green: greens(ctx, best.id), total: run.results.length });
  const out = await ctx.llm.json({ role: 'coding', schema: BuildFeaturesOutput, timeoutMs: 600_000,
    system: await ctx.readPrompt('build-features'),
    user: JSON.stringify({ failing, passing, files: await sourceFiles(best.srcDir),
      ...(compileError ? { previousAttemptFailedToBuild: compileError } : {}) }) });

  // A fresh copy of the best source, the change applied by code (paths were validated by the schema).
  const next = ctx.store.createBuild({ dealId: build.dealId, kind: 'prototype', ref: `features-r${n + 1}` });
  await cp(best.srcDir, next.srcDir, { recursive: true, filter: (p) => !/[/\\](node_modules|\.next|\.vercel)([/\\]|$)/.test(p) });
  for (const f of out.files) {
    await mkdir(dirname(join(next.srcDir, f.path)), { recursive: true });
    await writeFile(join(next.srcDir, f.path), f.content);
  }
  if (out.css.trim()) await appendFile(join(next.srcDir, 'app/globals.css'), `\n/* Pact: features from the SOW */\n${out.css}\n`);
  ctx.store.put('protoRound', next.id, { n: n + 1 });
  ctx.store.put('protoRoot', next.id, { id: root });
  ctx.store.put('protoChange', next.id, { summary: out.summary, files: out.files.map((f) => f.path) });
  ctx.log.info(`features round ${n + 1}: ${out.summary}`, { buildId: next.id, files: out.files.map((f) => f.path) });
  await ctx.bus.emit('build.requested', { buildId: next.id });
};
