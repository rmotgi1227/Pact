// goal A5 (Aryan). Tickets are triaged by running the real acceptance test, not by a model's guess.
// See build-plan.md, Phase F/F2 and "Review round 2: Triage".
import type { Ctx, Skill, SowLine, Ticket } from '@pact/core';
import { must } from '@pact/core';
import { TriageTicketOutput } from '../../prompts/triage-ticket/schema.js';

type Verdict = NonNullable<Ticket['verdict']>;
const MIN_P = Number(process.env.PACT_DECIDE_MIN_P ?? 0.7);

export const handler: Skill<{ ticketId: string }, { verdict: Verdict }> = async ({ ticketId }, ctx) => {
  const ticket = must(ctx.store.getTicket(ticketId), `ticket ${ticketId}`);
  const sow = must(ctx.store.getApprovedSow(ticket.dealId), 'approved SOW');
  const cands = (await ctx.llm.embedTopK(ticket.text, sow.lines, 3)).map((c) => ({ id: c.id, criterion: c.criterion }));
  const { sowLineId, reason } = await pickLine(ticket.text, cands, ctx);

  if (!sowLineId) {
    const r = reason ?? 'No SOW line covers this request.';
    ctx.store.updateTicket(ticketId, { status: 'triaged', verdict: 'change_request', reason: r });
    ctx.log.info('Not in SOW, so it\'s a change request', { ticketId });
    await ctx.bus.emit('ticket.triaged', { ticketId, verdict: 'change_request' });
    return { verdict: 'change_request' };
  }

  const test = must(ctx.store.listAcceptanceTests(ticket.dealId).find((t) => t.sowLineId === sowLineId),
    `acceptance test for SOW ${sowLineId}`);
  // Build and test the CURRENT main HEAD (reusing the poll's build of that exact commit if there is one).
  const sha = await ctx.github.getHeadSha('main');
  ctx.log.info(`Running the SOW ${sowLineId} test against main ${sha.slice(0, 7)}`, { ticketId });
  const run = await ctx.builder.testRef(ticket.dealId, sha, ctx);
  const result = run.results.find((r) => r.testId === test.id) ?? { testId: test.id, pass: false }; // no result = failed

  // FAIL on main -> the defect is real and in scope -> warranty, routed to whoever made the line pass.
  const verdict: Verdict = result.pass ? 'not_reproduced' : 'warranty';
  const assignee = result.pass ? undefined : ctx.store.getGreenBy(test.id)?.author;
  ctx.store.updateTicket(ticketId, { status: 'triaged', verdict, sowLineId, testId: test.id, buildId: run.buildId, assignee,
    reason: verdict === 'warranty' ? `Warranty defect, covered by SOW ${sowLineId}, no charge.` : `SOW ${sowLineId} test passes on current main.` });
  ctx.log.info(verdict === 'warranty' ? `Warranty defect. Covered by SOW ${sowLineId}${assignee ? ` → ${assignee}` : ''}` : 'Not reproduced on main', { ticketId });
  await ctx.bus.emit('ticket.triaged', { ticketId, verdict });
  return { verdict };
};

// Tev1 picks the line; if it's unsure or down, Qwen picks from the same candidates.
async function pickLine(text: string, cands: Pick<SowLine, 'id' | 'criterion'>[], ctx: Ctx): Promise<{ sowLineId: string | null; reason?: string }> {
  try {
    const d = await ctx.decide.choose({
      state: `Support ticket: "${text}"\n\nSOW lines:\n` + cands.map((c) => `${c.id}: ${c.criterion}`).join('\n'),
      question: 'Which SOW line is this ticket about?',
      options: [...cands.map((c) => ({ key: c.id, label: `${c.id}: ${c.criterion}` })), { key: 'none', label: 'None of these' }],
    });
    if (d.key !== 'unclear' && (d.p === null || d.p >= MIN_P)) return { sowLineId: d.key === 'none' ? null : d.key };
  } catch (err) {
    ctx.log.warn('decide unavailable, asking Qwen', err);
  }
  const pick = await ctx.llm.json({ role: 'reasoning', system: await ctx.readPrompt('triage-ticket'), schema: TriageTicketOutput,
    user: JSON.stringify({ ticketText: text, candidates: cands }) });
  return { sowLineId: cands.some((c) => c.id === pick.sowLineId) ? pick.sowLineId : null, reason: pick.reason };
}
