// goal A2 (Aryan). See build-plan.md, Phase C.
import type { Skill, Commitment } from '@pact/core';
import { must } from '@pact/core';
import { CaptureCommitmentsOut } from '../../prompts/capture-commitments/schema.js';

type In = { transcriptId: string };
// Pact reads a deal's sales calls when it closes: during negotiation calls are only saved.
type Out = { commitmentIds: string[] };

export const handler: Skill<In, Out> = async ({ transcriptId }, ctx) => {
  const transcript = must(await ctx.store.getTranscript(transcriptId), `transcript ${transcriptId}`);
  if (transcript.kind !== 'sales') return { commitmentIds: [] }; // status calls go to classify-request
  if (ctx.store.getDeal(transcript.dealId)?.stage !== 'closed_won') {
    ctx.log.info(`${transcript.id} saved; Pact reads it when the deal is marked Closed Won`);
    return { commitmentIds: [] };
  }
  return capture(transcriptId, ctx);
};

// deal.closed_won: read every sales call on the deal that hasn't been read yet (consolidate waits for these).
export const onClosedWon: Skill<{ dealId: string }, Out> = async ({ dealId }, ctx) => {
  const pending = ctx.store.listTranscripts(dealId).filter((t) => t.kind === 'sales' && ctx.store.get('captured', t.id) === undefined);
  ctx.log.info(`Closed Won: reading ${pending.length} sales call${pending.length === 1 ? '' : 's'}`);
  const outs = await Promise.all(pending.map((t) => capture(t.id, ctx)));
  return { commitmentIds: outs.flatMap((o) => o.commitmentIds) };
};

async function capture(transcriptId: string, ctx: Parameters<Skill<In, Out>>[1]): Promise<Out> {
  const transcript = must(await ctx.store.getTranscript(transcriptId), `transcript ${transcriptId}`);
  const system = await ctx.readPrompt('capture-commitments');
  const user = transcript.lines.map((l, i) => `[${i}] ${l.speaker}: ${l.text}`).join('\n');

  const { items } = await ctx.llm.json({ role: 'reasoning', system, user, schema: CaptureCommitmentsOut });

  // Code owns the quote, not the model: copy the line verbatim, and the model's
  // lineIndex is untrusted — drop anything outside the transcript or repeated.
  const seen = new Set<number>();
  const commitments: Commitment[] = items
    .filter(({ lineIndex }) => lineIndex >= 0 && lineIndex < transcript.lines.length && !seen.has(lineIndex) && seen.add(lineIndex))
    .map(({ lineIndex, summary }) => {
      const line = transcript.lines[lineIndex];
      return {
        id: `${transcript.id}-c${lineIndex}`,
        dealId: transcript.dealId,
        text: summary,
        quote: { transcriptId: transcript.id, t: line.t, text: line.text },
      };
    });

  ctx.store.saveCommitments(commitments);
  ctx.store.put('captured', transcript.id, { at: Date.now() }); // consolidate waits for every sales call to reach here
  ctx.log.info(`${commitments.length} commitments from ${transcript.id}`);
  return { commitmentIds: commitments.map((c) => c.id) };
}
