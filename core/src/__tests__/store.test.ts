import { beforeEach, describe, expect, it } from 'vitest';

describe('store', () => {
  beforeEach(async () => {
    const { mkdtemp } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const dir = await mkdtemp(join(tmpdir(), 'pact-store-'));
    process.env.PACT_DB = join(dir, 'pact.db');
  });

  it('newId("build") matches /^build_[0-9a-f]{8}$/', async () => {
    const { store } = await import('../store.js');
    expect(store.newId('build')).toMatch(/^build_[0-9a-f]{8}$/);
  });

  it('testIdFor turns a SOW line id into a safe test id', async () => {
    const { store } = await import('../store.js');
    expect(store.testIdFor('§3.1')).toBe('t_3_1');
  });

  it('get returns undefined when no row exists', async () => {
    const { store } = await import('../store.js');
    expect(store.getDeal('nope')).toBeUndefined();
  });

  it('addSowLine creates version+1 with the old lines plus the new one, and getSow(dealId) returns it', async () => {
    const { store } = await import('../store.js');
    store.saveSow({ dealId: 'd1', version: 1, status: 'approved', lines: [
      { id: 'l1', sowVersion: 1, title: 'a', criterion: 'a', commitmentIds: [] },
    ] });
    store.addSowLine('d1', { title: 'b', criterion: 'b', commitmentIds: [] });
    const latest = store.getSow('d1');
    expect(latest?.version).toBe(2);
    expect(latest?.lines.map((l) => l.title)).toEqual(['a', 'b']);
  });
});
