// goal S1b (Shreyas). Runs demo/fixtures/decide-eval.json through the real ctx.decide and reports
// accuracy, plus the lowest confidence threshold at which "sure" answers are all correct.
// Usage: pnpm tsx infra/decide/eval.ts   (exit 1 if accuracy is below PACT_DECIDE_MIN_ACC, default 0.8)
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.PACT_DB ??= join(tmpdir(), 'pact-decide-eval.db'); // keep eval calls out of the demo counter
const { makeDecide, profile } = await import('@pact/core');
type Case = { use: string; note: string; state: string; question: string; options: { key: string; label: string }[]; expected: string };
const { cases } = JSON.parse(await readFile(new URL('../../demo/fixtures/decide-eval.json', import.meta.url), 'utf8')) as { cases: Case[] };

const decide = makeDecide('decide-eval');
const rows: { ok: boolean; p: number | null; ms: number }[] = [];
for (const c of cases) {
  const t0 = Date.now();
  const d = await decide.choose(c);
  const ok = d.key === c.expected;
  rows.push({ ok, p: d.p, ms: Date.now() - t0 });
  console.log(`${ok ? 'ok  ' : 'MISS'} p=${d.p?.toFixed(3) ?? 'null'} ${c.use.padEnd(24)} ${c.note}${ok ? '' : `  (got ${d.key}, want ${c.expected})`}`);
}

const acc = rows.filter((r) => r.ok).length / rows.length;
// Lowest threshold where every answer at or above it is right; the rest would escalate to Qwen.
const ps = [...new Set(rows.map((r) => r.p ?? 1))].sort((a, b) => a - b);
const minP = ps.find((t) => rows.every((r) => (r.p ?? 1) < t || r.ok)) ?? 1;
const sure = rows.filter((r) => (r.p ?? 1) >= minP).length;
const ms = rows.map((r) => r.ms).sort((a, b) => a - b)[Math.floor(rows.length / 2)];
console.log(`\nmodel ${profile.decide.model} @ ${profile.decide.url}`);
console.log(`accuracy ${(acc * 100).toFixed(1)}% (${rows.filter((r) => r.ok).length}/${rows.length}), median ${ms} ms`);
console.log(`suggested PACT_DECIDE_MIN_P=${minP.toFixed(2)} (${sure}/${rows.length} sure, rest escalate to Qwen)`);
process.exit(acc >= Number(process.env.PACT_DECIDE_MIN_ACC ?? 0.8) ? 0 : 1);
