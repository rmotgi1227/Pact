import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('decide', () => {
  beforeEach(async () => {
    const { mkdtemp } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    process.env.PACT_DB = join(await mkdtemp(join(tmpdir(), 'pact-decide-')), 'pact.db');
  });
  afterEach(() => vi.unstubAllGlobals());

  it('maps the chosen letter to its option key and reads p from logprobs', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({
      choices: [{ message: { content: 'B' },
        logprobs: { content: [{ top_logprobs: [{ token: 'B', logprob: Math.log(0.9) }] }] } }],
    }) }));
    const { makeDecide } = await import('../decide.js');
    const d = await makeDecide('test-skill').choose({
      state: 's', question: 'q',
      options: [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }],
    });
    expect(d).toEqual({ key: 'b', p: 0.9 });
  });

  it('returns unclear for an out-of-range letter', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({
      choices: [{ message: { content: 'Z' }, logprobs: null }],
    }) }));
    const { makeDecide } = await import('../decide.js');
    const d = await makeDecide('test-skill').choose({
      state: 's', question: 'q',
      options: [{ key: 'a', label: 'A' }],
    });
    expect(d).toEqual({ key: 'unclear', p: null });
  });
});
