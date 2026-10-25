// goal A3 (Aryan). Runs on build.passed AND build.failed for kind 'pr'. See build-plan.md, Phase D.
import type { Skill } from '@pact/core';
import { must } from '@pact/core';
import { MapPrOut } from '../../prompts/map-pr-to-sow/schema.js';

// Two real signals: the PR's "Fixes #n" links (github-sync opened one issue per SOW line), and the
// coding model reading the diff (ids restricted to the current SOW). A line gets a comment and credit
// only if its test is green for this exact build.
export const handler: Skill<{ buildId: string }, void> = async ({ buildId }, ctx) => {
  const build = must(ctx.store.getBuild(buildId), `build ${buildId}`);
  if (build.kind !== 'pr' || !build.prNumber) return;

  const pr = await ctx.github.getPr(build.prNumber);
  const sow = must(ctx.store.getApprovedSow(build.dealId), `approved sow ${build.dealId}`);
  const sowIds = sow.lines.map((l) => l.id);
  const fromIssues = pr.linkedIssues.map((n) => ctx.store.sowLineForIssue(n)).filter((x): x is string => !!x);

  const diff = (await ctx.github.getDiff(build.prNumber)).slice(0, 20_000);
  const fromModel = await ctx.llm.json({
    role: 'coding', schema: MapPrOut, system: await ctx.readPrompt('map-pr-to-sow'),
    user: JSON.stringify({ sowLines: sow.lines.map((l) => ({ id: l.id, criterion: l.criterion })), diff }),
  });

  // Third, deterministic signal (fix from Rishab's e2e run; Aryan owns this file): a test that was red on the
  // previous engineering build and is green on this PR's build was turned green by this PR.
  const tests = ctx.store.listAcceptanceTests(build.dealId);
  const run = ctx.store.latestTestRun(buildId);
  const prev = ctx.store.listBuilds()
    .filter((b) => b.dealId === build.dealId && b.kind !== 'prototype' && b.createdAt < build.createdAt && ctx.store.latestTestRun(b.id))
    .at(-1);
  const prevRun = prev ? ctx.store.latestTestRun(prev.id) : undefined;
  const wasGreen = new Set(prevRun?.results.filter((r) => r.pass).map((r) => r.testId) ?? []);
  const nowGreen = new Set(run
    ? run.results.filter((r) => r.pass).map((r) => r.testId)
    : tests.filter((t) => t.status === 'green' && t.lastBuildId === buildId).map((t) => t.id));
  const fromTests = run ? tests.filter((t) => nowGreen.has(t.id) && !wasGreen.has(t.id)).map((t) => t.sowLineId) : [];

  const mapped = [...new Set([...fromIssues, ...fromTests, ...fromModel.sowLineIds.filter((id) => sowIds.includes(id))])];
  for (const lineId of mapped) {
    const test = tests.find((t) => t.sowLineId === lineId);
    if (!test || !nowGreen.has(test.id)) continue; // green on this exact build
    const key = `${build.prNumber}:${lineId}`;
    if (!ctx.store.hasPostedComment(key)) {
      await ctx.github.comment(build.prNumber, `Satisfies SOW ${lineId}`);
      ctx.store.markCommentPosted(key);
      ctx.log.info(`PR #${build.prNumber}: Satisfies SOW ${lineId}`);
    }
    if (!ctx.store.getGreenBy(test.id)) ctx.store.setGreenBy(test.id, { prNumber: build.prNumber, author: build.author ?? pr.author });
  }
};
