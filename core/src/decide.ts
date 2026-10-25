// Tev1-4B-experimental: picks one option from a state, a question and 2-24 lettered options,
// and answers with a single letter. Used when "is this in scope?" is a choice, not writing.
// See build-plan.md, Phase F2.
import { profile } from './profiles.js';
import { recordLocal } from './counter.js';

export type Option = { key: string; label: string };
export type Decision = { key: string; p: number | null }; // p = probability of the chosen letter, if logprobs exist

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWX';

export const makeDecide = (skill: string) => ({
  async choose(a: { state: string; question: string; options: Option[] }): Promise<Decision> {
    const opts = a.options.slice(0, 24);
    const user = `State:\n${a.state}\n\nQuestion: ${a.question}\n\nOptions:\n` +
      opts.map((o, i) => `${LETTERS[i]}. ${o.label}`).join('\n') + '\n\nAnswer with one letter.';
    const res = await fetch(`${profile.decide.url}/chat/completions`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, signal: AbortSignal.timeout(15_000),
      // Thinking must be off, or the model spends its 8-token budget thinking and returns no
      // letter (infra/decide/README.md). Ollama reads reasoning_effort; vLLM reads the
      // chat_template_kwargs flag. Harmless to send both no matter which server answers.
      body: JSON.stringify({ model: profile.decide.model, temperature: 0, max_tokens: 8,
        messages: [{ role: 'user', content: user }], logprobs: true, top_logprobs: 5,
        reasoning_effort: 'none', chat_template_kwargs: { enable_thinking: false } }),
    });
    const j = await res.json();
    recordLocal(skill, profile.decide.model, new URL(profile.decide.url).hostname); // same llm_calls log, so the counter stays honest
    const letter = (j.choices[0].message.content as string).trim().charAt(0).toUpperCase();
    const i = LETTERS.indexOf(letter);
    if (i < 0 || i >= opts.length) return { key: 'unclear', p: null }; // treated as unsure by the caller
    const lp = j.choices[0].logprobs?.content?.[0]?.top_logprobs?.find((t: any) => t.token.trim() === letter);
    return { key: opts[i].key, p: lp ? Math.exp(lp.logprob) : null };
  },
});
export type Decide = ReturnType<typeof makeDecide>;
