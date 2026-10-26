// cr.approved -> a change order for the customer: Qwen writes the prose, code adds every number and quote,
// then it is emailed to the customer (PACT_CUSTOMER_EMAIL) through Resend's API. Runs beside onCrApproved
// (classify-request), which adds the new SOW line this change order cites.
import type { ChangeOrder, ChangeRequest, Ctx, Skill, SowLine } from '@pact/core';
import { must } from '@pact/core';
import { ChangeOrderOutput } from '../../prompts/draft-change-order/schema.js';
import { sendMail } from '../mail.js';

const mmss = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

export const handler: Skill<{ crId: string }, { number: string } | void> = async ({ crId }, ctx) => {
  let cr = must(ctx.store.getChangeRequest(crId), `change request ${crId}`);
  if (!cr.changeOrder) {
    const added = await sowLineFor(cr, ctx);
    cr = draft(cr, added, await ctx.llm.json({ role: 'reasoning', schema: ChangeOrderOutput,
      system: await ctx.readPrompt('draft-change-order'),
      user: JSON.stringify({ request: cr.request, teamReply: cr.ack?.text ?? null,
        newSowLine: { title: added.line.title, criterion: added.line.criterion },
        existingSow: added.before.map((l) => ({ id: l.id, title: l.title })) }) }), ctx);
    ctx.log.info(`change order ${cr.changeOrder!.number} drafted`, { crId });
  }
  if (!cr.changeOrder!.emailedAt) await email(cr, ctx);
  return { number: cr.changeOrder!.number };
};

// onCrApproved adds the CR's line as the newest SOW version; wait for it (it runs on the same event).
async function sowLineFor(cr: ChangeRequest, ctx: Ctx, tries = 120) {
  for (let i = 0; i < tries; i++) {
    const now = ctx.store.getChangeRequest(cr.id);
    const sow = ctx.store.getApprovedSow(cr.dealId);
    if (now?.status === 'approved' && sow && sow.lines.length) {
      return { version: sow.version, line: sow.lines.at(-1)!, before: sow.lines.slice(0, -1) };
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`SOW line for ${cr.id} never appeared`);
}

function draft(cr: ChangeRequest, added: { version: number; line: SowLine }, p: ChangeOrderOutput, ctx: Ctx) {
  const deal = must(ctx.store.getDeal(cr.dealId), `deal ${cr.dealId}`);
  const n = ctx.store.listChangeRequests(cr.dealId).filter((c) => c.changeOrder).length; // CO numbers count per deal
  const number = `CO-${String(n + 1).padStart(3, '0')}`;
  const asked = cr.source === 'ticket' ? `in support ticket ${cr.ticketId}` : `on the status call at ${mmss(cr.quote.t)}`;
  const body = [
    `Change order ${number}: ${deal.name}`,
    `Change request ${cr.id} · adds SOW ${added.line.id} in SOW v${added.version}`,
    '',
    `What you asked for (${asked}):`, `  "${cr.quote.text}"`,
    ...(cr.ack ? [`What our team said:`, `  "${cr.ack.text}"`] : []),
    '', 'Summary', p.summary,
    '', 'Scope of the change', p.scope,
    '', `New acceptance criterion (SOW ${added.line.id})`, added.line.criterion,
    '', 'Why this is a change to the SOW', p.rationale,
    '', `Effort estimate: ${cr.estimate ?? 'to be confirmed by Northstar'}`,
    '', 'Next steps', p.nextSteps,
    '', 'Northstar',
  ].join('\n');
  const changeOrder: ChangeOrder = { number, subject: `Change order ${number}: ${added.line.title}`, body, draftedAt: Date.now() };
  return ctx.store.updateChangeRequest(cr.id, { changeOrder });
}

async function email(cr: ChangeRequest, ctx: Ctx) {
  const co = cr.changeOrder!, to = process.env.PACT_CUSTOMER_EMAIL;
  if (!to || !process.env.RESEND_API_KEY) {
    ctx.log.warn(`change order ${co.number} not emailed: set PACT_CUSTOMER_EMAIL and RESEND_API_KEY`, { crId: cr.id });
    return;
  }
  try {
    await sendMail({ to, subject: co.subject, text: co.body });
    ctx.store.updateChangeRequest(cr.id, { changeOrder: { ...co, emailedTo: to, emailedAt: Date.now(), emailError: undefined } });
    ctx.log.info(`change order ${co.number} emailed to ${to}`, { crId: cr.id });
  } catch (err) {
    ctx.store.updateChangeRequest(cr.id, { changeOrder: { ...co, emailError: String((err as Error).message ?? err).slice(0, 300) } });
    ctx.log.error(`change order ${co.number} email failed`, { crId: cr.id, err: String(err) });
  }
}
