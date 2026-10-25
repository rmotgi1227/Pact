// goal S3 (Shreyas). See build-plan.md, Phase D.
import type { Skill } from '@pact/core';
import { must } from '@pact/core';
import { GenerateTestsOut } from '../../prompts/generate-acceptance-tests/schema.js';

// The model never touches the store or the specs dir: code validates every spec before it's saved.
// An unknown sowLineId or a spec without the @playwright/test import stays unsaved, so that line
// stays without a test (counted as failed), never silently green.
export const handler: Skill<{ dealId: string; version: number }, void> = async ({ dealId, version }, ctx) => {
  const sow = must(ctx.store.getSow(dealId, version), `sow ${dealId} v${version}`);
  const existing = new Set(ctx.store.listAcceptanceTests(dealId).map((t) => t.sowLineId));
  // On a CR (SOW v2+) only the new line(s) lack a test; existing tests, statuses and greenBy stay.
  const pending = sow.lines.filter((l) => !existing.has(l.id));
  if (pending.length === 0) return;
  const sowLineIds = pending.map((l) => l.id);

  const out = await ctx.llm.json({
    role: 'coding',
    system: await ctx.readPrompt('generate-acceptance-tests'),
    user: JSON.stringify({ sowLineIds, lines: pending.map((l) => ({ id: l.id, title: l.title, criterion: l.criterion })) }),
    schema: GenerateTestsOut,
  });

  for (const t of out.tests) {
    const knownId = sowLineIds.includes(t.sowLineId);
    const hasImport = /from ['"]@playwright\/test['"]/.test(t.source);
    if (!knownId || !hasImport || existing.has(t.sowLineId)) {
      ctx.log.warn('spec rejected', { sowLineId: t.sowLineId, knownId, hasImport });
      continue;
    }
    const id = ctx.store.testIdFor(t.sowLineId);
    const file = await ctx.files.writeSpec(dealId, id, t.source);
    ctx.store.saveAcceptanceTest({ id, dealId, sowLineId: t.sowLineId, file, status: 'unknown' });
    existing.add(t.sowLineId);
  }

  await ctx.bus.emit('tests.generated', { dealId, version });
};
