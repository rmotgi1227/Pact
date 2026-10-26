import { describe, expect, it, vi } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ChangeOrderOutput } from '../../../prompts/draft-change-order/schema.js';

const line = (id: string, title: string, criterion: string) => ({ id, sowVersion: 1, title, criterion, commitmentIds: [] });
const prose = { summary: 'You will see each car\'s fuel level on the results grid.', scope: 'Add a fuel-level column to the results grid.',
  rationale: 'The signed SOW lists the results grid columns and fuel level is not one of them.', nextSteps: 'Reply to approve this change.' };

async function setup() {
  process.env.PACT_DB = join(await mkdtemp(join(tmpdir(), 'pact-co-')), 'pact.db');
  delete process.env.RESEND_API_KEY; // never send mail from tests
  vi.resetModules();
  const { store } = await import('@pact/core');
  const ctx = { store, llm: { json: vi.fn(async () => prose) }, readPrompt: async () => 'p',
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } } as any;
  store.saveDeal({ id: 'hertz-demo', name: 'Hertz', stage: 'closed_won' });
  store.saveSow({ dealId: 'hertz-demo', version: 2, status: 'approved', lines: [line('§1.1', 'Search', 'Search filters by location'),
    line('§1.9', 'Fuel-level column', 'Results grid shows each car\'s fuel level')] });
  const cr = store.createChangeRequest({ dealId: 'hertz-demo', request: 'Can we get a fuel-level column?', estimate: '2-3 eng-days',
    quote: { transcriptId: 'status-1', t: 180, text: 'Can we get a fuel-level column?' }, ack: { transcriptId: 'status-1', t: 195, text: 'Sure, we can add that.' } });
  store.approveChangeRequest(cr.id);
  return { store, ctx, cr, ...(await import('../handler.js')) };
}

describe('draft-change-order', () => {
  it('Qwen writes the prose; code adds the CO number, estimate, quotes and the new SOW line', async () => {
    const { store, ctx, cr, handler } = await setup();
    expect(await handler({ crId: cr.id }, ctx)).toEqual({ number: 'CO-001' });
    const co = store.getChangeRequest(cr.id)!.changeOrder!;
    expect(co.subject).toBe('Change order CO-001: Fuel-level column');
    for (const s of ['"Can we get a fuel-level column?"', '"Sure, we can add that."', 'on the status call at 3:00',
      'Effort estimate: 2-3 eng-days', 'SOW §1.9 in SOW v2', prose.scope]) expect(co.body).toContain(s);
    expect(co.emailedAt).toBeUndefined(); // no Resend key configured -> drafted, not sent
    expect(ctx.log.warn).toHaveBeenCalled();
  });

  it('drafts once: a redelivered cr.approved reuses the stored change order', async () => {
    const { ctx, cr, handler } = await setup();
    await handler({ crId: cr.id }, ctx);
    await handler({ crId: cr.id }, ctx);
    expect(ctx.llm.json).toHaveBeenCalledTimes(1);
  });

  it('the model cannot put numbers in the prose', () => {
    expect(ChangeOrderOutput.safeParse({ ...prose, scope: 'Add it in 3 days for $500' }).success).toBe(false);
    expect(ChangeOrderOutput.safeParse(prose).success).toBe(true);
  });
});
