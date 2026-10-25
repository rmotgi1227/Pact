import { describe, expect, it, vi } from 'vitest';
import type { Ctx, Transcript } from '@pact/core';
import { handler } from '../handler.js';

const transcript: Transcript = {
  id: 'call-3',
  dealId: 'hertz-demo',
  kind: 'sales',
  lines: [
    { t: 40, speaker: 'Sam', text: 'So to confirm, this covers the full booking flow.' },
    { t: 760, speaker: 'Dana', text: "One thing that's non-negotiable: it has to work on tablets. Our counter staff use iPads all shift." },
  ],
};

function fakeCtx(items: { lineIndex: number; summary: string }[]) {
  const saved: unknown[] = [];
  const ctx = {
    store: {
      getTranscript: vi.fn().mockResolvedValue(transcript),
      saveCommitments: vi.fn((cs: unknown[]) => { saved.push(...cs); return cs; }),
      put: vi.fn(), // marks the transcript as captured
    },
    llm: { json: vi.fn().mockResolvedValue({ items }) },
    readPrompt: vi.fn().mockResolvedValue('system prompt'),
  } as unknown as Ctx;
  return { ctx, saved };
}

describe('capture-commitments', () => {
  it('copies the exact tablet quote at its line, with a bounded lineIndex', async () => {
    const { ctx, saved } = fakeCtx([{ lineIndex: 1, summary: 'Must work on tablets (iPads)' }]);
    const out = await handler({ transcriptId: 'call-3' }, ctx);
    expect(out.commitmentIds).toEqual(['call-3-c1']);
    expect(saved).toEqual([{
      id: 'call-3-c1', dealId: 'hertz-demo', text: 'Must work on tablets (iPads)',
      quote: { transcriptId: 'call-3', t: 760, text: transcript.lines[1].text },
    }]);
  });

  it('drops a lineIndex outside the transcript instead of crashing', async () => {
    const { ctx, saved } = fakeCtx([
      { lineIndex: 0, summary: 'Full booking flow' },
      { lineIndex: 99, summary: 'model invented this index' },
      { lineIndex: -1, summary: 'also invented' },
    ]);
    const out = await handler({ transcriptId: 'call-3' }, ctx);
    expect(out.commitmentIds).toEqual(['call-3-c0']);
    expect(saved).toHaveLength(1);
  });
});
