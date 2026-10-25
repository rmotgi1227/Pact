// implemented by Rishab's loop for R3; Aryan owns going forward. See build-plan.md, Phase C.
import type { Skill } from '@pact/core';
import { must } from '@pact/core';
import type { Transcript, Commitment } from '@pact/core';
import { CaptureCommitmentsOut } from '../../prompts/capture-commitments/schema.js';

type In = { transcriptId: string };
type Out = { commitmentIds: string[] };

export const handler: Skill<In, Out> = async ({ transcriptId }, ctx) => {
  const transcript = must(await ctx.store.getTranscript(transcriptId), `transcript ${transcriptId}`) as Transcript;
  const system = await ctx.readPrompt('capture-commitments');
  const user = transcript.lines.map((l, i) => `[${i}] ${l.speaker}: ${l.text}`).join('\n');

  const { items } = await ctx.llm.json({ role: 'reasoning', system, user, schema: CaptureCommitmentsOut });

  // Code owns the quote, not the model: copy the line verbatim, and the model's
  // lineIndex is untrusted — clamp it into the transcript before trusting it.
  const commitments: Commitment[] = items
    .filter(({ lineIndex }) => lineIndex >= 0 && lineIndex < transcript.lines.length)
    .map(({ lineIndex, summary }) => {
      const line = transcript.lines[lineIndex];
      return {
        id: `${transcript.id}-c${lineIndex}`,
        dealId: transcript.dealId,
        text: summary,
        quote: { transcriptId: transcript.id, t: line.t, text: line.text },
      };
    });

  await ctx.store.saveCommitments(commitments);
  return { commitmentIds: commitments.map((c) => c.id) };
};
