// Calls the operator adds live (the Deals page "New call" card), so the demo runs on input nobody scripted:
// typed by hand, or written by local Qwen from a one-line scenario. Either way it becomes a real Transcript
// and goes through transcript.added like the fixtures: capture-commitments, and on status calls classify-request.
import type { Ctx, Transcript } from '@pact/core';
import { TranscriptOutput } from '../prompts/generate-transcript/schema.js';
import { DEAL_ID } from './state.js';

type Kind = Transcript['kind'];

// Pact works only once the deal is Closed Won. Before that a call is just saved: no event, no OpenClaw turn,
// nothing running. Closed Won reads every saved sales call (capture-commitments' onClosedWon).
export function announceCall(transcriptId: string, ctx: Ctx, eventId?: string) {
  if (ctx.store.getDeal(DEAL_ID)?.stage !== 'closed_won') {
    ctx.log.info(`${transcriptId} saved; Pact reads it when the deal is marked Closed Won`);
    return;
  }
  void ctx.bus.publish('transcript.added', { transcriptId }, eventId);
}
const STEP = 15; // seconds between turns; code owns every number

function save(kind: Kind, lines: { speaker: string; text: string }[], ctx: Ctx) {
  const t: Transcript = { id: ctx.store.newId(kind === 'sales' ? 'call' : 'status'), dealId: DEAL_ID, kind,
    lines: lines.map((l, i) => ({ t: (i + 1) * STEP, speaker: l.speaker.trim(), text: l.text.trim() })) };
  ctx.store.saveTranscript(t);
  announceCall(t.id, ctx);
  return t;
}

// "Dana: can we get ..." per line. Lines without "Name:" continue the previous speaker's turn.
export function parseTyped(raw: string) {
  const lines: { speaker: string; text: string }[] = [];
  for (const row of raw.split('\n').map((r) => r.trim()).filter(Boolean)) {
    const m = row.match(/^([A-Za-z][\w .'-]{0,39}):\s*(.+)$/);
    if (m) lines.push({ speaker: m[1], text: m[2] });
    else if (lines.length) lines.at(-1)!.text += ` ${row}`;
    else throw new Error('start each line with "Name: what they said"');
  }
  if (!lines.length) throw new Error('the call is empty');
  return lines;
}

export function addTyped(kind: Kind, raw: string, ctx: Ctx) {
  const t = save(kind, parseTyped(raw), ctx);
  ctx.log.info(`${kind} call ${t.id} added (${t.lines.length} lines, typed)`, { transcriptId: t.id });
}

// Generation takes a while on the 35B model, so it runs after the action returns; the log shows progress.
export function generate(kind: Kind, scenario: string, ctx: Ctx) {
  ctx.log.info(`writing a ${kind} call with Qwen: "${scenario.slice(0, 120)}"`);
  void (async () => {
    try {
      const out = await ctx.llm.json({ role: 'reasoning', schema: TranscriptOutput,
        system: await ctx.readPrompt('generate-transcript'), user: JSON.stringify({ kind, scenario }) });
      const t = save(kind, out.lines, ctx);
      ctx.log.info(`${kind} call ${t.id} added (${t.lines.length} lines, written by Qwen)`, { transcriptId: t.id });
    } catch (err) {
      ctx.log.error('could not write the call', err);
    }
  })();
}
