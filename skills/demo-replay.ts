import { readFile } from 'node:fs/promises';
import type { Skill } from '@pact/core';
// Reads demo/fixtures/runs/<runId>.json ({topic, payload}[] recorded from a real run)
// and re-publishes each event on the real bus, so the dashboard updates through its normal path.
export const demoReplay: Skill<{ runId: string }, void> = async ({ runId }, ctx) => {
  const events = JSON.parse(await readFile(new URL(`../demo/fixtures/runs/${runId}.json`, import.meta.url), 'utf8'));
  for (const e of events) await ctx.bus.publish(e.topic, e.payload);
};
