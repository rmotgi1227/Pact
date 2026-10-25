import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function setup(items: { lineIndex: number; summary: string }[]) {
  process.env.PACT_DB = join(await mkdtemp(join(tmpdir(), 'pact-a2-')), 'pact.db');
  vi.resetModules();
  const { store } = await import('@pact/core');
  const ctx = { store, llm: { json: vi.fn(async () => ({ items })) }, readPrompt: async () => 'prompt',
    log: { info: () => {}, warn: () => {}, error: () => {} } } as any;
  const { handler } = await import('../handler.js');
  const call3 = JSON.parse(await readFile(new URL('../../../demo/fixtures/call-3.json', import.meta.url), 'utf8'));
  store.saveTranscript(call3);
  return { store, ctx, handler, call3 };
}

describe('capture-commitments', () => {
  it('copies the exact call-3 tablet quote at t=760', async () => {
    const { store, ctx, handler, call3 } = await setup([{ lineIndex: 2, summary: 'Works on tablets' }]);
    await handler({ transcriptId: 'call-3' }, ctx);
    const [c] = store.getCommitmentsByDeal('hertz-demo');
    expect(c.quote).toEqual({ transcriptId: 'call-3', t: 760, text: call3.lines[2].text });
    expect(c.text).toBe('Works on tablets');
  });

  it('drops a lineIndex outside the transcript and duplicate indices instead of crashing', async () => {
    const { store, ctx, handler } = await setup([{ lineIndex: 99, summary: 'x' }, { lineIndex: -1, summary: 'y' },
      { lineIndex: 0, summary: 'a' }, { lineIndex: 0, summary: 'b' }]);
    const out = await handler({ transcriptId: 'call-3' }, ctx);
    expect(out.commitmentIds).toEqual(['call-3-c0']);
    expect(store.getCommitmentsByDeal('hertz-demo')).toHaveLength(1);
  });

  it('skips status calls (classify-request owns them)', async () => {
    const { store, ctx, handler } = await setup([{ lineIndex: 0, summary: 'a' }]);
    store.saveTranscript({ id: 'status-1', dealId: 'hertz-demo', kind: 'status', lines: [{ t: 1, speaker: 'Dana', text: 'hi' }] });
    expect(await handler({ transcriptId: 'status-1' }, ctx)).toEqual({ commitmentIds: [] });
    expect(ctx.llm.json).not.toHaveBeenCalled();
  });
});
