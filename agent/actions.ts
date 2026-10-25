import { readFile } from 'node:fs/promises';
import { must, recordBlocked, recordCloud, type Ctx, type Transcript } from '@pact/core';
import { DEAL_ID } from './state.js';

const REGRESSION_PR = Number(process.env.PACT_REGRESSION_PR ?? 35); // seeded PR #35 breaks main

// demo/fixtures/<id>.json is a full Transcript (id, dealId, kind, lines)
export async function dropTranscript(id: string, ctx: Ctx, eventId?: string) {
  if (!/^[\w-]+$/.test(id)) throw new Error(`bad fixture id ${id}`);
  const t: Transcript = JSON.parse(await readFile(new URL(`../demo/fixtures/${id}.json`, import.meta.url), 'utf8'));
  ctx.store.saveTranscript({ ...t, id, dealId: DEAL_ID });
  void ctx.bus.publish('transcript.added', { transcriptId: id }, eventId);
}

// Real egress attempt from inside the sandbox. Any HTTP answer (even 401) means the request left the box.
async function tryCloudCall(ctx: Ctx) {
  const url = 'https://api.openai.com/v1/models', host = new URL(url).hostname;
  try {
    await fetch(url, { signal: AbortSignal.timeout(3_000) });
    recordCloud(host);
    ctx.log.error(`cloud call to ${host} got through: sandbox egress is open`);
  } catch (err) {
    recordBlocked(host);
    ctx.log.info(`cloud call to ${host} blocked`, err);
  }
}

type Action = (body: any, ctx: Ctx) => Promise<void>;
export const actions: Record<string, Action> = {
  'drop-transcript': async ({ id }, ctx) => dropTranscript(id, ctx),
  'mark-closed-won': async ({ dealId = DEAL_ID }, ctx) => {
    ctx.store.setDealStage(dealId, 'closed_won');
    void ctx.bus.publish('deal.closed_won', { dealId }, `deal.closed_won:${dealId}`); // a double click runs once
  },
  'approve-sow': async ({ dealId = DEAL_ID }, ctx) => {
    const { version } = must(ctx.store.getSow(dealId), `sow for ${dealId}`); // latest version
    ctx.store.approveSow(dealId, version);
    void ctx.bus.publish('sow.approved', { dealId, version }, `sow.approved:${dealId}:${version}`);
  },
  'approve-cr': async ({ crId }, ctx) => {
    must(ctx.store.getChangeRequest(crId), `cr ${crId}`); // the cr.approved handler approves it and adds the SOW line
    void ctx.bus.publish('cr.approved', { crId }, `cr.approved:${crId}`);
  },
  'merge-regression': async (_body, ctx) => {
    await ctx.github.mergePr(REGRESSION_PR); // persisted on GitHub; polling sees the new main and builds it
    ctx.log.info(`merged PR #${REGRESSION_PR}`);
  },
  'file-ticket': async ({ text }, ctx) => {
    const t = ctx.store.createTicket({ dealId: DEAL_ID, text: must(text, 'ticket text') });
    void ctx.bus.publish('ticket.created', { ticketId: t.id });
  },
  'share-build': async ({ buildId }, ctx) => {
    must(ctx.store.getBuild(buildId), `build ${buildId}`);
    void ctx.bus.publish('share.requested', { buildId });
  },
  // Real egress attempt (up to 3s); OpenShell/the firewall blocks it on the GB10. On an open network
  // it would get through and be counted as cloud, which is the honest signal that the sandbox is leaking.
  'try-cloud-call': async (_body, ctx) => { void tryCloudCall(ctx); },
};
