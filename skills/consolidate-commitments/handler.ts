// implemented by Rishab's loop for R3; Aryan owns going forward. See build-plan.md, Phase C.
import type { Skill } from '@pact/core';
import type { Commitment } from '@pact/core';

type In = { dealId: string };
type Out = { groups: Commitment[][] };

const SIM_THRESHOLD = Number(process.env.PACT_SIM_THRESHOLD ?? 0.86); // starting value; check it on the real calls

export const handler: Skill<In, Out> = async ({ dealId }, ctx) => {
  const commitments = await ctx.store.getCommitmentsByDeal(dealId);
  const vectors = await ctx.llm.embed(commitments.map((c) => c.text));

  const groups: Commitment[][] = [];
  const used = new Set<number>();
  for (let i = 0; i < commitments.length; i++) {
    if (used.has(i)) continue;
    const group = [commitments[i]];
    used.add(i);
    for (let j = i + 1; j < commitments.length; j++) {
      if (!used.has(j) && cosineSim(vectors[i], vectors[j]) >= SIM_THRESHOLD) {
        group.push(commitments[j]);
        used.add(j);
      }
    }
    groups.push(group);
  }

  // Merge here, in the handler, instead of asking the store to do it: each
  // group collapses to one commitment that keeps every source quote.
  const merged: Commitment[] = groups.map(([first, ...rest]) =>
    rest.length === 0 ? first : { ...first, quotes: [first.quote, ...rest.map((c) => c.quote)] },
  );
  await ctx.store.replaceCommitments(dealId, merged);
  await ctx.bus.emit('commitments.consolidated', { dealId });
  return { groups };
};

function cosineSim(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
