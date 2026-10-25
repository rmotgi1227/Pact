import { beforeEach, describe, expect, it } from 'vitest';

async function freshDb() {
  const { mkdtemp } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  process.env.PACT_DB = join(await mkdtemp(join(tmpdir(), 'pact-bus-')), 'pact.db');
}

describe('bus', () => {
  beforeEach(freshDb);

  it('runs two handlers on one topic in parallel', async () => {
    const { bus } = await import('../bus.js');
    const order: string[] = [];
    bus.subscribe('a', 'ticket.created', async () => { await new Promise((r) => setTimeout(r, 50)); order.push('a'); });
    bus.subscribe('b', 'ticket.created', async () => { await new Promise((r) => setTimeout(r, 50)); order.push('b'); });
    const start = Date.now();
    await bus.publish('ticket.created', {});
    expect(Date.now() - start).toBeLessThan(150);
    expect(order.sort()).toEqual(['a', 'b']);
  });

  it('runs a skill once when the same eventId is published twice', async () => {
    const { bus } = await import('../bus.js');
    let calls = 0;
    bus.subscribe('once', 'ticket.triaged', async () => { calls++; });
    await bus.publish('ticket.triaged', {}, 'fixed-id');
    await bus.publish('ticket.triaged', {}, 'fixed-id');
    expect(calls).toBe(1);
  });

  it('does not let one failing handler stop the others', async () => {
    const { bus } = await import('../bus.js');
    let ran = false;
    bus.subscribe('fails', 'sow.drafted', async () => { throw new Error('boom'); });
    bus.subscribe('ok', 'sow.drafted', async () => { ran = true; });
    await bus.publish('sow.drafted', {});
    expect(ran).toBe(true);
  });

  it('retries a failed handler on republish of the same eventId', async () => {
    const { bus } = await import('../bus.js');
    let calls = 0;
    bus.subscribe('retry', 'build.failed', async () => { calls++; if (calls === 1) throw new Error('boom'); });
    await bus.publish('build.failed', {}, 'retry-id');
    await bus.publish('build.failed', {}, 'retry-id');
    expect(calls).toBe(2);
  });
});
