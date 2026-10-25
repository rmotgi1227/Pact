// Integration check for the runner (goal S4) against real docker: pnpm tsx builder/runner/it.ts
// Starts a tiny app container on a per-build internal network, runs one passing and one failing
// spec through the real runTests, and checks results, statuses and teardown.
import { execa } from 'execa';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = await mkdtemp(join(tmpdir(), 'pact-it-'));
process.env.PACT_DB = join(dir, 'pact.db');
const { store, bus } = await import('@pact/core');
const { builder } = await import('../index.js');
const { net } = await import('../build.js');

const specs = join(dir, 'specs');
const ctx = { store, bus, builder, files: { specsDir: () => specs }, log: { info: console.log, warn: console.warn, error: console.error } } as any;
await execa('mkdir', ['-p', specs]);
const spec = (body: string) => `import { test, expect } from '@playwright/test';\ntest('x', async ({ page }) => {\n  await page.goto(process.env.APP_URL ?? 'http://app:3000');\n  ${body}\n});\n`;
await writeFile(join(specs, 't_1_1.spec.ts'), spec(`await expect(page.getByTestId('search-form')).toBeVisible();`));
await writeFile(join(specs, 't_3_1.spec.ts'), spec(`await expect(page.getByTestId('results-grid')).toBeVisible({ timeout: 2000 });`));
store.saveSow({ dealId: 'd', version: 1, status: 'approved', lines: [
  { id: '§1.1', sowVersion: 1, title: 'a', criterion: 'a', commitmentIds: [] },
  { id: '§3.1', sowVersion: 1, title: 'b', criterion: 'b', commitmentIds: [] }] });
for (const [id, line] of [['t_1_1', '§1.1'], ['t_3_1', '§3.1']]) store.saveAcceptanceTest({ id, dealId: 'd', sowLineId: line, file: '', status: 'unknown' });

const b = store.createBuild({ dealId: 'd', kind: 'main', ref: 'it' });
const app = `const s=require('http').createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html'});r.end('<form data-testid=search-form>ok</form>')});s.listen(3000)`;
const t0 = Date.now();
await execa('docker', ['network', 'create', '--internal', net(b.id)]);
await execa('docker', ['run', '-d', '--name', `app-${b.id}`, '--network', net(b.id), '--network-alias', 'app', 'node:24-slim', 'node', '-e', app]);
store.updateBuild(b.id, { status: 'ready' });
await builder.runTests(b.id, ctx);

const run = store.latestTestRun(b.id);
const left = (await execa('docker', ['ps', '-aq', '--filter', `name=${b.id}`])).stdout.trim();
const nets = (await execa('docker', ['network', 'ls', '-q', '--filter', `name=${net(b.id)}`])).stdout.trim();
console.log(JSON.stringify({ results: run?.results, status: store.getBuild(b.id)?.status, seconds: (Date.now() - t0) / 1000, left, nets }));
const ok = JSON.stringify(run?.results) === JSON.stringify([{ testId: 't_1_1', pass: true }, { testId: 't_3_1', pass: false }])
  && store.getBuild(b.id)?.status === 'failed' && !left && !nets;
console.log(ok ? 'PASS runner integration' : 'FAIL runner integration');
process.exit(ok ? 0 : 1);
