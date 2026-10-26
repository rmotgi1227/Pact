// Start / Reset Pact from the dashboard. Runs on the dashboard's own server (host side), so it works even when
// the agent is down. One job at a time; progress is the tail of ~/.pact/control.log.
// Only this machine may use it: Host and Origin must be localhost (blocks other sites and other LAN browsers).
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

export const runtime = 'nodejs';
const REPO = resolve(process.cwd(), '..'); // `pnpm dashboard` runs next in dashboard/
const STATE = process.env.PACT_STATE_DIR ?? join(homedir(), '.pact');
const LOG = join(STATE, 'control.log'), PID = join(STATE, 'control.pid'), OP = join(STATE, 'control.op');
const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

const local = (req: Request) => {
  const host = req.headers.get('host') ?? '', origin = req.headers.get('origin');
  return LOCAL.test(host) && (!origin || LOCAL.test(new URL(origin).host));
};
const alive = (pid: number) => { try { process.kill(pid, 0); return true; } catch { return false; } };
const running = () => existsSync(PID) && alive(Number(readFileSync(PID, 'utf8')));
const tail = () => existsSync(LOG)
  ? readFileSync(LOG, 'utf8').replace(/\x1b\[[0-9;]*m/g, '').split('\n').filter((l) => l.trim() && !/OCSF|ExperimentalWarning|trace-warnings/.test(l)).slice(-8)
  : [];

export async function GET(req: Request) {
  if (!local(req)) return Response.json({ error: 'local only' }, { status: 403 });
  return Response.json({ running: running(), op: existsSync(OP) ? readFileSync(OP, 'utf8') : null, log: tail() });
}

export async function POST(req: Request) {
  if (!local(req)) return Response.json({ error: 'local only' }, { status: 403 });
  const { op } = (await req.json().catch(() => ({}))) as { op?: string };
  if (op !== 'start' && op !== 'reset') return Response.json({ error: 'op must be start or reset' }, { status: 400 });
  if (running()) return Response.json({ error: 'already running', op: readFileSync(OP, 'utf8') }, { status: 409 });
  mkdirSync(STATE, { recursive: true });
  const out = openSync(LOG, 'w');
  // sg docker: the stack needs the docker group, which this login session may not have picked up yet.
  const child = spawn('sg', ['docker', '-c', `bash infra/sandbox/control.sh ${op}`], { cwd: REPO, detached: true, stdio: ['ignore', out, out],
    env: { ...process.env, NODE_NO_WARNINGS: '1', NEMOCLAW_NO_AUTO_AUDIT_LOGS: '1' } });
  child.unref();
  writeFileSync(PID, String(child.pid));
  writeFileSync(OP, op);
  return Response.json({ started: op }, { status: 202 });
}
