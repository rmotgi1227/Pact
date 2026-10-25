import { describe, expect, it, vi } from 'vitest';
import type { Commitment, Ctx } from '@pact/core';
import { handler } from '../handler.js';

const commitments: Commitment[] = [
  { id: 'c1', dealId: 'hertz-demo', text: 'one shared component library for all brands',
    quote: { transcriptId: 'call-1', t: 320, text: 'one shared component library' } },
  { id: 'c2', dealId: 'hertz-demo', text: 'single codebase themed per brand',
    quote: { transcriptId: 'call-2', t: 530, text: 'a single component library themed per brand' } },
  { id: 'c3', dealId: 'hertz-demo', text: 'tablet support for counter staff iPads',
    quote: { transcriptId: 'call-3', t: 760, text: 'it has to work on tablets' } },
];

// c1 and c2 are near-duplicates (cosine ~1), c3 is unrelated (cosine ~0).
const vectors = [[1, 0], [1, 0.001], [0, 1]];

function fakeCtx() {
  const emitted: { topic: string; payload: unknown }[] = [];
  const replaced: { dealId: string; cs: Commitment[] }[] = [];
  const ctx = {
    store: {
      getCommitmentsByDeal: vi.fn().mockResolvedValue(commitments),
      listTranscripts: vi.fn().mockReturnValue([]), // nothing pending capture
      get: vi.fn(),
      replaceCommitments: vi.fn((dealId: string, cs: Commitment[]) => { replaced.push({ dealId, cs }); return cs; }),
    },
    llm: { embed: vi.fn().mockResolvedValue(vectors) },
    decide: { choose: vi.fn().mockResolvedValue({ key: 'same', p: 0.9 }) },
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    bus: { emit: vi.fn(async (topic: string, payload: unknown) => { emitted.push({ topic, payload }); }) },
  } as unknown as Ctx;
  return { ctx, emitted, replaced };
}

describe('consolidate-commitments', () => {
  it('merges near-duplicate commitments via ctx.llm.embed and keeps every source quote', async () => {
    const { ctx, replaced } = fakeCtx();
    const { groups } = await handler({ dealId: 'hertz-demo' }, ctx);
    expect(groups).toHaveLength(2);
    const merged = replaced[0].cs;
    expect(merged).toHaveLength(2);
    const dupe = merged.find((c) => c.id === 'c1')!;
    expect(dupe.quotes).toEqual([commitments[0].quote, commitments[1].quote]);
    const lone = merged.find((c) => c.id === 'c3')!;
    expect(lone.quotes).toBeUndefined();
  });

  it('emits commitments.consolidated {dealId}', async () => {
    const { ctx, emitted } = fakeCtx();
    await handler({ dealId: 'hertz-demo' }, ctx);
    expect(emitted).toEqual([{ topic: 'commitments.consolidated', payload: { dealId: 'hertz-demo' } }]);
  });
});
