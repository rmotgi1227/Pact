import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const spec = (id: string) => `import { test, expect } from '@playwright/test';\ntest('${id}', async () => {});`;

async function setup(out: { tests: { sowLineId: string; source: string }[] }) {
  const dir = await mkdtemp(join(tmpdir(), 'pact-s3-'));
  process.env.PACT_DB = join(dir, 'pact.db');
  vi.resetModules();
  const { store, bus } = await import('@pact/core');
  const emitted: unknown[] = [];
  const ctx = {
    store, bus: { ...bus, emit: async (topic: string, p: object) => { emitted.push({ topic, p }); } },
    llm: { json: vi.fn(async () => out) },
    readPrompt: async () => 'prompt',
    files: { writeSpec: async (_d: string, id: string, src: string) => {
      const { writeFile } = await import('node:fs/promises'); const f = join(dir, `${id}.spec.ts`); await writeFile(f, src); return f; } },
    log: { info: () => {}, warn: vi.fn(), error: () => {} },
  } as any;
  const { handler } = await import('./handler.js');
  return { store, ctx, emitted, handler };
}

const line = (id: string) => ({ id, sowVersion: 1, title: id, criterion: `criterion ${id}`, commitmentIds: [] });

describe('generate-acceptance-tests', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('writes one spec per SOW line and emits tests.generated', async () => {
    const { store, ctx, emitted, handler } = await setup({ tests: [{ sowLineId: '§3.1', source: spec('a') }, { sowLineId: '§1.1', source: spec('b') }] });
    store.saveSow({ dealId: 'd', version: 1, status: 'approved', lines: [line('§1.1'), line('§3.1')] });
    await handler({ dealId: 'd', version: 1 }, ctx);
    const tests = store.listAcceptanceTests('d');
    expect(tests.map((t) => t.id).sort()).toEqual(['t_1_1', 't_3_1']);
    expect(await readFile(tests.find((t) => t.id === 't_3_1')!.file, 'utf8')).toContain('@playwright/test');
    expect(emitted).toEqual([{ topic: 'tests.generated', p: { dealId: 'd', version: 1 } }]);
  });

  it('rejects a spec with an unknown sow id or without the playwright import', async () => {
    const { store, ctx, handler } = await setup({ tests: [{ sowLineId: '§9.9', source: spec('x') }, { sowLineId: '§1.1', source: 'no import here at all, nope' }] });
    store.saveSow({ dealId: 'd', version: 1, status: 'approved', lines: [line('§1.1')] });
    await handler({ dealId: 'd', version: 1 }, ctx);
    expect(store.listAcceptanceTests('d')).toEqual([]);
    expect(ctx.log.warn).toHaveBeenCalledTimes(2);
  });

  it('on a CR only asks for lines that have no test yet, and keeps existing tests', async () => {
    const { store, ctx, handler } = await setup({ tests: [{ sowLineId: '§4.1', source: spec('new') }] });
    store.saveSow({ dealId: 'd', version: 2, status: 'approved', lines: [line('§1.1'), line('§4.1')] });
    store.saveAcceptanceTest({ id: 't_1_1', dealId: 'd', sowLineId: '§1.1', file: 'f', status: 'green' });
    await handler({ dealId: 'd', version: 2 }, ctx);
    expect(JSON.parse(ctx.llm.json.mock.calls[0][0].user).sowLineIds).toEqual(['§4.1']);
    expect(store.listAcceptanceTests('d').find((t) => t.id === 't_1_1')!.status).toBe('green');
  });
});
