import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Ctx } from '@pact/core';
import fs from 'node:fs/promises';

async function freshDb() {
  const { mkdtemp } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  process.env.PACT_DB = join(await mkdtemp(join(tmpdir(), 'pact-generate-prototype-')), 'pact.db');
}

const SOW_LINE = { id: 'line_1', sowVersion: 1, title: 'Tablet checkout',
  criterion: 'Counter staff can complete a booking on an iPad.', commitmentIds: [] };

const FAKE_SLOTS = {
  title: 'Find your car', tagline: 'Search, book, confirm.',
  searchFields: [{ key: 'location', label: 'Pickup location', type: 'text' as const }],
  showTabletLayout: true,
  screens: {
    results: { heading: 'Available cars' },
    book: { heading: 'Book this car', cta: 'Reserve' },
    confirm: { heading: 'Booked', message: 'Confirmation on its way.' },
  },
};

function fakeCtx(bus: Ctx['bus'], store: Ctx['store']): Ctx {
  return {
    store, bus,
    llm: { json: vi.fn().mockResolvedValue(FAKE_SLOTS) } as unknown as Ctx['llm'],
    decide: {} as Ctx['decide'],
    github: {} as Ctx['github'],
    builder: {} as Ctx['builder'],
    files: {} as Ctx['files'],
    readPrompt: vi.fn().mockResolvedValue('system prompt'),
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  };
}

describe('generate-prototype handler', () => {
  beforeEach(freshDb);

  it('fills slots from the SOW, creates a prototype build and fires build.requested', async () => {
    const { store } = await import('../../../core/src/store.js');
    const { bus } = await import('../../../core/src/bus.js');
    const { handler } = await import('../handler.js');

    store.saveSow({ dealId: 'deal-1', version: 1, status: 'approved', lines: [SOW_LINE] });

    const ctx = fakeCtx(bus, store);
    const requested = vi.fn();
    bus.subscribe('spy', 'build.requested', async (p: { buildId: string }) => requested(p));

    const result = await handler({ dealId: 'deal-1', version: 1 }, ctx);

    expect(ctx.llm.json).toHaveBeenCalledWith(expect.objectContaining({ role: 'coding' }));
    const build = store.getBuild(result.buildId);
    expect(build?.kind).toBe('prototype');
    expect(build?.dealId).toBe('deal-1');
    expect(build?.srcDir).toBe(`/tmp/pact-builds/${result.buildId}/src`);
    expect(requested).toHaveBeenCalledWith({ buildId: result.buildId });

    const written = JSON.parse(await fs.readFile(`${build!.srcDir}/slots.json`, 'utf8'));
    expect(written).toEqual(FAKE_SLOTS);

    await fs.rm(`/tmp/pact-builds/${result.buildId}`, { recursive: true, force: true });
  });

  it('sets showTabletLayout=true when the model slots say so for a tablet SOW line', async () => {
    const { store } = await import('../../../core/src/store.js');
    const { bus } = await import('../../../core/src/bus.js');
    const { handler } = await import('../handler.js');

    store.saveSow({ dealId: 'deal-2', version: 1, status: 'approved', lines: [SOW_LINE] });
    const ctx = fakeCtx(bus, store);

    const { buildId } = await handler({ dealId: 'deal-2', version: 1 }, ctx);
    const build = store.getBuild(buildId);
    const written = JSON.parse(await fs.readFile(`${build!.srcDir}/slots.json`, 'utf8'));
    expect(written.showTabletLayout).toBe(true);

    await fs.rm(`/tmp/pact-builds/${buildId}`, { recursive: true, force: true });
  });
});
