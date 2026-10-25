// goal A2 (Aryan). See build-plan.md, Phase C.
import type { Skill, Commitment } from '@pact/core';
import { must } from '@pact/core';
import { CaptureCommitmentsOut } from '../../prompts/capture-commitments/schema.js';

type In = { transcriptId: string };
type Out = { commitmentIds: string[] };

export const handler: Skill<In, Out> = async ({ transcriptId }, ctx) => {
  const transcript = must(await ctx.store.getTranscript(transcriptId), `transcript ${transcriptId}`);
  if (transcript.kind !== 'sales') return { commitmentIds: [] }; // status calls go to classify-request
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
};
