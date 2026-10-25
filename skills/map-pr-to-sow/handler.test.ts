import { describe, expect, it, vi } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const line = (id: string) => ({ id, sowVersion: 1, title: id, criterion: `criterion ${id}`, commitmentIds: [] });

async function setup(modelIds: string[]) {
  process.env.PACT_DB = join(await mkdtemp(join(tmpdir(), 'pact-a3m-')), 'pact.db');
  vi.resetModules();
  const { store } = await import('@pact/core');
  const github = { getPr: vi.fn(async () => ({ prNumber: 34, author: 'priya', linkedIssues: [101], mergeCommitSha: 's' })),
    getDiff: vi.fn(async () => 'diff'), comment: vi.fn(async () => {}) };
  const ctx = { store, github, llm: { json: vi.fn(async () => ({ sowLineIds: modelIds })) }, readPrompt: async () => 'p',
    log: { info: () => {}, warn: () => {}, error: () => {} } } as any;
  const { handler } = await import('./handler.js');
  store.saveSow({ dealId: 'd', version: 1, status: 'approved', lines: [line('§1.1'), line('§3.1'), line('§4.1')] });
  store.setIssueNumber('§3.1', 101);
  const b = store.createBuild({ dealId: 'd', kind: 'pr', ref: 's', prNumber: 34, author: 'priya' });
  return { store, ctx, github, handler, b };
}

describe('map-pr-to-sow', () => {
  it('comments only on mapped lines that are green in this build, once, and credits the author', async () => {
    const { store, ctx, github, handler, b } = await setup(['§1.1', '§9.9']);
    store.saveAcceptanceTest({ id: 't_3_1', dealId: 'd', sowLineId: '§3.1', file: 'f', status: 'green', lastBuildId: b.id });
    store.saveAcceptanceTest({ id: 't_1_1', dealId: 'd', sowLineId: '§1.1', file: 'f', status: 'red', lastBuildId: b.id });
    store.saveAcceptanceTest({ id: 't_4_1', dealId: 'd', sowLineId: '§4.1', file: 'f', status: 'green', lastBuildId: b.id });
    await handler({ buildId: b.id }, ctx);
    await handler({ buildId: b.id }, ctx); // redelivery
    expect(github.comment.mock.calls).toEqual([[34, 'Satisfies SOW §3.1']]);
    expect(store.getGreenBy('t_3_1')).toEqual({ prNumber: 34, author: 'priya' });
    expect(store.getGreenBy('t_4_1')).toBeUndefined(); // green, but this PR isn't mapped to it
  });

  it('credits the PR for a test it turned green, even with no issue link or model mapping', async () => {
    const { store, ctx, github, handler } = await setup([]);
    github.getPr.mockResolvedValueOnce({ prNumber: 36, author: 'priya', linkedIssues: [], mergeCommitSha: 's' });
    store.saveAcceptanceTest({ id: 't_4_1', dealId: 'd', sowLineId: '§4.1', file: 'f', status: 'green' });
    const base = store.createBuild({ dealId: 'd', kind: 'main', ref: 'm', createdAt: 1 });
    store.saveTestRun({ id: 'run_base', buildId: base.id, at: 1, results: [{ testId: 't_4_1', pass: false }] });
    const pr = store.createBuild({ dealId: 'd', kind: 'pr', ref: 's2', prNumber: 36, author: 'priya', createdAt: 2 });
    store.saveTestRun({ id: 'run_pr', buildId: pr.id, at: 2, results: [{ testId: 't_4_1', pass: true }] });
    await handler({ buildId: pr.id }, ctx);
    expect(github.comment.mock.calls).toContainEqual([36, 'Satisfies SOW §4.1']);
    expect(store.getGreenBy('t_4_1')).toEqual({ prNumber: 36, author: 'priya' });
  });

  it('ignores non-pr builds', async () => {
    const { store, ctx, github, handler } = await setup([]);
    const m = store.createBuild({ dealId: 'd', kind: 'main', ref: 'x' });
    await handler({ buildId: m.id }, ctx);
    expect(github.getPr).not.toHaveBeenCalled();
  });
});
