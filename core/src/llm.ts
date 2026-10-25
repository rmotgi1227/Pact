import type { z } from 'zod';
import { db } from './store.js';
import { profile } from './profiles.js';
import { recordBlocked } from './counter.js';

type Role = 'reasoning' | 'coding';
const LOCAL_HOSTS = ['127.0.0.1', 'localhost', 'gb10.local', process.env.PACT_GB10_HOST];
const record = db.prepare('INSERT INTO llm_calls VALUES (?,?,?,?,?,?)');
const stripThink = (s: string) => s.replace(/<think>[\s\S]*?<\/think>/g, '');
const tryJson = (s: string): unknown => {
  try { return JSON.parse(s.trim().replace(/^`{3}(?:json)?\s*|\s*`{3}$/g, '')); } catch { return undefined; }
};

export const makeLlm = (skill: string) => {
  const host = new URL(profile.url).hostname;
  const guard = (model: string) => { // throws before any fetch to a non-local host
    if (LOCAL_HOSTS.includes(host)) return;
    recordBlocked(host, skill, model);
    throw new Error(`blocked: ${host} is not local`);
  };
  const note = (model: string, outcome: string) => record.run(Date.now(), skill, model, host, 'local', outcome);
  const post = async (path: string, body: object, ms: number) => {
    const res = await fetch(`${profile.url}${path}`, { method: 'POST', signal: AbortSignal.timeout(ms),
      headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`${skill}: ollama ${res.status} ${await res.text()}`);
    return res;
  };
  const messages = (system: string, user: string) =>
    [{ role: 'system', content: `/no_think\n${system}` }, { role: 'user', content: user }];

  const embed = async (texts: string[]): Promise<number[][]> => {
    guard(profile.embed);
    const res = await post('/api/embed', { model: profile.embed, input: texts }, 90_000);
    note(profile.embed, 'ok');
    return (await res.json()).embeddings;
  };

  return {
    async json<S extends z.ZodTypeAny>(a: { role: Role; system: string; user: string; schema: S }): Promise<z.infer<S>> {
      const model = profile[a.role]; guard(model);
      const msgs = messages(a.system, a.user);
      for (let attempt = 0; attempt < 2; attempt++) { // one repair retry
        const res = await post('/api/chat', { model, messages: msgs, stream: false, format: 'json',
          options: { temperature: 0 } }, 90_000);
        const text = stripThink((await res.json()).message.content).trim();
        const out = a.schema.safeParse(tryJson(text));
        if (out.success) { note(model, 'ok'); return out.data; }
        msgs.push({ role: 'assistant', content: text },
          { role: 'user', content: `That JSON was invalid: ${out.error.message}. Reply with fixed JSON only.` });
      }
      note(model, 'invalid');
      throw new Error(`${skill}: model JSON failed schema twice`);
    },

    // Real streaming: the model writes one JSON object per line, and each complete line is validated and handed
    // to onItem as soon as it arrives. Invalid lines are skipped. Throws if no line was valid.
    async jsonLines<S extends z.ZodTypeAny>(a: { role: Role; system: string; user: string; itemSchema: S;
      onItem: (item: z.infer<S>) => unknown }): Promise<z.infer<S>[]> {
      const model = profile[a.role]; guard(model);
      const res = await post('/api/chat', { model, messages: messages(a.system, a.user), stream: true,
        options: { temperature: 0 } }, 300_000); // whole stream, a full SOW on the 35B can pass 90 s
      const reader = res.body!.getReader(), dec = new TextDecoder(), items: z.infer<S>[] = [];
      let wire = '', text = '';
      const drain = async (final: boolean) => {
        text = stripThink(text);
        if (!final && text.includes('<think>')) return; // still inside a think block
        const lines = text.split('\n');
        text = final ? '' : lines.pop()!;
        for (const line of lines) {
          const out = a.itemSchema.safeParse(tryJson(line));
          if (out.success) { items.push(out.data); await a.onItem(out.data); }
        }
      };
      for (let r = await reader.read(); !r.done; r = await reader.read()) {
        wire += dec.decode(r.value, { stream: true });
        const frames = wire.split('\n'); // Ollama sends newline-delimited JSON frames
        wire = frames.pop()!;
        for (const f of frames) if (f.trim()) text += JSON.parse(f).message?.content ?? '';
        await drain(false);
      }
      await drain(true);
      note(model, items.length ? 'ok' : 'invalid');
      if (!items.length) throw new Error(`${skill}: stream had no valid JSON lines`);
      return items;
    },

    embed,
    // Rank items by cosine similarity to a query. Used by consolidate, classify and triage.
    async embedTopK<T extends { text?: string; criterion?: string }>(query: string, items: T[], k: number): Promise<T[]> {
      const [q, ...vs] = await embed([query, ...items.map((i) => i.criterion ?? i.text ?? '')]);
      const cos = (x: number[], y: number[]) =>
        x.reduce((s, v, i) => s + v * y[i], 0) / (Math.hypot(...x) * Math.hypot(...y));
      return items.map((it, i) => ({ it, s: cos(q, vs[i]) })).sort((x, y) => y.s - x.s).slice(0, k).map((x) => x.it);
    },
  };
};
export type Llm = ReturnType<typeof makeLlm>;
