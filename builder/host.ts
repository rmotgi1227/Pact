// goal S4 (Shreyas). Host-side build service for when the agent runs inside the NemoClaw sandbox, which has
// no Docker. It owns only the steps that need Docker and the booking repo clone (builder/ops.ts); the agent keeps
// the store, the bus, every decision and the Vercel deploy. Start it on the host: `pnpm builder-host`.
import { createServer } from 'node:http';
import { buildDir, localOps, unpackDir } from './ops.js';

const port = Number(process.env.PACT_BUILDER_PORT ?? 4100);
// Bind to the Docker bridge (infra/sandbox/up.sh sets it), never the LAN, and require the token the sandbox was given.
const auth = `Bearer ${process.env.PACT_BUILDER_TOKEN ?? ''}`;
if (!process.env.PACT_BUILDER_TOKEN) throw new Error('PACT_BUILDER_TOKEN is required');
const routes: Record<string, (b: any) => Promise<unknown>> = {
  async '/up'({ build, src }) {
    if (src) await unpackDir(src, `${buildDir(build.id)}/src`); // prototype: the sandbox's filled template
    return localOps.up({ ...build, srcDir: `${buildDir(build.id)}/src` });
  },
  async '/test'({ buildId, specs }) {
    const dir = `${buildDir(buildId)}/specs`;
    await unpackDir(specs, dir);
    return localOps.test(buildId, dir);
  },
  async '/down'({ buildId }) { await localOps.down(buildId); return {}; },
  async '/source'({ buildId }) { return localOps.source!(buildId); }, // a tested build's source, for the agent to deploy
};

createServer(async (req, res) => {
  const route = req.method === 'POST' ? routes[req.url ?? ''] : undefined;
  const send = (code: number, body: unknown) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
  if (req.headers.authorization !== auth) return send(401, { error: 'unauthorized' });
  if (!route) return send(404, { error: 'not found' });
  let body = '';
  for await (const chunk of req) body += chunk;
  try {
    const b = JSON.parse(body);
    if (!/^[\w-]+$/.test(b.buildId ?? b.build?.id ?? '')) return send(400, { error: 'bad build id' });
    send(200, await route(b));
  } catch (err) { send(500, { error: String(err) }); }
}).listen(port, process.env.PACT_BUILDER_HOST ?? '127.0.0.1', () => console.log(`pact builder host on :${port}`));
