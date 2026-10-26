import { describe, expect, it, vi } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function setup() {
  process.env.PACT_DB = join(await mkdtemp(join(tmpdir(), 'pact-appr-')), 'pact.db');
  process.env.PACT_APPROVAL_SECRET = 'test-secret';
  vi.resetModules();
  const core = await import('@pact/core');
  core.inject({ github: {} as any, builder: {} as any }); // logging needs a ctx
  const published: string[] = [];
  core.bus.listen((e) => { if (e.topic === 'cr.approved') published.push(e.payload.crId); });
  const cr = core.store.createChangeRequest({ dealId: 'hertz-demo', request: 'Export to Excel', estimate: '1-2 eng-days',
    quote: { transcriptId: 't_1', t: 0, text: 'Can we export to Excel?' } });
  const { handleApproval } = await import('../approvals.js');
  const { approvalLink } = await import('../../skills/request-cr-approval/token.js');
  const call = async (method: string, link: string) => {
    let code = 0, body = '';
    const res = { writeHead: (c: number) => { code = c; }, end: (b: string) => { body = b; } } as any;
    await handleApproval({ method } as any, res, new URL(link));
    return { code, body };
  };
  return { store: core.store, cr, published, call, approvalLink };
}

describe('approval links', () => {
  it('GET only confirms; POST approves once and fires cr.approved', async () => {
    const { store, cr, published, call, approvalLink } = await setup();
    const link = approvalLink(cr.id, 'approve');
    expect((await call('GET', link)).code).toBe(200);
    expect(published).toEqual([]); // a mail scanner opening the link changes nothing
    expect((await call('POST', link)).code).toBe(200);
    expect(published).toEqual([cr.id]);
    store.approveChangeRequest(cr.id); // what onCrApproved does
    expect((await call('POST', link)).code).toBe(409); // no second decision
  });

  it('deny rejects the CR', async () => {
    const { store, cr, published, call, approvalLink } = await setup();
    expect((await call('POST', approvalLink(cr.id, 'deny'))).code).toBe(200);
    expect(store.getChangeRequest(cr.id)!.status).toBe('rejected');
    expect(published).toEqual([]);
  });

  it('a forged or edited link does nothing', async () => {
    const { store, cr, call, approvalLink } = await setup();
    const deny = new URL(approvalLink(cr.id, 'deny'));
    deny.searchParams.set('d', 'approve'); // deny signature, approve decision
    expect((await call('POST', deny.toString())).code).toBe(403);
    expect((await call('POST', `http://localhost:4000/approval/${cr.id}?d=approve&t=nope`)).code).toBe(403);
    expect(store.getChangeRequest(cr.id)!.status).toBe('draft');
  });
});
