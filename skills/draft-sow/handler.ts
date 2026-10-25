// goal R3 (Rishab). See build-plan.md, Phase C.
import type { Skill } from '@pact/core';
import type { Commitment, Sow, SowLine } from '@pact/core';
import { DraftSowLine } from '../../prompts/draft-sow/schema.js';

type In = { dealId: string };
type Out = { sow: Sow };

export const handler: Skill<In, Out> = async ({ dealId }, ctx) => {
  const commitments: Commitment[] = await ctx.store.getCommitmentsByDeal(dealId);
  const system = await ctx.readPrompt('draft-sow');
  const user = commitments.map((c) => `${c.id}: ${c.text} ("${c.quote.text}")`).join('\n');

  const validIds = new Set(commitments.map((c) => c.id));
  const covered = new Set<string>();
  const sow: Sow = { dealId, version: 1, status: 'draft', lines: [] };

  // Real streaming: each line is saved and then emitted the moment the model
  // finishes it, so /state shows the SOW growing line by line.
  const saveLine = async (line: SowLine) => {
    sow.lines = [...sow.lines, line];
    await ctx.store.saveSow(sow);
    await ctx.bus.emit('sow.line.drafted', { dealId, line });
  };

  await ctx.llm.jsonLines({
    role: 'reasoning',
    system,
    user,
    itemSchema: DraftSowLine,
    onItem: async (item) => {
      // commitmentIds on exactly one line: drop ids the model invented, and
      // drop any id this draft has already placed on an earlier line.
      const commitmentIds = item.commitmentIds.filter((id) => validIds.has(id) && !covered.has(id));
      commitmentIds.forEach((id) => covered.add(id));
      await saveLine({ ...item, commitmentIds, sowVersion: 1 });
    },
  });

  // Nothing is silently dropped: code checks coverage after the model's
  // lines land, and any commitment it missed gets its own line.
  for (const c of commitments) {
    if (covered.has(c.id)) continue;
    covered.add(c.id);
    await saveLine({
      id: `§${sow.lines.length + 1}`,
      sowVersion: 1,
      title: c.text,
      criterion: `Verifiable against the sales quote: "${c.quote.text}"`,
      commitmentIds: [c.id],
    });
  }

  await ctx.bus.emit('sow.drafted', { dealId, version: sow.version });
  return { sow };
};
