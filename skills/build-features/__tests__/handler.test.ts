import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BuildFeaturesOutput } from '../../../prompts/build-features/schema.js';

async function setup(change: object) {
  const dir = await mkdtemp(join(tmpdir(), 'pact-feat-'));
  process.env.PACT_DB = join(dir, 'pact.db');
  vi.resetModules();
  const { store } = await import('@pact/core');
  const emitted: { topic: string; p: any }[] = [];
  const ctx = { store, bus: { emit: async (topic: string, p: any) => { emitted.push({ topic, p }); } },
    llm: { json: vi.fn(async () => change) }, readPrompt: async () => 'p',
    files: { readSpec: async () => "test('§1.2 dark mode', async () => {})" },
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } } as any;
  store.saveSow({ dealId: 'd', version: 1, status: 'approved', lines: [
    { id: '§1.1', sowVersion: 1, title: 'Search', criterion: 'search works', commitmentIds: [] },
    { id: '§1.2', sowVersion: 1, title: 'Dark mode', criterion: 'a theme toggle switches to dark', commitmentIds: [] }] });
  for (const [id, line] of [['t_1_1', '§1.1'], ['t_1_2', '§1.2']]) store.saveAcceptanceTest({ id, dealId: 'd', sowLineId: line, file: 'f', status: 'unknown' });
  // the template prototype: search passes, dark mode fails
  const src = join(dir, 'src');
  await mkdir(join(src, 'app'), { recursive: true });
  await writeFile(join(src, 'app/page.tsx'), 'export default function P() { return null; }');
  await writeFile(join(src, 'app/globals.css'), ':root { --brand: blue; }');
  const base = store.createBuild({ dealId: 'd', kind: 'prototype', ref: 'proto', srcDir: src, status: 'failed' });
  store.saveTestRun({ id: 'r0', buildId: base.id, at: 1, results: [{ testId: 't_1_1', pass: true }, { testId: 't_1_2', pass: false, error: 'theme-toggle not found' }] });
  return { store, ctx, emitted, base, ...(await import('../handler.js')) };
}

const change = { summary: 'Added a dark mode toggle.', files: [{ path: 'app/components/ThemeToggle.tsx', content: "'use client';\nexport function ThemeToggle() { return null; }" }], css: '[data-theme="dark"] { --bg: #000; }' };

describe('build-features', () => {
  it('gives the coder the failing line with its error, applies the change to a fresh copy, and builds it', async () => {
    const { store, ctx, emitted, base, handler } = await setup(change);
    await handler({ buildId: base.id }, ctx);
    const user = JSON.parse(ctx.llm.json.mock.calls[0][0].user);
    expect(user.failing).toMatchObject([{ sowLineId: '§1.2', error: 'theme-toggle not found' }]);
    expect(user.passing).toEqual(['Search']);
    const next = emitted.find((e) => e.topic === 'build.requested')!.p.buildId;
    const nb = store.getBuild(next)!;
    expect(nb).toMatchObject({ kind: 'prototype', ref: 'features-r1' });
    expect(await readFile(join(nb.srcDir, 'app/components/ThemeToggle.tsx'), 'utf8')).toContain('ThemeToggle');
    expect(await readFile(join(nb.srcDir, 'app/globals.css'), 'utf8')).toContain('[data-theme="dark"]');
    expect(await readFile(join(base.srcDir, 'app/globals.css'), 'utf8')).not.toContain('dark'); // the base is untouched
  });

  it('after the last round, deploys the best tested build instead of trying again', async () => {
    const { store, ctx, emitted, base, handler, MAX_ROUNDS } = await setup(change);
    const last = store.createBuild({ dealId: 'd', kind: 'prototype', ref: 'features-r3', status: 'failed' });
    store.put('protoRound', last.id, { n: MAX_ROUNDS });
    store.put('protoRoot', last.id, { id: base.id });
    store.saveTestRun({ id: 'r3', buildId: last.id, at: 2, results: [{ testId: 't_1_1', pass: false }, { testId: 't_1_2', pass: false }] });
    await handler({ buildId: last.id }, ctx);
    expect(ctx.llm.json).not.toHaveBeenCalled();
    expect(emitted).toEqual([{ topic: 'share.requested', p: { buildId: base.id } }]); // base had more green
  });

  it('never touches engineering builds', async () => {
    const { store, ctx, emitted, handler } = await setup(change);
    const pr = store.createBuild({ dealId: 'd', kind: 'pr', ref: 'abc', status: 'failed' });
    await handler({ buildId: pr.id }, ctx);
    expect(emitted).toEqual([]);
  });

  it('only accepts source files under app/ lib/ theme/ data/', () => {
    for (const path of ['package.json', 'app/../package.json', 'next.config.mjs', 'Dockerfile', '/etc/passwd', 'app/x.js'])
      expect(BuildFeaturesOutput.safeParse({ ...change, files: [{ path, content: 'x' }] }).success, path).toBe(false);
    expect(BuildFeaturesOutput.safeParse(change).success).toBe(true);
  });
});
