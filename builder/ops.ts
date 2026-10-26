// goal S4 (Shreyas). The four steps that need the host's Docker, the booking repo clone and the Vercel CLI.
// Locally they run right here. Inside the NemoClaw sandbox (no Docker there), PACT_BUILDER_URL points at
// builder/host.ts on the host, and the sandbox ships the build's inputs (prototype source, specs) with the call.
// Deploys always run in the agent itself; a sandboxed agent first fetches an engineering build's tested source.
import { execa } from 'execa';
import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Build } from '@pact/core';
import { must } from '@pact/core';
import { deploy } from './deploy-cli.js';

const DOCKERFILE_APP = resolve(import.meta.dirname, 'Dockerfile.app');
export const net = (buildId: string) => `pact-test-${buildId}`;
export const buildDir = (buildId: string) => `/tmp/pact-builds/${buildId}`;

export type Ops = {
  up(build: Pick<Build, 'id' | 'kind' | 'ref' | 'srcDir'>): Promise<{ srcDir: string }>; // source -> image -> healthy container
  test(buildId: string, specsDir: string): Promise<{ stdout: string; exitCode: number | undefined }>;
  down(buildId: string): Promise<void>;
  deploy(buildId: string, srcDir: string): Promise<string>;
  source?(buildId: string): Promise<{ src: string }>; // host only: the tested source of a build, packed
};

const local: Ops = {
  async up(build) {
    const src = `${buildDir(build.id)}/src`;
    await mkdir(src, { recursive: true });
    // Real source per build: a prototype copies generate-prototype's output dir; a pr/main
    // build is the exact commit from the booking repo.
    if (build.kind === 'prototype') {
      if (build.srcDir !== src) await cp(build.srcDir, src, { recursive: true });
    } else {
      const repo = must(process.env.BOOKING_REPO, 'BOOKING_REPO env');
      await execa('git', ['-C', repo, 'fetch', '-q']);
      await execa('sh', ['-c', `git -C "$0" archive "$1" | tar -x -C "$2"`, repo, build.ref, src]);
    }
    const tag = `pact-build:${build.id}`;
    await execa('docker', ['build', '-q', '-f', DOCKERFILE_APP, '-t', tag, src], { timeout: 120_000 });
    await execa('docker', ['network', 'create', '--internal', net(build.id)]);
    await execa('docker', ['run', '-d', '--name', `app-${build.id}`, '--network', net(build.id), '--network-alias', 'app', tag]);
    await waitHealthy(build.id);
    return { srcDir: src };
  },
  async test(buildId, specsDir) {
    // Copied in rather than bind-mounted, so it works on any docker host (Colima's VM only shares $HOME).
    const runner = `runner-${buildId}`;
    await execa('docker', ['create', '--name', runner, '--network', net(buildId), '-e', 'APP_URL=http://app:3000', 'pact-runner']);
    await execa('docker', ['cp', `${specsDir}/.`, `${runner}:/tests/tests`]);
    const { stdout, exitCode } = await execa('docker', ['start', '-a', runner], { timeout: 90_000, reject: false });
    return { stdout, exitCode };
  },
  // Keyed by name, so it works even if the container never started. Always both, so nothing outlives its build.
  async down(buildId) {
    await execa('docker', ['rm', '-f', `runner-${buildId}`, `app-${buildId}`], { reject: false });
    await execa('docker', ['network', 'rm', net(buildId)], { reject: false });
  },
  deploy: (_buildId, srcDir) => deploy(srcDir),
  source: async (buildId) => ({ src: await packDir(`${buildDir(buildId)}/src`) }),
};

// No published ports: the probe runs inside the app container with node's fetch (the slim image has no wget).
async function waitHealthy(buildId: string, tries = 40) {
  const probe = "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))";
  for (let i = 0; i < tries; i++) {
    const { exitCode } = await execa('docker', ['exec', `app-${buildId}`, 'node', '-e', probe], { reject: false });
    if (exitCode === 0) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('app container never became healthy');
}

// A directory travels as a base64 gzip tarball inside the JSON body (a prototype's source is ~300 KB).
export const packDir = async (dir: string) =>
  Buffer.from((await execa('tar', ['-C', dir, '-cz', '.'], { encoding: 'buffer' })).stdout).toString('base64');
export async function unpackDir(b64: string, dir: string) {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  await execa('tar', ['-C', dir, '-xz'], { input: Buffer.from(b64, 'base64') });
}

const remote = (url: string): Ops => {
  const call = async (path: string, body: object) => {
    const res = await fetch(`${url}${path}`, { method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.PACT_BUILDER_TOKEN ?? ''}` },
      body: JSON.stringify(body), signal: AbortSignal.timeout(300_000) });
    const out = await res.json() as any;
    if (!res.ok) throw new Error(`builder host ${path}: ${out.error ?? res.status}`);
    return out;
  };
  return {
    up: async (b) => call('/up', { build: { id: b.id, kind: b.kind, ref: b.ref },
      src: b.kind === 'prototype' ? await packDir(b.srcDir) : undefined }),
    test: async (buildId, specsDir) => call('/test', { buildId, specs: await packDir(specsDir) }),
    down: async (buildId) => { await call('/down', { buildId }); },
    async deploy(buildId, srcDir) { // a pr/main build's source exists only on the host (git archive): fetch it, then deploy here
      if (!existsSync(srcDir)) await unpackDir((await call('/source', { buildId })).src, srcDir);
      return deploy(srcDir);
    },
  };
};

export const ops: Ops = process.env.PACT_BUILDER_URL ? remote(process.env.PACT_BUILDER_URL) : local;
export const localOps = local;
