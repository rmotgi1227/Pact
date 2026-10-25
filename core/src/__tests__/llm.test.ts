import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

async function freshDb() {
  const { mkdtemp } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  process.env.PACT_DB = join(await mkdtemp(join(tmpdir(), 'pact-llm-')), 'pact.db');
}

describe('llm guard', () => {
  beforeEach(async () => {
    await freshDb();
    delete process.env.PACT_GB10_HOST;
  });
  afterEach(() => vi.unstubAllGlobals());

  it('blocks a non-local host before fetching, and counts it as blocked', async () => {
    process.env.PACT_LLM_URL = 'https://not-local.example.com';
    vi.resetModules();
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const { makeLlm } = await import('../llm.js');
    const { counter } = await import('../counter.js');
    await expect(makeLlm('test-skill').json({ role: 'reasoning', system: 's', user: 'u', schema: z.object({}) }))
      .rejects.toThrow(/blocked/);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(counter().blocked).toBe(1);
    delete process.env.PACT_LLM_URL;
  });

  it('strips <think> blocks and parses the remaining JSON', async () => {
    process.env.PACT_LLM_URL = 'http://127.0.0.1:11434';
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true,
      json: async () => ({ message: { content: '<think>hmm</think>{"ok":true}' } }) }));
    const { makeLlm } = await import('../llm.js');
    const out = await makeLlm('test-skill').json({ role: 'reasoning', system: 's', user: 'u',
      schema: z.object({ ok: z.boolean() }) });
    expect(out).toEqual({ ok: true });
    delete process.env.PACT_LLM_URL;
  });
});
