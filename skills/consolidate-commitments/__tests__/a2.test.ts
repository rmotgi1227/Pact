import { describe, expect, it, vi } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const c = (id: string, text: string) => ({ id, dealId: 'd', text, quote: { transcriptId: id.split('-c')[0], t: 1, text: `q ${id}` } });

async function setup(vec: Record<string, number[]>, decide: (s: any) => Promise<any>) {
  process.env.PACT_DB = join(await mkdtemp(join(tmpdir(), 'pact-a2c-')), 'pact.db');
  vi.resetModules();
  const { store } = await import('@pact/core');
  const emitted: unknown[] = [];
  const ctx = { store, bus: { emit: async (topic: string, p: object) => { emitted.push({ topic, p }); } },
    llm: { embed: vi.fn(async (texts: string[]) => texts.map((t) => vec[t])) }, decide: { choose: vi.fn(decide) },
    log: { info: () => {}, warn: vi.fn(), error: () => {} } } as any;
  const { handler } = await import('../handler.js');
  return { store, ctx, emitted, handler };
}

describe('consolidate-commitments', () => {
  it('merges near-duplicates Tev1 calls the same, keeps every quote, emits commitments.consolidated', async () => {
    const { store, ctx, emitted, handler } = await setup({ 'One library for 3 brands': [1, 0], 'Single library themed per brand': [0.99, 0.1], 'Launch Dec 2017': [0, 1] }, async () => ({ key: 'same', p: 0.95 }));
    store.saveCommitments([c('call-1-c3', 'One library for 3 brands'), c('call-2-c8', 'Single library themed per brand'), c('call-2-c2', 'Launch Dec 2017')]);
    await handler({ dealId: 'd' }, ctx);
    const out = store.getCommitmentsByDeal('d');
    expect(out).toHaveLength(2);
    expect(out.find((x) => x.id === 'call-1-c3')!.quotes!.map((q) => q.text)).toEqual(['q call-1-c3', 'q call-2-c8']);
    expect(ctx.decide.choose).toHaveBeenCalledTimes(1); // only the embedding-close pair is asked about
    expect(emitted).toEqual([{ topic: 'commitments.consolidated', p: { dealId: 'd' } }]);
  });

  it('keeps a close pair apart when Tev1 says different or is unsure', async () => {
    const { store, ctx, handler } = await setup({ a: [1, 0], b: [1, 0], c: [1, 0] },
      async (s) => s.state.includes('"a"') ? { key: 'different', p: 0.9 } : { key: 'same', p: 0.4 });
    store.saveCommitments([c('call-1-c1', 'a'), c('call-1-c2', 'b'), c('call-1-c3', 'c')]);
    await handler({ dealId: 'd' }, ctx);
    expect(store.getCommitmentsByDeal('d')).toHaveLength(3);
  });

  it('falls back to embedding similarity when the decide server is down', async () => {
    const { store, ctx, handler } = await setup({ a: [1, 0] }, async () => { throw new Error('ECONNREFUSED'); });
    store.saveCommitments([c('call-1-c1', 'a'), c('call-2-c1', 'a')]);
    await handler({ dealId: 'd' }, ctx);
    expect(store.getCommitmentsByDeal('d')).toHaveLength(1);
    expect(ctx.log.warn).toHaveBeenCalled();
  });
});
