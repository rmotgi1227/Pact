import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const line = (id: string, criterion: string) => ({ id, sowVersion: 1, title: id, criterion, commitmentIds: [] });

async function setup(decide: (a: any) => Promise<any>, json: (a: any) => Promise<any>) {
  process.env.PACT_DB = join(await mkdtemp(join(tmpdir(), 'pact-a4-')), 'pact.db');
  vi.resetModules();
  const { store } = await import('@pact/core');
  const emitted: any[] = [];
  const ctx = { store, bus: { emit: async (topic: string, p: object) => { emitted.push({ topic, p }); } },
    llm: { json: vi.fn(json), embedTopK: vi.fn(async (_q: string, items: any[], k: number) => items.slice(0, k)) },
    decide: { choose: vi.fn(decide) }, readPrompt: async () => 'p', log: { info: () => {}, warn: vi.fn(), error: () => {} } } as any;
  const mod = await import('../handler.js');
  const status = JSON.parse(await readFile(new URL('../../../demo/fixtures/status-1.json', import.meta.url), 'utf8'));
  store.saveTranscript(status);
  store.saveSow({ dealId: 'hertz-demo', version: 1, status: 'approved', lines: [line('§1.1', 'Search filters by location'), line('§3.1', 'Works at 768-1024px')] });
  return { store, ctx, emitted, ...mod, status };
}
const found = { items: [{ requestIndex: 2, ackIndex: 3 }] };

describe('classify-request', () => {
  it("fuel-column ask -> new_scope (sure) -> CR with Dana's exact quote and Raj's sure", async () => {
    const { store, ctx, handler, status } = await setup(
      async (a) => (a.question.includes('kind') ? { key: 'new_field', p: 0.9 } : { key: 'new_scope', p: 0.95 }), async () => found);
    const { crIds } = await handler({ transcriptId: 'status-1' }, ctx);
    const cr = store.getChangeRequest(crIds[0])!;
    expect(cr.quote).toEqual({ transcriptId: 'status-1', t: 180, text: status.lines[2].text });
    expect(cr.ack).toEqual({ transcriptId: 'status-1', t: 195, text: 'Sure, we can add that.' });
    expect(cr).toMatchObject({ estimate: '2-3 eng-days', needsReview: false, status: 'draft' });
  });

  it('covered request -> no CR', async () => {
    const { store, ctx, handler } = await setup(async () => ({ key: 'covered:§3.1', p: 0.9 }), async () => found);
    expect((await handler({ transcriptId: 'status-1' }, ctx)).crIds).toEqual([]);
    expect(store.listChangeRequests('hertz-demo')).toEqual([]);
  });

  it('low confidence -> escalates to Qwen once; decide down -> Qwen picks verdict and category', async () => {
    const { ctx, handler } = await setup(async () => { throw new Error('down'); },
      async (a) => a.schema.shape?.items ? found : a.schema.shape?.verdict ? { verdict: 'partial' } : { category: 'other' });
    const { crIds } = await handler({ transcriptId: 'status-1' }, ctx);
    expect(crIds).toHaveLength(1);
    expect(ctx.store.getChangeRequest(crIds[0])).toMatchObject({ needsReview: true, estimate: null });
  });

  it('skips sales calls', async () => {
    const { store, ctx, handler } = await setup(async () => ({}), async () => found);
    store.saveTranscript({ id: 'call-9', dealId: 'hertz-demo', kind: 'sales', lines: [] });
    expect(await handler({ transcriptId: 'call-9' }, ctx)).toEqual({ crIds: [] });
  });
});

describe('cr.approved', () => {
  it('approves the CR, adds a worded SOW line as v2 and re-fires sow.approved', async () => {
    const { store, ctx, emitted, onCrApproved } = await setup(async () => ({}),
      async () => ({ title: 'Fuel level column', criterion: 'Each result card shows the fuel level.' }));
    const cr = store.createChangeRequest({ dealId: 'hertz-demo', request: 'fuel column?', quote: { transcriptId: 'status-1', t: 180, text: 'x' }, estimate: null });
    await onCrApproved({ crId: cr.id }, ctx);
    await onCrApproved({ crId: cr.id }, ctx); // redelivery is a no-op
    expect(store.getChangeRequest(cr.id)!.status).toBe('approved');
    const v2 = store.getSow('hertz-demo')!;
    expect(v2).toMatchObject({ version: 2, status: 'approved' });
    expect(v2.lines.at(-1)).toMatchObject({ title: 'Fuel level column', criterion: 'Each result card shows the fuel level.', sowVersion: 2 });
    expect(emitted).toEqual([{ topic: 'sow.approved', p: { dealId: 'hertz-demo', version: 2 } }]);
  });
});
