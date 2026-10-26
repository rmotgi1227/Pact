// goal S5 (Shreyas). The Vercel side of a deploy: link the project once, upload one build's source.
// Always runs in the agent (inside the sandbox on the GB10): Vercel is one of the two hosts the agent may reach.
import { execa } from 'execa';
import { cp, mkdir, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { must } from '@pact/core';

const LINK_DIR = process.env.PACT_VERCEL_LINK_DIR ?? '/tmp/pact-builds/.vercel-link'; // linked once, its .vercel/ copied into each build
let linked: Promise<void> | undefined;
// The repo's pinned vercel CLI (package.json), so it runs the same on the host and inside the sandbox (no global install).
const local = { preferLocal: true, localDir: resolve(import.meta.dirname, '..'),
  env: { VERCEL_TELEMETRY_DISABLED: '1', NO_UPDATE_NOTIFIER: '1' } };
// With VERCEL_DEPLOY_TOKEN: token auth + an isolated CLI config (the GB10). Without it: this machine's own `vercel login`.
const token = () => (process.env.VERCEL_DEPLOY_TOKEN ? ['--token', process.env.VERCEL_DEPLOY_TOKEN] : []);
// VERCEL_SCOPE = the team the pact-proto project lives in (fix from Rishab's R4 run; Shreyas owns this file).
// Leave VERCEL_SCOPE empty for a personal account. A private global-config dir keeps the machine's own
// Vercel login/team out of it, so only the deploy token decides where prototypes go.
const scope = () => [...(process.env.VERCEL_SCOPE ? ['--scope', process.env.VERCEL_SCOPE] : []),
  ...(process.env.VERCEL_DEPLOY_TOKEN ? ['--global-config', '/tmp/pact-builds/.vercel-global'] : [])];

// Link through the Vercel API instead of `vercel link` (CLI 54 hangs on "Loading teams…"):
// find or create the project, then write .vercel/project.json that `vercel deploy` reads.
const api = async (path: string, init?: RequestInit) => {
  const res = await fetch(`https://api.vercel.com${path}${process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : ''}`, {
    ...init, headers: { authorization: `Bearer ${must(process.env.VERCEL_DEPLOY_TOKEN, 'VERCEL_DEPLOY_TOKEN env')}`,
      'content-type': 'application/json', ...init?.headers } });
  return { status: res.status, body: await res.json() as any };
};
const link = () => linked ??= (async () => {
  const name = process.env.VERCEL_PROJECT ?? 'pact-proto';
  const pj = join(LINK_DIR, '.vercel', 'project.json');
  if (existsSync(pj) && JSON.parse(readFileSync(pj, 'utf8')).projectId) return; // already linked to a real project
  if (!process.env.VERCEL_DEPLOY_TOKEN) { // machine login: let the CLI link (and create) the project
    await mkdir(LINK_DIR, { recursive: true });
    await execa('vercel', ['link', '--yes', '--project', name, ...scope()], { ...local, cwd: LINK_DIR, timeout: 120_000 });
    return;
  }
  let p = await api(`/v9/projects/${name}`);
  if (p.status === 404) p = await api('/v10/projects', { method: 'POST', body: JSON.stringify({ name, framework: 'nextjs' }) });
  if (p.status >= 300) throw new Error(`vercel project ${name}: ${p.status} ${p.body?.error?.message ?? ''}`);
  // The share link must open for Dana and on a phone without a Vercel login. New projects default to
  // Vercel Authentication on preview deployments, so turn it off (the deploy holds only the demo prototype).
  if (p.body.ssoProtection) {
    const off = await api(`/v9/projects/${name}`, { method: 'PATCH', body: JSON.stringify({ ssoProtection: null }) });
    if (off.status >= 300) throw new Error(`vercel project ${name}: could not make links public: ${off.body?.error?.message ?? off.status}`);
  }
  await mkdir(join(LINK_DIR, '.vercel'), { recursive: true });
  await writeFile(join(LINK_DIR, '.vercel', 'project.json'),
    JSON.stringify({ projectId: p.body.id, orgId: p.body.accountId, settings: { framework: 'nextjs' } }));
})().catch((e) => { linked = undefined; throw e; });

// The box uploads only the tested source. Vercel's build machines install and build it,
// so the GB10 needs no package registry access, only the Vercel API.
export async function deploy(srcDir: string) {
  await link();
  await cp(join(LINK_DIR, '.vercel'), join(srcDir, '.vercel'), { recursive: true });
  const { stdout } = await execa('vercel', ['deploy', '--yes', ...token(), ...scope()], { ...local, cwd: srcDir, timeout: 280_000 });
  // The CLI's output format varies by version (plain URL or a JSON summary), so pick out the deployment URL.
  const url = stdout.match(/https:\/\/[a-z0-9-]+\.vercel\.app/i)?.[0];
  if (!url) throw new Error(`no deployment url in vercel output: ${stdout.slice(-300)}`);
  return url;
}

