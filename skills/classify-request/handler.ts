// implemented by Rishab's loop; Aryan owns going forward. See build-plan.md, Phase F/F2.
import type { Skill, Ctx, SowLine } from '@pact/core';
import { must } from '@pact/core';
import { z } from 'zod';
import { FindRequestsOutput } from '../../prompts/classify-request/schema.js';

// Effort by request category. Tev1 picks the category; code owns the numbers.
const EFFORT: Record<string, string | null> = {
  ui_change: '0.5-1 eng-days', new_field: '2-3 eng-days', new_screen: '3-5 eng-days',
  report_or_export: '1-2 eng-days', integration: '5-10 eng-days', other: null, // null -> "[needs estimate]"
};
const MIN_P = Number(process.env.PACT_DECIDE_MIN_P ?? 0.7);

export const handler: Skill<{ transcriptId: string }, { crIds: string[] }> =
  async ({ transcriptId }, ctx) => {
    const transcript = must(ctx.store.getTranscript(transcriptId), 'transcript');
    if (transcript.kind !== 'status') return { crIds: [] };
    const sow = must(ctx.store.getApprovedSow(transcript.dealId), 'approved SOW');
    const lines = transcript.lines;

    // 1. Qwen reads the whole call once: which lines are requests, and who agreed.
    const found = await ctx.llm.json({
      role: 'reasoning', system: await ctx.readPrompt('classify-request'), schema: FindRequestsOutput,
      user: lines.map((l, i) => `[${i}] ${l.speaker}: ${l.text}`).join('\n'),
    });

    const crIds: string[] = [];
    for (const { requestIndex, ackIndex } of found.items) {
      const req = lines[requestIndex];
      if (!req) continue;
      const cands = await ctx.llm.embedTopK(req.text, sow.lines, 5);

      // 2. Tev1 decides scope (Phase F2). Unsure -> Qwen once -> still unsure -> Maya reviews.
      const d = await ctx.decide.choose({
        state: `Customer request (${req.speaker}): "${req.text}"\n\nSOW lines:\n` + cands.map((c) => `${c.id}: ${c.criterion}`).join('\n'),
        question: 'Does an existing SOW line already require what the customer is asking for?',
        options: [
          ...cands.map((c) => ({ key: `covered:${c.id}`, label: `Yes, ${c.id} already requires it` })),
          { key: 'partial', label: 'Partly: a SOW line touches it but does not fully require it' },
          { key: 'new_scope', label: 'No: this is new work not in the SOW' },
        ],
      });
      const sure = d.key !== 'unclear' && (d.p === null || d.p >= MIN_P);
      const verdict = sure ? d.key : await escalateToQwen(req.text, cands, ctx); // same keys
      if (verdict.startsWith('covered:')) { ctx.log.info(`covered by ${verdict.slice(8)}`, { p: d.p }); continue; }

      const cat = await ctx.decide.choose({
        state: `Request: "${req.text}"`, question: 'What kind of work is this?',
        options: Object.keys(EFFORT).map((k) => ({ key: k, label: k.replace(/_/g, ' ') })),
      });
      const ack = ackIndex !== null ? lines[ackIndex] : undefined;
      const cr = ctx.store.createChangeRequest({
        dealId: transcript.dealId,
        request: req.text,
        quote: { transcriptId, t: req.t, text: req.text },                        // Dana's exact words
        ack: ack ? { transcriptId, t: ack.t, text: ack.text } : undefined,         // Raj's exact "sure"
        estimate: EFFORT[cat.key] ?? null,
        needsReview: verdict !== 'new_scope',                                     // partial/unclear -> Maya decides
      });
      crIds.push(cr.id);
    }
    return { crIds };
  };

// Second opinion for unsure cases: Qwen with thinking on, same option keys.
async function escalateToQwen(text: string, cands: SowLine[], ctx: Ctx) {
  const keys = [...cands.map((c) => `covered:${c.id}`), 'partial', 'new_scope'] as unknown as [string, ...string[]];
  const out = await ctx.llm.json({
    role: 'reasoning', schema: z.object({ verdict: z.enum(keys) }),
    system: `Decide if the request is already required by one of these SOW lines. Answer with one of: ${keys.join(', ')}. Strict JSON {"verdict": "..."}.`,
    user: JSON.stringify({ request: text, sow: cands.map((c) => ({ id: c.id, criterion: c.criterion })) }),
  });
  return out.verdict;
}

// cr.approved -> approve the CR, add the SOW line, re-fire sow.approved
export const onCrApproved: Skill<{ crId: string }, void> =
  async ({ crId }, ctx) => {
    const cr = must(ctx.store.getChangeRequest(crId), 'change request');
    ctx.store.approveChangeRequest(crId);
    const sow = must(ctx.store.getApprovedSow(cr.dealId), 'approved SOW');
    ctx.store.addSowLine(cr.dealId, { sowVersion: sow.version + 1, title: cr.request, criterion: cr.request, commitmentIds: [] });
    const v2 = ctx.store.approveSow(cr.dealId, sow.version + 1);
    ctx.bus.emit('sow.approved', { dealId: cr.dealId, version: v2.version });
  };
