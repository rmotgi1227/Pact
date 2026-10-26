// /approval/<crId>?d=approve|deny&t=<sig>: the operator's answer to request-cr-approval's email.
// GET only shows a confirmation page (mail scanners pre-open links); the page's button POSTs, and only that acts.
// The signature must match, and only a draft CR can be decided, so nobody can re-approve or flip a decision.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { bus, makeCtx, store } from '@pact/core';
import { validToken } from '../skills/request-cr-approval/token.js';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const page = (res: ServerResponse, code: number, title: string, body: string) => {
  res.writeHead(code, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  res.end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title>
<body style="font-family:system-ui,sans-serif;max-width:520px;margin:48px auto;padding:0 16px"><h2>${esc(title)}</h2>${body}</body>`);
};

export function decide(crId: string, d: 'approve' | 'deny'): { ok: boolean; error?: string } {
  const cr = store.getChangeRequest(crId);
  if (!cr) return { ok: false, error: `no change request ${crId}` };
  if (cr.status !== 'draft') return { ok: false, error: `${crId} is already ${cr.status}` };
  const log = makeCtx('approvals').log;
  if (d === 'approve') {
    log.info(`operator approved ${crId} by email`, { crId });
    void bus.publish('cr.approved', { crId }, `cr.approved:${crId}`); // same event as the dashboard's Approve CR
  } else {
    store.rejectChangeRequest(crId);
    log.info(`operator denied ${crId} by email`, { crId });
  }
  return { ok: true };
}

export async function handleApproval(req: IncomingMessage, res: ServerResponse, url: URL) {
  const crId = decodeURIComponent(url.pathname.slice('/approval/'.length));
  const d = url.searchParams.get('d') ?? '', t = url.searchParams.get('t') ?? '';
  if (!validToken(crId, d, t)) return page(res, 403, 'Link not valid', '<p>This approval link is invalid or was changed.</p>');
  const cr = store.getChangeRequest(crId);
  if (!cr) return page(res, 404, 'Not found', `<p>No change request ${esc(crId)}.</p>`);
  const verb = d === 'approve' ? 'Approve' : 'Deny';
  if (req.method === 'GET') {
    if (cr.status !== 'draft') return page(res, 200, `Already ${cr.status}`, `<p>${esc(crId)} was already ${esc(cr.status)}.</p>`);
    return page(res, 200, `${verb} change request ${crId}?`, `<p>&ldquo;${esc(cr.request)}&rdquo;</p>
<p>Effort estimate: ${esc(cr.estimate ?? 'to be confirmed')}</p>
${d === 'approve' ? '<p>Approving adds it to the SOW and emails the change order to the customer.</p>' : ''}
<form method="post"><button style="padding:10px 18px;font-size:16px;border-radius:6px;border:0;color:#fff;background:${d === 'approve' ? '#1a7f37' : '#b42318'}">${verb}</button></form>`);
  }
  const r = decide(crId, d as 'approve' | 'deny');
  if (!r.ok) return page(res, 409, 'Nothing changed', `<p>${esc(r.error ?? '')}</p>`);
  return page(res, 200, d === 'approve' ? 'Approved' : 'Denied', d === 'approve'
    ? `<p>${esc(crId)} is approved. The change order is being drafted and will be emailed shortly.</p>`
    : `<p>${esc(crId)} is denied. No change order will be sent.</p>`);
}
