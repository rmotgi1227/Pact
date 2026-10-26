// OpenClaw runs Pact's skills. Each skills/<name>/ is installed into the NemoClaw sandbox as an OpenClaw
// skill `pact-<name>` (infra/sandbox/install-skills.ts). When an event fires, the agent hands it to OpenClaw
// (Qwen3.6-35B-A3B) for one turn; OpenClaw picks the matching skills and starts each one by calling
// POST /openclaw/run {skill, eventId} on the agent's Unix socket (SOCKET below). The handlers stay plain code: OpenClaw decides what
// runs, the model still never writes the store.
// A skill OpenClaw didn't start within its turn runs directly, and the log says so. Set PACT_OPENCLAW=0
// (or run outside the sandbox, where there is no `openclaw` CLI) for direct dispatch only.
import { execa } from 'execa';
import { createServer } from 'node:http';
import { rm } from 'node:fs/promises';
import { bus, makeCtx, runSkill, store, type Dispatch, type Log, type SkillDef } from '@pact/core';
import { OPENCLAW_SKILLS } from './openclaw-skills.js';
export const enabled = () => process.env.PACT_OPENCLAW === '1';

type Pending = { s: SkillDef; input: unknown; started?: Promise<unknown> };
const pending = new Map<string, Map<string, Pending>>(); // eventId -> skill name -> waiting dispatch
const turns = new Map<string, Promise<void>>(); // eventId -> the one OpenClaw turn for that event
let logger: Log | undefined;
const log = () => (logger ??= makeCtx('openclaw').log); // after main.ts has called inject()

// One OpenClaw turn per event, shared by every skill that listens to it.
function turn(eventId: string, topic: string) {
  let t = turns.get(eventId);
  if (!t) {
    // Let every subscriber of this event register before OpenClaw is asked (bus.publish starts them together).
    t = new Promise((r) => setImmediate(r)).then(() => askOpenClaw(eventId, topic)).finally(() => turns.delete(eventId));
    turns.set(eventId, t);
  }
  return t;
}

async function askOpenClaw(eventId: string, topic: string) {
  // Skills reach the model as name + description only, so it must open SKILL.md to see the command,
  // and it must be told to act: left to itself it describes the matching skills instead of running them.
  const msg = `Pact event "${topic}" arrived (event id ${eventId}).\n` +
    `For every pact-* skill whose trigger is exactly "${topic}": read its SKILL.md, then use the exec tool to run ` +
    `its curl command now, with EVENT_ID replaced by ${eventId}. Run each matching skill once; run no other skill. ` +
    `Do not ask for confirmation and do not just describe the skills: execute the commands. ` +
    `Then reply with the names of the skills you started.`;
  const t0 = Date.now();
  log().info(`asking OpenClaw to handle ${topic}`, { eventId }); // also refreshes the dashboard's activity indicator
  // A fresh session per turn: event ids repeat across restarts (the seed's are fixed), and a reused session
  // makes the model reason from its old attempts instead of acting on this event.
  const session = `pact-${eventId.replace(/[^\w-]/g, '-')}-${Date.now().toString(36)}`;
  const { stdout, exitCode } = await execa('openclaw', ['agent', '--agent', 'main', '--session-id', session,
    '--json', '-m', msg], { timeout: 180_000, reject: false });
  let reply = '';
  try { reply = JSON.parse(stdout.slice(stdout.indexOf('{'))).result?.payloads?.[0]?.text ?? ''; } catch { /* not JSON */ }
  log().info(`OpenClaw handled ${topic}`, { eventId, seconds: Math.round((Date.now() - t0) / 1000), exitCode, reply: reply.slice(0, 200) });
}

// Skills that only act on one kind of build: for any other build they'd return at once, so skip OpenClaw's turn.
const BUILD_KINDS: Record<string, string[]> = { 'map-pr-to-sow': ['pr'], 'build-features': ['prototype'] };
const relevant = (s: SkillDef, input: unknown) => {
  const kinds = BUILD_KINDS[s.name], buildId = (input as { buildId?: string } | null)?.buildId;
  return !kinds || !buildId || kinds.includes(store.getBuild(buildId)?.kind ?? '');
};

export const dispatch: Dispatch = async (s, input, eventId) => {
  if (!enabled() || !OPENCLAW_SKILLS.has(s.name) || !relevant(s, input)) return runSkill(s, input);
  const forEvent = pending.get(eventId) ?? new Map<string, Pending>();
  pending.set(eventId, forEvent);
  const p: Pending = { s, input };
  forEvent.set(s.name, p);
  bus.setStage(eventId, s.name, 'openclaw');
  try {
    await turn(eventId, s.on);
    bus.setStage(eventId, s.name, 'running');
    if (p.started) return await p.started;
    log().warn(`OpenClaw did not start ${s.name}; running it directly`, { eventId });
    return await runSkill(s, input);
  } finally {
    forEvent.delete(s.name);
    if (!forEvent.size) pending.delete(eventId);
  }
};

// POST /openclaw/run {skill, eventId}: OpenClaw starting a skill. Only a skill that is really waiting on that
// event can start, so the model can't run the wrong skill, run one twice, or invent an event.
export function startFromOpenClaw(skill: string, eventId: string): { ok: boolean; error?: string } {
  const p = pending.get(eventId)?.get(skill.replace(/^pact-/, ''));
  if (!p) return { ok: false, error: `no ${skill} waiting on event ${eventId}` };
  if (p.started) return { ok: false, error: `${skill} already started for ${eventId}` };
  bus.setStage(eventId, p.s.name, 'running');
  p.started = runSkill(p.s, p.input);
  p.started.catch(() => { /* the dispatch awaiting it reports the failure to the bus */ });
  return { ok: true };
}

// OpenClaw reaches the agent on a Unix socket, not TCP: OpenShell denies loopback traffic from sandboxed
// processes outright (SSRF hardening), and a socket in the sandbox's own workdir is reachable only from inside it.
export const SOCKET = process.env.PACT_OPENCLAW_SOCKET ?? '/sandbox/pact-data/openclaw.sock';
export async function serveOpenClawSocket() {
  await rm(SOCKET, { force: true });
  createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    let r: { ok: boolean; error?: string } = { ok: false, error: 'use POST /openclaw/run {skill, eventId}' };
    try {
      const b = JSON.parse(body || '{}');
      if (req.method === 'POST' && req.url === '/openclaw/run') r = startFromOpenClaw(String(b.skill), String(b.eventId));
    } catch { r = { ok: false, error: 'bad JSON' }; }
    res.writeHead(r.ok ? 202 : 409, { 'content-type': 'application/json' });
    res.end(JSON.stringify(r));
  }).listen(SOCKET);
}

