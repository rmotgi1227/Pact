import { describe, expect, it, vi } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const line = (id: string) => ({ id, sowVersion: 1, title: `title ${id}`, criterion: `criterion ${id}`, commitmentIds: [] });

describe('github-sync', () => {
  it('opens one issue per SOW line once, a test PR with every spec, and a baseline main build', async () => {
    process.env.PACT_DB = join(await mkdtemp(join(tmpdir(), 'pact-a3s-')), 'pact.db');
    vi.resetModules();
    const { store } = await import('@pact/core');
    let n = 100;
    const emitted: any[] = [];
    const github = { createIssue: vi.fn(async (_t: string, _b: string) => ++n), openPrWithFiles: vi.fn(async (_b: string, _f: { path: string; content: string }[]) => 7), getHeadSha: vi.fn(async () => 'mainsha') };
    const ctx = { store, github, bus: { emit: async (topic: string, p: object) => { emitted.push({ topic, p }); } },
      files: { readSpec: async (_d: string, id: string) => `spec ${id}` }, log: { info: () => {}, warn: () => {}, error: () => {} } } as any;
    const { handler } = await import('./handler.js');
    store.saveSow({ dealId: 'd', version: 1, status: 'approved', lines: [line('§1.1'), line('§3.1')] });
    store.saveAcceptanceTest({ id: 't_3_1', dealId: 'd', sowLineId: '§3.1', file: 'f', status: 'unknown' });

    await handler({ dealId: 'd', version: 1 }, ctx);
    await handler({ dealId: 'd', version: 1 }, ctx); // redelivery: no new issues
    expect(github.createIssue).toHaveBeenCalledTimes(2);
    expect(github.createIssue.mock.calls[1]).toEqual(['SOW §3.1 title §3.1', expect.stringContaining('criterion §3.1')]);
    expect(store.getIssueNumber('§3.1')).toBe(102);
    expect(store.sowLineForIssue(101)).toBe('§1.1');
    expect(github.openPrWithFiles.mock.calls[0][1]).toEqual([{ path: 'specs/d/t_3_1.spec.ts', content: 'spec t_3_1' }]);
    expect(emitted[0].topic).toBe('build.requested');
    expect(store.getBuild(emitted[0].p.buildId)).toMatchObject({ kind: 'main', ref: 'mainsha', dealId: 'd' });
  });
});
