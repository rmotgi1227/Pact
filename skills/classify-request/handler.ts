// goal A4 (Aryan). See build-plan.md, Phase F/F2.
import type { Ctx, Skill, SowLine } from '@pact/core';
import { must } from '@pact/core';
import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { CrLineOutput, FindRequestsOutput } from '../../prompts/classify-request/schema.js';

// Effort by request category. Tev1 picks the category; code owns the numbers.
const EFFORT: Record<string, string | null> = {
  ui_change: '0.5-1 eng-days', new_field: '2-3 eng-days', new_screen: '3-5 eng-days',
  report_or_export: '1-2 eng-days', integration: '5-10 eng-days', other: null, // null -> "[needs estimate]"
};
const MIN_P = Number(process.env.PACT_DECIDE_MIN_P ?? 0.7);
type Cand = Pick<SowLine, 'id' | 'criterion'>;

export const handler: Skill<{ transcriptId: string }, { crIds: string[] }> = async ({ transcriptId }, ctx) => {
  const transcript = must(ctx.store.getTranscript(transcriptId), `transcript ${transcriptId}`);
  if (transcript.kind !== 'status') return { crIds: [] }; // sales calls go to capture-commitments
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
    const cands: Cand[] = (await ctx.llm.embedTopK(req.text, sow.lines, 5)).map((c) => ({ id: c.id, criterion: c.criterion }));

    // 2. Tev1 decides scope. Unsure (or Tev1 down) -> Qwen once -> still not clearly new -> Maya reviews.
    const { verdict, p } = await scopeVerdict(`${req.speaker}: "${req.text}"`, cands, ctx);
    if (verdict.startsWith('covered:')) { ctx.log.info(`covered by ${verdict.slice(8)}`, { p }); continue; }

    const category = await pickCategory(req.text, ctx);
    const ack = ackIndex !== null ? lines[ackIndex] : undefined;
    const cr = ctx.store.createChangeRequest({
      dealId: transcript.dealId,
      request: req.text,
      quote: { transcriptId, t: req.t, text: req.text },                       // the customer's exact words
      ack: ack ? { transcriptId, t: ack.t, text: ack.text } : undefined,        // the team's exact "sure"
      estimate: EFFORT[category] ?? null,
      needsReview: verdict !== 'new_scope',                                    // partial -> Maya decides
    });
    ctx.log.info(`Not in the SOW: change request drafted (${category})`, { crId: cr.id });
    await ctx.bus.emit('cr.drafted', { crId: cr.id }); // -> request-cr-approval emails the operator
    crIds.push(cr.id);
  }
  return { crIds };
};

const sure = (d: { key: string; p: number | null }) => d.key !== 'unclear' && (d.p === null || d.p >= MIN_P);

async function scopeVerdict(request: string, cands: Cand[], ctx: Ctx): Promise<{ verdict: string; p: number | null }> {
  const options = [
    ...cands.map((c) => ({ key: `covered:${c.id}`, label: `Yes, ${c.id} already requires it` })),
    { key: 'partial', label: 'Partly: a SOW line touches it but does not fully require it' },
    { key: 'new_scope', label: 'No: this is new work not in the SOW' },
  ];
  try {
    const d = await ctx.decide.choose({
      state: `Customer request (status call) ${request}\n\nSOW lines:\n` + cands.map((c) => `${c.id}: ${c.criterion}`).join('\n'),
      question: 'Does an existing SOW line already require what the customer is asking for?', options,
    });
    if (sure(d)) return { verdict: d.key, p: d.p };
    ctx.log.info('Tev1 unsure, asking Qwen', { key: d.key, p: d.p });
  } catch (err) {
    ctx.log.warn('decide unavailable, asking Qwen', err);
  }
  const keys = options.map((o) => o.key) as [string, ...string[]];
  const out = await ctx.llm.json({
    role: 'reasoning', schema: z.object({ verdict: z.enum(keys) }),
    system: 'Decide if the customer request is already required by one of these SOW lines. ' +
      `covered:<id> = that line already requires it; partial = a line touches it but does not fully require it; new_scope = new work. ` +
      `Answer with one of: ${keys.join(', ')}. Strict JSON {"verdict": "..."}.`,
    user: JSON.stringify({ request, sow: cands }),
  });
  return { verdict: out.verdict, p: null };
}

// Effort for any out-of-scope request (status-call asks here, out-of-scope tickets in triage-ticket).
export const estimateFor = async (text: string, ctx: Ctx) => EFFORT[await pickCategory(text, ctx)] ?? null;

async function pickCategory(text: string, ctx: Ctx): Promise<string> {
  const keys = Object.keys(EFFORT) as [string, ...string[]];
  try {
    const d = await ctx.decide.choose({ state: `Request: "${text}"`, question: 'What kind of work is this?',
      options: keys.map((k) => ({ key: k, label: k.replace(/_/g, ' ') })) });
    if (sure(d)) return d.key;
  } catch (err) {
    ctx.log.warn('decide unavailable, asking Qwen for the category', err);
  }
  const out = await ctx.llm.json({ role: 'reasoning', schema: z.object({ category: z.enum(keys) }),
    system: `Classify the kind of work in this request. Answer with one of: ${keys.join(', ')}. Strict JSON {"category": "..."}.`,
    user: text });
  return out.category;
}

// cr.approved -> approve the CR, add the SOW line (new, already-approved version), re-fire sow.approved
export const onCrApproved: Skill<{ crId: string }, void> = async ({ crId }, ctx) => {
  const cr = must(ctx.store.getChangeRequest(crId), `change request ${crId}`);
  if (cr.status === 'approved') return;
  const { title, criterion } = await ctx.llm.json({
    role: 'reasoning', schema: CrLineOutput, system: await readFile(new URL('../../prompts/classify-request/cr-line.md', import.meta.url), 'utf8'), user: cr.request,
  });
  ctx.store.approveChangeRequest(crId);
  const sow = ctx.store.addSowLine(cr.dealId, { title, criterion, commitmentIds: [] });
  ctx.log.info(`SOW v${sow.version}: added "${title}"`, { crId });
  await ctx.bus.emit('sow.approved', { dealId: cr.dealId, version: sow.version });
};
