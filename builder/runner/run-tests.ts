// goal S4 (Shreyas). Runs the deal's generated specs against one build's container. See build-plan.md, Phase D.
import { execa } from 'execa';
import { cp, mkdir, rm } from 'node:fs/promises';
import type { Ctx } from '@pact/core';
import { must } from '@pact/core';
import { buildDir, net, teardown } from '../build.js';

// A build can reach 'ready' before generate-acceptance-tests has written anything (prototype builds race
// the SOW-approval fan-out). Wait until every line of the current approved SOW has its test.
async function testsForDeal(dealId: string, ctx: Ctx, tries = 120) {
  for (let i = 0; i < tries; i++) {
    const sow = ctx.store.getApprovedSow(dealId);
    const tests = ctx.store.listAcceptanceTests(dealId);
    if (sow && sow.lines.length > 0 && sow.lines.every((l) => tests.some((t) => t.sowLineId === l.id))) return tests;
    await new Promise((r) => setTimeout(r, 500));
  }
  return ctx.store.listAcceptanceTests(dealId); // missing tests count as failed
}

export async function runTests(buildId: string, ctx: Ctx) {
  const build = must(ctx.store.getBuild(buildId), `build ${buildId}`);
  if (build.status !== 'ready') return; // redelivery guard: already testing/tested
  ctx.store.updateBuild(buildId, { status: 'testing' });
  const specsDir = `${buildDir(buildId)}/specs`;

  try {
    const tests = await testsForDeal(build.dealId, ctx);
    // This build's own snapshot of the specs, immune to specs being regenerated mid-run.
    await rm(specsDir, { recursive: true, force: true });
    await mkdir(specsDir, { recursive: true });
    await cp(ctx.files.specsDir(build.dealId), specsDir, { recursive: true });

    // Copied in rather than bind-mounted, so it works on any docker host (Colima's VM only shares $HOME).
    const runner = `runner-${buildId}`;
    await execa('docker', ['create', '--name', runner, '--network', net(buildId), '-e', 'APP_URL=http://app:3000', 'pact-runner']);
    await execa('docker', ['cp', `${specsDir}/.`, `${runner}:/tests/tests`]);
    const { stdout, exitCode } = await execa('docker', ['start', '-a', runner], { timeout: 90_000, reject: false });

    // Trust the JSON only if Playwright really ran (0 = all passed, 1 = some failed). Anything else
    // (crash, bad mount, timeout) means no real results, and every test counts as failed.
    const byFile = exitCode === 0 || exitCode === 1 ? parsePlaywrightJson(stdout) : new Map<string, boolean>();
    if (byFile.size === 0) ctx.log.warn('no playwright results', { buildId, exitCode, out: stdout.slice(-500) });

    const results = tests.map((t) => {
      const pass = byFile.get(`${t.id}.spec.ts`) ?? false; // missing from the report = fail, never skipped
      ctx.store.setTestStatus(t.id, pass ? 'green' : 'red', buildId);
      return { testId: t.id, pass };
    });
    ctx.store.saveTestRun({ id: ctx.store.newId('run'), buildId, at: Date.now(), results });

    const allGreen = results.length > 0 && results.every((r) => r.pass);
    ctx.store.updateBuild(buildId, { status: allGreen ? 'passed' : 'failed' });
    await ctx.bus.emit(allGreen ? 'build.passed' : 'build.failed', { buildId: build.id });
  } catch (err) {
    ctx.store.updateBuild(buildId, { status: 'failed' });
    ctx.log.error('test run failed', { buildId, err: String(err) });
    await ctx.bus.emit('build.failed', { buildId: build.id });
  } finally {
    await teardown(buildId); // every exit path, including the runner timeout
  }
}

// --reporter=json nests suites (one per file / describe block), so walk recursively and key by the
// spec file's basename, which is `<testId>.spec.ts` because that's what we wrote it as.
export function parsePlaywrightJson(raw: string): Map<string, boolean> {
  const byFile = new Map<string, boolean>();
  let report: any;
  try { report = JSON.parse(raw.slice(raw.indexOf('{'))); } catch { return byFile; }
  const visit = (suite: any) => {
    for (const spec of suite.specs ?? []) {
      const file = String(spec.file ?? suite.file ?? '').split('/').pop();
      if (!file) continue;
      const pass = (spec.tests ?? []).length > 0 && (spec.tests ?? []).every((t: any) =>
        (t.results ?? []).some((r: any) => r.status === 'passed'));
      byFile.set(file, (byFile.get(file) ?? true) && pass);
    }
    for (const child of suite.suites ?? []) visit(child);
  };
  for (const suite of report.suites ?? []) visit(suite);
  return byFile;
}
