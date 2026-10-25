import { describe, expect, it, vi } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function setup(prs: { number: number; sha: string; author: string }[]) {
  process.env.PACT_DB = join(await mkdtemp(join(tmpdir(), 'pact-a3p-')), 'pact.db');
  vi.resetModules();
  const { store } = await import('@pact/core');
  const emitted: any[] = [];
  const ctx = { store, bus: { emit: async (topic: string, p: object) => { emitted.push({ topic, p }); } },
    github: { listMergedPrs: vi.fn(async () => prs) }, log: { info: () => {}, warn: () => {}, error: () => {} } } as any;
  const { poll } = await import('./poll.js');
  return { store, ctx, emitted, poll };
}

describe('github poll', () => {
  it('the same merged PR polled twice creates one pr build with its merge sha and author', async () => {
    const { store, ctx, emitted, poll } = await setup([{ number: 34, sha: 'abc', author: 'priya' }]);
    await poll(ctx); await poll(ctx);
    const builds = store.listBuilds();
    expect(builds).toHaveLength(1);
    expect(builds[0]).toMatchObject({ kind: 'pr', ref: 'abc', prNumber: 34, author: 'priya', dealId: 'hertz-demo' });
    expect(emitted).toEqual([{ topic: 'build.requested', p: { buildId: builds[0].id } }]);
  });

  it('skips PRs already marked seen (startup baseline)', async () => {
    const { store, ctx, emitted, poll } = await setup([{ number: 12, sha: 'old', author: 'raj' }]);
    store.markPrSeen(12);
    await poll(ctx);
    expect(emitted).toEqual([]);
  });
});
