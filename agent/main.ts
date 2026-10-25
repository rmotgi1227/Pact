import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { bus, inject, makeCtx, store, wireSkills, type Topic } from '@pact/core';
import { skills } from '../skills/index.js';
import { github } from '../github/client.js';
import { builder } from '../builder/index.js';
import { startPolling } from '../github/poll.js';
import { registerWithOpenClaw } from './openclaw.js';
import { actions, dropTranscript } from './actions.js';
import { DEAL_ID, snapshot, trackLogs } from './state.js';

inject({ github, builder });
await registerWithOpenClaw();
wireSkills(skills);
trackLogs();
const ctx = makeCtx('demo-actions');

// Seed: deal at negotiation plus call-1 and call-2, captured for real. Fixed event ids, so a restart does not re-run them.
if (!store.getDeal(DEAL_ID)) store.saveDeal({ id: DEAL_ID, name: 'Hertz', stage: 'negotiation' });
for (const id of ['call-1', 'call-2']) await dropTranscript(id, ctx, `seed:${id}`);
void startPolling(makeCtx('github-poll'));

const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'GET, POST, OPTIONS' };
const send = (res: ServerResponse, code: number, body: unknown) => {
  res.writeHead(code, { ...cors, 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};
const readJson = async (req: IncomingMessage) => {
  let body = '';
  for await (const chunk of req) body += chunk;
  return body ? JSON.parse(body) : {};
};

const enc = new TextEncoder();
createServer(async (req, res) => {
  const path = new URL(req.url ?? '/', 'http://localhost').pathname;
  try {
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); return void res.end(); } // preflight for JSON POSTs
    if (req.method === 'POST' && path.startsWith('/actions/')) {
      const action = actions[path.slice('/actions/'.length)];
      if (!action) return send(res, 404, { error: `unknown action ${path}` });
      await action(await readJson(req), ctx); // persists, publishes, does not wait for handlers
      return send(res, 202, { ok: true });
    }
    if (req.method === 'POST' && path === '/events') { // stage fallback only
      const { topic, payload } = (await readJson(req)) as { topic: Topic; payload?: object };
      if (topic !== 'demo.replay') return send(res, 400, { error: 'use POST /actions/<name>; /events takes demo.replay only' });
      void bus.publish(topic, payload ?? {});
      return send(res, 202, { ok: true });
    }
    if (req.method === 'GET' && path === '/state') return send(res, 200, snapshot());
    if (req.method === 'GET' && path === '/stream') {
      res.writeHead(200, { ...cors, 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
      const write = (s: string) => res.write(enc.encode(s));
      write(': connected\n\n');
      const off = bus.listen((e) => write(`data: ${JSON.stringify({ topic: e.topic, payload: e.payload })}\n\n`));
      const ping = setInterval(() => write(': ping\n\n'), 15_000);
      req.on('close', () => { off(); clearInterval(ping); });
      return;
    }
    send(res, 404, { error: 'not found' });
  } catch (err) {
    send(res, 400, { error: (err as Error).message }); // bad JSON, missing row, failed merge: never crash the agent
  }
}).listen(4000, () => console.log('pact agent on :4000'));
