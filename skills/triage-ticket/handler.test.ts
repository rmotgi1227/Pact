import { describe, expect, it, vi } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const line = (id: string, criterion: string) => ({ id, sowVersion: 1, title: id, criterion, commitmentIds: [] });

async function setup(decide: () => Promise<any>, pass: boolean, json = async () => ({ sowLineId: null, reason: 'Export is not in the SOW.' })) {
  process.env.PACT_DB = join(await mkdtemp(join(tmpdir(), 'pact-a5-')), 'pact.db');
  vi.resetModules();
  const { store } = await import('@pact/core');
  const emitted: any[] = [];
  const ctx = { store, bus: { emit: async (topic: string, p: object) => { emitted.push({ topic, p }); } },
    llm: { json: vi.fn(json), embedTopK: vi.fn(async (_q: string, items: any[], k: number) => items.slice(0, k)) },
    decide: { choose: vi.fn(decide) }, readPrompt: async () => 'p',
    github: { getHeadSha: vi.fn(async () => 'mainsha') },
    builder: { testRef: vi.fn(async () => ({ id: 'run1', buildId: 'b1', at: 1, results: [{ testId: 't_3_1', pass }] })) },
    log: { info: () => {}, warn: () => {}, error: () => {} } } as any;
  const { handler } = await import('./handler.js');
  store.saveSow({ dealId: 'hertz-demo', version: 1, status: 'approved', lines: [line('§1.1', 'Search filters'), line('§3.1', 'Booking works at 768-1024px')] });
  store.saveAcceptanceTest({ id: 't_3_1', dealId: 'hertz-demo', sowLineId: '§3.1', file: 'f', status: 'green' });
  store.setGreenBy('t_3_1', { prNumber: 34, author: 'priya' });
  return { store, ctx, emitted, handler };
}

describe('triage-ticket', () => {
  it('iPad ticket -> §3.1 test fails on current main -> warranty, routed to Priya', async () => {
    const { store, ctx, emitted, handler } = await setup(async () => ({ key: '§3.1', p: 0.92 }), false);
    const t = store.createTicket({ dealId: 'hertz-demo', text: 'Booking broken on my iPad' });
    expect(await handler({ ticketId: t.id }, ctx)).toEqual({ verdict: 'warranty' });
    expect(ctx.builder.testRef).toHaveBeenCalledWith('hertz-demo', 'mainsha', ctx);
    expect(store.getTicket(t.id)).toMatchObject({ status: 'triaged', verdict: 'warranty', sowLineId: '§3.1', testId: 't_3_1', buildId: 'b1', assignee: 'priya' });
    expect(emitted).toEqual([{ topic: 'ticket.triaged', p: { ticketId: t.id, verdict: 'warranty' } }]);
  });

  it('test passes on main -> not_reproduced, no assignee', async () => {
    const { store, ctx, handler } = await setup(async () => ({ key: '§3.1', p: 0.92 }), true);
    const t = store.createTicket({ dealId: 'hertz-demo', text: 'Booking broken on my iPad' });
    expect(await handler({ ticketId: t.id }, ctx)).toEqual({ verdict: 'not_reproduced' });
    expect(store.getTicket(t.id)!.assignee).toBeUndefined();
  });

  it('Excel ticket -> none -> change_request without running a build; decide down -> Qwen', async () => {
    const { store, ctx, handler } = await setup(async () => { throw new Error('down'); }, false);
    const t = store.createTicket({ dealId: 'hertz-demo', text: 'Can we export bookings to Excel?' });
    expect(await handler({ ticketId: t.id }, ctx)).toEqual({ verdict: 'change_request' });
    expect(ctx.builder.testRef).not.toHaveBeenCalled();
  });

  it('drops an id the model invents', async () => {
    const { store, ctx, handler } = await setup(async () => ({ key: 'unclear', p: null }), false, async () => ({ sowLineId: '§9.9', reason: 'x' }) as any);
    const t = store.createTicket({ dealId: 'hertz-demo', text: 'something' });
    expect(await handler({ ticketId: t.id }, ctx)).toEqual({ verdict: 'change_request' });
  });
});
