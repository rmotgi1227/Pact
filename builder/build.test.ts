import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Every docker/git call is recorded; `hold` lets a test keep `docker build` pending to observe the queue.
const calls: string[][] = [];
let runnerOut = { stdout: '', exitCode: 0 };
let hold: Promise<void> | null = null;
vi.mock('execa', () => ({
  execa: vi.fn(async (cmd: string, args: string[]) => {
    calls.push([cmd, ...args]);
    if (args[0] === 'build' && hold) await hold;
    if (args[0] === 'start' && args[1] === '-a') return runnerOut;
    return { stdout: '', exitCode: 0 };
  }),
}));

async function setup() {
  const dir = await mkdtemp(join(tmpdir(), 'pact-s4-'));
  process.env.PACT_DB = join(dir, 'pact.db');
  process.env.BOOKING_REPO = dir;
  calls.length = 0; hold = null;
  vi.resetModules();
  const core = await import('@pact/core');
  const { builder } = await import('./index.js');
  const specs = join(dir, 'specs');
  await mkdir(specs, { recursive: true });
  const emitted: { topic: string; payload: any }[] = [];
  core.bus.listen((e) => emitted.push(e));
  const ctx = { store: core.store, bus: core.bus, builder, files: { specsDir: () => specs },
    log: { info: () => {}, warn: () => {}, error: () => {} } } as any;
  return { ...core, builder, ctx, emitted, specs };
}
const tick = () => new Promise((r) => setTimeout(r, 20));
const builds = () => calls.filter((c) => c[0] === 'docker' && c[1] === 'build');

describe('builder', () => {
  beforeEach(() => { runnerOut = { stdout: '', exitCode: 0 }; });

  it('single flight: a second request queues until the first build finishes', async () => {
    const { store, builder, ctx } = await setup();
    let release!: () => void; hold = new Promise((r) => { release = r; });
    const a = store.createBuild({ dealId: 'd', kind: 'main', ref: 'aaa' });
    const b = store.createBuild({ dealId: 'd', kind: 'main', ref: 'bbb' });
    builder.enqueue(a.id, ctx); builder.enqueue(b.id, ctx);
    await vi.waitFor(() => expect(builds()).toHaveLength(1));
    await tick(); // b must still be waiting while a's docker build is held
    expect(builds()).toHaveLength(1);
    hold = null; release();
    await vi.waitFor(() => expect(builds()).toHaveLength(2));
    await vi.waitFor(() => expect(store.getBuild(a.id)!.status).toBe('ready'));
  });

  it('a redelivered build.requested is a no-op', async () => {
    const { store, builder, ctx } = await setup();
    const a = store.createBuild({ dealId: 'd', kind: 'main', ref: 'aaa' });
    builder.enqueue(a.id, ctx);
    await vi.waitFor(() => expect(store.getBuild(a.id)!.status).toBe('ready'));
    builder.enqueue(a.id, ctx); // the guard returns synchronously for a build that isn't queued
    await tick();
    expect(builds()).toHaveLength(1);
  });

  it('a test missing from the report counts as failed, and the containers are torn down', async () => {
    const { store, builder, ctx, emitted, specs } = await setup();
    store.saveSow({ dealId: 'd', version: 1, status: 'approved', lines: [
      { id: '§1.1', sowVersion: 1, title: 'a', criterion: 'a', commitmentIds: [] },
      { id: '§3.1', sowVersion: 1, title: 'b', criterion: 'b', commitmentIds: [] }] });
    for (const id of ['t_1_1', 't_3_1']) {
      await writeFile(join(specs, `${id}.spec.ts`), 'x');
      store.saveAcceptanceTest({ id, dealId: 'd', sowLineId: id === 't_1_1' ? '§1.1' : '§3.1', file: '', status: 'unknown' });
    }
    runnerOut = { exitCode: 0, stdout: JSON.stringify({ suites: [{ file: 't_1_1.spec.ts', suites: [
      { specs: [{ file: 't_1_1.spec.ts', tests: [{ results: [{ status: 'passed' }] }] }] }] }] }) };
    const b = store.createBuild({ dealId: 'd', kind: 'main', ref: 'aaa' });
    store.updateBuild(b.id, { status: 'ready' });
    await builder.runTests(b.id, ctx);
    expect(store.latestTestRun(b.id)!.results).toEqual([{ testId: 't_1_1', pass: true }, { testId: 't_3_1', pass: false }]);
    expect(store.getBuild(b.id)!.status).toBe('failed');
    expect(emitted.map((e) => e.topic)).toContain('build.failed');
    expect(calls).toContainEqual(['docker', 'rm', '-f', `runner-${b.id}`, `app-${b.id}`]);
    expect(calls).toContainEqual(['docker', 'network', 'rm', `pact-test-${b.id}`]);
  });

  it('runner timeout (no exit 0/1) fails every test and still tears down', async () => {
    const { store, builder, ctx } = await setup();
    store.saveSow({ dealId: 'd', version: 1, status: 'approved', lines: [{ id: '§1.1', sowVersion: 1, title: 'a', criterion: 'a', commitmentIds: [] }] });
    store.saveAcceptanceTest({ id: 't_1_1', dealId: 'd', sowLineId: '§1.1', file: '', status: 'green' });
    runnerOut = { exitCode: undefined as any, stdout: '' };
    const b = store.createBuild({ dealId: 'd', kind: 'main', ref: 'aaa' });
    store.updateBuild(b.id, { status: 'ready' });
    await builder.runTests(b.id, ctx);
    expect(store.listAcceptanceTests('d')[0].status).toBe('red');
    expect(calls).toContainEqual(['docker', 'rm', '-f', `runner-${b.id}`, `app-${b.id}`]);
  });

  it('buildAndTest resolves with the stored run when build.passed fires', async () => {
    const { store, bus, builder, ctx } = await setup();
    const b = store.createBuild({ dealId: 'd', kind: 'main', ref: 'aaa' });
    const p = builder.buildAndTest(b.id, ctx);
    await vi.waitFor(() => expect(store.getBuild(b.id)!.status).toBe('ready'));
    store.saveTestRun({ id: 'r1', buildId: b.id, at: 1, results: [{ testId: 't', pass: true }] });
    await bus.publish('build.passed', { buildId: b.id });
    expect((await p).id).toBe('r1');
  });
});
