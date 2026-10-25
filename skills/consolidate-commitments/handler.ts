// implemented by Rishab's loop for R3; Aryan owns going forward. See build-plan.md, Phase C.
import type { Skill } from '@pact/core';
import type { Commitment } from '@pact/core';

type In = { dealId: string };
type Out = { groups: Commitment[][] };

const SIM_THRESHOLD = Number(process.env.PACT_SIM_THRESHOLD ?? 0.86); // starting value; check it on the real calls

// Closed Won often comes seconds after the last call is dropped. Wait until every sales call on the
// deal has been captured, so the SOW never misses the newest promises (e.g. call 3's tablet line).
async function waitForCapture(dealId: string, ctx: Parameters<Skill<In, Out>>[1], timeoutMs = 180_000) {
  const start = Date.now();
  for (;;) {
    const pending = ctx.store.listTranscripts(dealId)
      .filter((t) => t.kind === 'sales' && ctx.store.get('captured', t.id) === undefined);
    if (pending.length === 0) return;
    if (Date.now() - start > timeoutMs) { ctx.log.warn(`still capturing ${pending.map((t) => t.id).join(', ')}; drafting anyway`); return; }
    await new Promise((r) => setTimeout(r, 1000));
  }
}

export const handler: Skill<In, Out> = async ({ dealId }, ctx) => {
  await waitForCapture(dealId, ctx);
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
