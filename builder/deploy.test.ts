import { describe, expect, it, vi } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const calls: string[][] = [];
vi.mock('execa', () => ({
  execa: vi.fn(async (cmd: string, args: string[], o: { cwd: string }) => {
    calls.push([cmd, ...args]);
    if (args[0] === 'pull') {
      const { mkdir, writeFile } = await import('node:fs/promises');
      await mkdir(join(o.cwd, '.vercel'), { recursive: true }); await writeFile(join(o.cwd, '.vercel/project.json'), '{}');
    }
    return { stdout: args[0] === 'deploy' ? 'Inspect: x\nhttps://pact-proto-abc.vercel.app' : '', exitCode: 0 };
  }),
}));

async function setup() {
  const dir = await mkdtemp(join(tmpdir(), 'pact-s5-'));
  process.env.PACT_DB = join(dir, 'pact.db'); process.env.VERCEL_DEPLOY_TOKEN = 'tok';
  calls.length = 0; vi.resetModules();
  const { store, bus } = await import('@pact/core');
  const deploy = await import('./deploy.js');
  const shared: unknown[] = [];
  bus.listen((e) => { if (e.topic === 'build.shared') shared.push(e.payload); });
  const ctx = { store, bus, log: { info: () => {}, warn: () => {}, error: () => {} } } as any;
  return { store, ctx, shared, dir, ...deploy };
}
const deploys = () => calls.filter((c) => c[1] === 'deploy');

describe('deploy', () => {
  it('a passed prototype deploys and saves the url', async () => {
    const { store, ctx, shared, dir, onBuildPassed } = await setup();
    const b = store.createBuild({ dealId: 'd', kind: 'prototype', ref: 'x', srcDir: dir, status: 'passed' });
    await onBuildPassed({ buildId: b.id }, ctx);
    expect(store.getBuild(b.id)!.deployUrl).toBe('https://pact-proto-abc.vercel.app');
    expect(shared).toEqual([{ buildId: b.id, url: 'https://pact-proto-abc.vercel.app' }]);
  });

  it('build.passed for an engineering build does not deploy', async () => {
    const { store, ctx, onBuildPassed } = await setup();
    const b = store.createBuild({ dealId: 'd', kind: 'pr', ref: 'x', status: 'passed' });
    await onBuildPassed({ buildId: b.id }, ctx);
    expect(deploys()).toHaveLength(0);
  });

  it('share.requested deploys a tested engineering build but not an untested one', async () => {
    const { store, ctx, dir, onShareRequested } = await setup();
    const untested = store.createBuild({ dealId: 'd', kind: 'main', ref: 'x', srcDir: dir, status: 'building' });
    await onShareRequested({ buildId: untested.id }, ctx);
    expect(deploys()).toHaveLength(0);
    const tested = store.createBuild({ dealId: 'd', kind: 'main', ref: 'x', srcDir: dir, status: 'failed' });
    await onShareRequested({ buildId: tested.id }, ctx);
    expect(deploys()).toHaveLength(1);
  });
});
