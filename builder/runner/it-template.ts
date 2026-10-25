// Integration check (goals S3+S4) on real docker and the real template: fill -> fresh container -> health ->
// the deal's generated specs (from the store in PACT_DB) -> teardown. Run after s3: PACT_DB=<agent db> pnpm tsx builder/runner/it-template.ts
import { readFile } from 'node:fs/promises';
const core = await import('@pact/core');
const { builder } = await import('../index.js');
const { fillTemplate } = await import('../fill-template.js');
const { github } = await import('../../github/client.js');
core.inject({ github, builder });
const ctx = core.makeCtx('it-template');
core.bus.listen(({ topic, payload }: any) => { if (topic === 'build.ready') void builder.runTests(payload.buildId, ctx); });
const slots = JSON.parse(await readFile(new URL('../../templates/booking-proto/slots.json', import.meta.url), 'utf8'));
const b0 = core.store.createBuild({ dealId: 'hertz-demo', kind: 'prototype', ref: 'it' });
const srcDir = await fillTemplate(b0.id, slots);
core.store.updateBuild(b0.id, { srcDir, ref: srcDir });
const t0 = Date.now();
const run = await builder.buildAndTest(b0.id, ctx);
const b = core.store.getBuild(b0.id);
console.log(JSON.stringify({ status: b.status, seconds: (Date.now() - t0) / 1000, results: run.results }));
const leftovers = (await (await import("execa")).execa("docker", ["ps", "-aq", "--filter", `name=${b0.id}`])).stdout.trim();
const ok = b.status === "passed" && !leftovers;
console.log(ok ? "PASS template integration" : "FAIL template integration");
process.exit(ok ? 0 : 1);
