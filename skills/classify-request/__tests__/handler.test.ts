// implemented by Rishab's loop; Aryan owns going forward. See build-plan.md, Phase F/F2.
import { describe, expect, it, vi } from 'vitest';
import type { ChangeRequest, Ctx, Sow, Transcript } from '@pact/core';
import { handler, onCrApproved } from '../handler.js';

const sowLines = [
  { id: '§1.2', sowVersion: 1, title: 'Results grid', criterion: 'Search results show every matching car as a card in a results grid with price, car class and a Book button.', commitmentIds: [] },
  { id: '§3.1', sowVersion: 1, title: 'Tablet', criterion: 'Booking flow works at tablet width 768-1024px.', commitmentIds: [] },
];
const sow: Sow = { dealId: 'hertz-demo', version: 1, status: 'approved', lines: sowLines };

const statusTranscript: Transcript = {
  id: 'status-1', dealId: 'hertz-demo', kind: 'status',
  lines: [
    { t: 15, speaker: 'Raj', text: 'Hey Dana, quick status check-in before the sprint review.' },
    { t: 180, speaker: 'Dana', text: 'One thing — can we get a fuel-level column on the results grid? Ops keeps asking about it.' },
    { t: 195, speaker: 'Raj', text: 'Sure, we can add that.' },
  ],
};

function fakeCtx(opts: { decideKey: string; decideP: number | null; catKey?: string; qwenVerdict?: string }) {
  const created: Omit<ChangeRequest, 'id' | 'status'>[] = [];
  const ctx = {
    store: {
      getTranscript: vi.fn().mockReturnValue(statusTranscript),
      getApprovedSow: vi.fn().mockReturnValue(sow),
      createChangeRequest: vi.fn((cr: Omit<ChangeRequest, 'id' | 'status'>) => { created.push(cr); return { ...cr, id: 'cr_1', status: 'draft' as const }; }),
    },
    bus: { emit: vi.fn() }, // cr.drafted -> request-cr-approval
    llm: {
      json: vi.fn()
        .mockResolvedValueOnce({ items: [{ requestIndex: 1, ackIndex: 2 }] }) // find-requests pass
        .mockResolvedValue({ verdict: opts.qwenVerdict ?? 'new_scope' }),      // escalation pass, if reached
      embedTopK: vi.fn().mockResolvedValue(sowLines),
    },
    decide: {
      choose: vi.fn()
        .mockResolvedValueOnce({ key: opts.decideKey, p: opts.decideP })
        .mockResolvedValue({ key: opts.catKey ?? 'ui_change', p: 0.95 }),
    },
    readPrompt: vi.fn().mockResolvedValue('system prompt'),
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  } as unknown as Ctx;
  return { ctx, created };
}

describe('classify-request', () => {
  it('fuel-column ask -> new_scope (sure) -> CR drafted with Dana\'s exact quote and Raj\'s ack', async () => {
    const { ctx, created } = fakeCtx({ decideKey: 'new_scope', decideP: 0.9 });
    const { crIds } = await handler({ transcriptId: 'status-1' }, ctx);
    expect(crIds).toEqual(['cr_1']);
    expect(created).toHaveLength(1);
    const cr = created[0];
    expect(cr.quote).toEqual({ transcriptId: 'status-1', t: 180, text: statusTranscript.lines[1].text });
    expect(cr.ack).toEqual({ transcriptId: 'status-1', t: 195, text: statusTranscript.lines[2].text });
    expect(cr.estimate).toBe('0.5-1 eng-days');
    expect(cr.needsReview).toBe(false);
  });

  it('request covered by an existing SOW line -> no CR created, logs covered', async () => {
    const { ctx, created } = fakeCtx({ decideKey: 'covered:§1.2', decideP: 0.9 });
    const { crIds } = await handler({ transcriptId: 'status-1' }, ctx);
    expect(crIds).toEqual([]);
    expect(created).toHaveLength(0);
    expect(ctx.log.info).toHaveBeenCalledWith('covered by §1.2', { p: 0.9 });
  });

  it('low-confidence decision escalates to Qwen once, and uses its verdict', async () => {
    const { ctx, created } = fakeCtx({ decideKey: 'new_scope', decideP: 0.4, qwenVerdict: 'partial' });
    const { crIds } = await handler({ transcriptId: 'status-1' }, ctx);
    expect(ctx.llm.json).toHaveBeenCalledTimes(2); // find-requests + escalation
    expect(crIds).toEqual(['cr_1']);
    expect(created[0].needsReview).toBe(true); // partial -> Maya reviews
  });

  it('non-status transcripts are skipped entirely', async () => {
    const { ctx } = fakeCtx({ decideKey: 'new_scope', decideP: 0.9 });
    ctx.store.getTranscript = vi.fn().mockReturnValue({ ...statusTranscript, kind: 'sales' });
    const { crIds } = await handler({ transcriptId: 'status-1' }, ctx);
    expect(crIds).toEqual([]);
    expect(ctx.llm.json).not.toHaveBeenCalled();
  });
});

describe('onCrApproved', () => {
  it('approves the CR, adds a SOW line, approves the new version, and re-fires sow.approved', async () => {
    const cr: ChangeRequest = {
      id: 'cr_1', dealId: 'hertz-demo', request: 'fuel-level column',
      quote: { transcriptId: 'status-1', t: 180, text: 'fuel-level column' },
      estimate: '0.5-1 eng-days', needsReview: false, status: 'draft',
    };
    const v2Sow: Sow = { dealId: 'hertz-demo', version: 2, status: 'approved', lines: [...sowLines, { id: 'line_1', sowVersion: 2, title: cr.request, criterion: cr.request, commitmentIds: [] }] };
    const ctx = {
      store: {
        getChangeRequest: vi.fn().mockReturnValue(cr),
        approveChangeRequest: vi.fn(),
        getApprovedSow: vi.fn().mockReturnValue(sow),
        addSowLine: vi.fn().mockReturnValue(v2Sow),
      },
      llm: { json: vi.fn().mockResolvedValue({ title: 'Fuel level column', criterion: 'Each result card shows the fuel level.' }) },
      log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      bus: { emit: vi.fn() },
    } as unknown as Ctx;
    await onCrApproved({ crId: 'cr_1' }, ctx);
    expect(ctx.store.approveChangeRequest).toHaveBeenCalledWith('cr_1');
    // Qwen words a testable criterion for the new line; code adds it as the next (already approved) version
    expect(ctx.store.addSowLine).toHaveBeenCalledWith('hertz-demo', { title: 'Fuel level column', criterion: 'Each result card shows the fuel level.', commitmentIds: [] });
    expect(ctx.bus.emit).toHaveBeenCalledWith('sow.approved', { dealId: 'hertz-demo', version: 2 });
  });
});
