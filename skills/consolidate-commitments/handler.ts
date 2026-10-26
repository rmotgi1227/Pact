// goal A2 (Aryan). See build-plan.md, Phase C and F2.
import type { Skill, Commitment, Ctx } from '@pact/core';

type In = { dealId: string };
type Out = { groups: Commitment[][] };

// Embeddings only nominate candidate pairs; Tev1 (ctx.decide) decides if they are the same promise.
const SIM_THRESHOLD = Number(process.env.PACT_SIM_THRESHOLD ?? 0.86);
const MIN_P = Number(process.env.PACT_DECIDE_MIN_P ?? 0.7);

// Closed Won often comes seconds after the last call is dropped. Wait until every sales call on the
// deal has been captured, so the SOW never misses the newest promises (e.g. call 3's tablet line).
async function waitForCapture(dealId: string, ctx: Ctx, timeoutMs = 600_000) { // all calls are read at Closed Won
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
  const calls = ctx.store.listTranscripts(dealId).filter((t) => t.kind === 'sales').length;
  ctx.log.info(`Re-reading ${calls} calls`);
  const vectors = commitments.length ? await ctx.llm.embed(commitments.map((c) => c.text)) : [];

  const groups: Commitment[][] = [];
  const used = new Set<number>();
  for (let i = 0; i < commitments.length; i++) {
    if (used.has(i)) continue;
    const group = [commitments[i]];
    used.add(i);
    for (let j = i + 1; j < commitments.length; j++) {
      if (used.has(j) || cosineSim(vectors[i], vectors[j]) < SIM_THRESHOLD) continue;
      const d = await sameOrNot(commitments[i], commitments[j], ctx);
      if (d.key === 'same' && (d.p === null || d.p >= MIN_P)) { group.push(commitments[j]); used.add(j); }
    }
    groups.push(group);
  }

  // Each group collapses to one commitment that keeps every source quote.
  const merged: Commitment[] = groups.map(([first, ...rest]) =>
    rest.length === 0 ? first
      : { ...first, quotes: [...(first.quotes ?? [first.quote]), ...rest.flatMap((c) => c.quotes ?? [c.quote])] },
  );
  ctx.store.replaceCommitments(dealId, merged);
  ctx.log.info(`${merged.length} commitments (${commitments.length - merged.length} duplicates merged)`);
  await ctx.bus.emit('commitments.consolidated', { dealId });
  return { groups };
};

// Tev1 decides. If the decision server is down, the embedding match alone stands (logged, so it's visible).
async function sameOrNot(a: Commitment, b: Commitment, ctx: Ctx) {
  try {
    return await ctx.decide.choose({
      state: `Commitment A: "${a.text}" (quote: "${a.quote.text}")\nCommitment B: "${b.text}" (quote: "${b.quote.text}")`,
      question: 'Do these two commitments promise the same thing?',
      options: [{ key: 'same', label: 'Yes, same promise' }, { key: 'different', label: 'No, different promises' }],
    });
  } catch (err) {
    ctx.log.warn('decide unavailable, merging on embedding similarity alone', err);
    return { key: 'same', p: null };
  }
}

function cosineSim(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
