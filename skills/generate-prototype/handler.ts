// goal R4 (Rishab, drafted by ajay). See build-plan.md, Phase E.
import type { Skill } from '@pact/core';
import { must } from '@pact/core';
import { GenerateSlotsOut } from '../../prompts/generate-prototype/schema.js';
import { fillTemplate } from '../../builder/fill-template.js';

export const handler: Skill<{ dealId: string; version: number }, { buildId: string }> =
  async ({ dealId, version }, ctx) => {
    const sow = must(ctx.store.getSow(dealId, version), `sow ${dealId} v${version}`);
    const slots = await ctx.llm.json({
      role: 'coding',
      system: await ctx.readPrompt('generate-prototype'),
      user: JSON.stringify(sow.lines.map((l) => ({ id: l.id, title: l.title, criterion: l.criterion }))),
      schema: GenerateSlotsOut,
    });

    const build = ctx.store.createBuild({ dealId, kind: 'prototype', ref: `prototype-v${version}` });
    await fillTemplate(build.id, slots); // writes into build.srcDir, which createBuild already set
    await ctx.bus.publish('build.requested', { buildId: build.id });
    return { buildId: build.id };
  };
