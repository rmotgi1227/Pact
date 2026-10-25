// goal S3 (Shreyas). See build-plan.md, Phase D.
import type { Skill } from '@pact/core';
import { must } from '@pact/core';
import { GenerateTestsOut } from '../../prompts/generate-acceptance-tests/schema.js';

const IMPORT = /from ['"]@playwright\/test['"]/;

// The model never touches the store or the specs dir: code validates every spec before it's saved.
// An unknown sowLineId or a spec without test() stays unsaved, so that line stays without a test
// (counted as failed), never silently green.
export const handler: Skill<{ dealId: string; version: number }, void> = async ({ dealId, version }, ctx) => {
  const sow = must(ctx.store.getSow(dealId, version), `sow ${dealId} v${version}`);
  const existing = new Set(ctx.store.listAcceptanceTests(dealId).map((t) => t.sowLineId));
  // On a CR (SOW v2+) only the new line(s) lack a test; existing tests, statuses and greenBy stay.
  const pending = sow.lines.filter((l) => !existing.has(l.id));
  if (pending.length === 0) return;
  const system = await ctx.readPrompt('generate-acceptance-tests');

  // One line per call: a small local model drops lines when asked for several at once.
  // One retry for a line that came back with no usable spec.
  for (const line of pending) {
    for (let attempt = 1; attempt <= 2 && !existing.has(line.id); attempt++) {
      const out = await ctx.llm.json({
        role: 'coding', system, schema: GenerateTestsOut,
        user: JSON.stringify({ sowLineIds: [line.id], lines: [{ id: line.id, title: line.title, criterion: line.criterion }] }),
      });
      for (const t of out.tests) {
        // Small local models often drop the import line. Adding it is deterministic, so code does it
        // (fix from Rishab's R4 run). A spec that still has no test() is rejected.
        if (!IMPORT.test(t.source) && /\btest\(/.test(t.source))
          t.source = `import { test, expect } from '@playwright/test';\n${t.source}`;
        const knownId = t.sowLineId === line.id;
        const hasImport = IMPORT.test(t.source);
        if (!knownId || !hasImport || existing.has(t.sowLineId)) {
          ctx.log.warn('spec rejected', { sowLineId: t.sowLineId, knownId, hasImport, attempt });
          continue;
        }
        const id = ctx.store.testIdFor(t.sowLineId);
        const file = await ctx.files.writeSpec(dealId, id, t.source);
        ctx.store.saveAcceptanceTest({ id, dealId, sowLineId: t.sowLineId, file, status: 'unknown' });
        existing.add(t.sowLineId);
        ctx.log.info(`spec written for ${t.sowLineId}`, { testId: id, attempt });
      }
      if (!existing.has(line.id)) ctx.log.warn(`no usable spec for ${line.id}`, { attempt });
    }
  }

  await ctx.bus.emit('tests.generated', { dealId, version });
};
