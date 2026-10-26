// cr.drafted -> email the operator an approve/deny request for the change request (scope creep from a status call or
// an out-of-scope ticket). Approve -> cr.approved -> draft-change-order emails the actual change order. Plain code:
// the email is composed from the stored CR, no model involved.
import type { Skill } from '@pact/core';
import { must } from '@pact/core';
import { sendMail } from '../mail.js';
import { approvalLink } from './token.js';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export const handler: Skill<{ crId: string }, void> = async ({ crId }, ctx) => {
  const cr = must(ctx.store.getChangeRequest(crId), `change request ${crId}`);
  if (cr.approvalRequested && 'to' in cr.approvalRequested) return; // redelivery: already sent
  const to = process.env.PACT_APPROVER_EMAIL ?? process.env.PACT_CUSTOMER_EMAIL;
  if (!to || !process.env.RESEND_API_KEY) return ctx.log.warn('approval request not emailed: set PACT_CUSTOMER_EMAIL and RESEND_API_KEY', { crId });
  const deal = must(ctx.store.getDeal(cr.dealId), `deal ${cr.dealId}`);
  const where = cr.source === 'ticket' ? `support ticket ${cr.ticketId}` : 'the status call';
  const approve = approvalLink(cr.id, 'approve'), deny = approvalLink(cr.id, 'deny');
  const facts: [string, string][] = [
    ['Request', `"${cr.quote.text}" (from ${where})`],
    ...(cr.ack ? [['Our team said', `"${cr.ack.text}"`] as [string, string]] : []),
    ['In the SOW?', cr.needsReview ? 'Partly. A SOW line touches it, but does not fully require it.' : 'No. This is new work.'],
    ['Effort estimate', cr.estimate ?? 'to be confirmed'],
  ];
  const text = [`Scope creep on ${deal.name}: change request ${cr.id} needs your decision.`, '',
    ...facts.map(([k, v]) => `${k}: ${v}`), '',
    `Approve (drafts and emails the change order): ${approve}`, `Deny: ${deny}`, '',
    'The links open the Pact agent on the GB10, so open them on that machine.'].join('\n');
  const btn = (href: string, label: string, color: string) =>
    `<a href="${esc(href)}" style="display:inline-block;padding:10px 18px;margin-right:8px;border-radius:6px;background:${color};color:#fff;text-decoration:none;font-weight:600">${label}</a>`;
  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px">
<p>Scope creep on <b>${esc(deal.name)}</b>: change request <code>${esc(cr.id)}</code> needs your decision.</p>
<table style="border-collapse:collapse">${facts.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top">${esc(k)}</td><td style="padding:4px 0">${esc(v)}</td></tr>`).join('')}</table>
<p style="margin-top:18px">${btn(approve, 'Approve and send change order', '#1a7f37')}${btn(deny, 'Deny', '#b42318')}</p>
<p style="color:#888;font-size:12px">The buttons open the Pact agent on the GB10, so open them on that machine.</p></div>`;
  try {
    await sendMail({ to, subject: `Approve change request ${cr.id}? ${cr.request.slice(0, 60)}`, text, html });
    ctx.store.updateChangeRequest(cr.id, { approvalRequested: { to, at: Date.now() } });
    ctx.log.info(`approval request for ${cr.id} emailed to ${to}`, { crId });
  } catch (err) {
    ctx.store.updateChangeRequest(cr.id, { approvalRequested: { error: String((err as Error).message ?? err).slice(0, 300), at: Date.now() } });
    ctx.log.error('approval request email failed', { crId, err: String(err) });
  }
};
