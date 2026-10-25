import { describe, expect, it, vi } from 'vitest';
import type { Commitment, Ctx } from '@pact/core';
import { handler } from '../handler.js';

const commitments: Commitment[] = [
  { id: 'c1', dealId: 'hertz-demo', text: 'search, reserve, receipt',
    quote: { transcriptId: 'call-1', t: 95, text: 'full booking flow' } },
  { id: 'c2', dealId: 'hertz-demo', text: 'tablet support',
    quote: { transcriptId: 'call-3', t: 760, text: 'it has to work on tablets' } },
  { id: 'c3', dealId: 'hertz-demo', text: 'fuel-level column',
    quote: { transcriptId: 'status-1', t: 180, text: 'a fuel-level column on the results grid' } },
];

// The model: covers c1 and c2 on one line (plus a bogus id it must not trust),
// tries to also re-claim c1 on a second line (must not duplicate it there),
// and never mentions c3 — code must still cover c3.
const modelLines = [
  { id: '§1.1', title: 'Booking + tablet', criterion: 'works 768-1024px', commitmentIds: ['c1', 'c2', 'nope'] },
  { id: '§1.2', title: 'Booking again', criterion: 'also works', commitmentIds: ['c1'] },
];

function fakeCtx() {
  const saveOrder: string[] = [];
  const sowSnapshots: unknown[] = [];
  const emitted: { topic: string; payload: unknown }[] = [];
  const ctx = {
    store: {
      getCommitmentsByDeal: vi.fn().mockResolvedValue(commitments),
      saveSow: vi.fn((sow: unknown) => { saveOrder.push('save'); sowSnapshots.push(JSON.parse(JSON.stringify(sow))); return sow; }),
    },
    bus: { emit: vi.fn(async (topic: string, payload: unknown) => { saveOrder.push('emit'); emitted.push({ topic, payload }); }) },
    llm: {
      jsonLines: vi.fn(async ({ onItem }: { onItem: (i: unknown) => Promise<unknown> }) => {
        for (const line of modelLines) await onItem(line);
        return modelLines;
      }),
    },
    readPrompt: vi.fn().mockResolvedValue('system prompt'),
  } as unknown as Ctx;
  return { ctx, saveOrder, sowSnapshots, emitted };
}

describe('draft-sow', () => {
  it('saves each line before publishing sow.line.drafted, in order', async () => {
    const { ctx, saveOrder, emitted } = fakeCtx();
    await handler({ dealId: 'hertz-demo' }, ctx);
    const lineDraftedCount = emitted.filter((e) => e.topic === 'sow.line.drafted').length;
    // every sow.line.drafted is a 'save' immediately followed by its 'emit'
    for (let i = 0; i < lineDraftedCount * 2; i += 2) {
      expect(saveOrder[i]).toBe('save');
      expect(saveOrder[i + 1]).toBe('emit');
    }
    // sow.drafted (no matching save) comes last, after every line is saved
    expect(saveOrder.at(-1)).toBe('emit');
    expect(emitted.at(-1)!.topic).toBe('sow.drafted');
  });

  it('puts every commitmentId on exactly one line, appending any the model missed', async () => {
    const { ctx } = fakeCtx();
    const { sow } = await handler({ dealId: 'hertz-demo' }, ctx);
    const allIds = sow.lines.flatMap((l) => l.commitmentIds);
    expect(allIds.sort()).toEqual(['c1', 'c2', 'c3']);
    // c1 appears on exactly one line, not both §1.1 and §1.2
    expect(allIds.filter((id) => id === 'c1')).toHaveLength(1);
    // c3 (never mentioned by the model) got its own appended line
    const c3Line = sow.lines.find((l) => l.commitmentIds.includes('c3'))!;
    expect(c3Line).toBeDefined();
    expect(c3Line.id).not.toBe('§1.1');
  });

  it('emits sow.drafted {dealId, version} once, after all lines are in', async () => {
    const { ctx, emitted } = fakeCtx();
    await handler({ dealId: 'hertz-demo' }, ctx);
    const drafted = emitted.filter((e) => e.topic === 'sow.drafted');
    expect(drafted).toEqual([{ topic: 'sow.drafted', payload: { dealId: 'hertz-demo', version: 1 } }]);
    expect(emitted.at(-1)).toEqual(drafted[0]);
  });
});
