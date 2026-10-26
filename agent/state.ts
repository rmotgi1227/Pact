import { bus, counter, must, store, type SkillLog, type StateSnapshot } from '@pact/core';

export const DEAL_ID = 'hertz-demo'; // the one demo deal

const logs: SkillLog[] = []; // last 50 skill.log lines
export const trackLogs = () => bus.listen((e) => {
  if (e.topic === 'skill.log') { logs.push(e.payload); if (logs.length > 50) logs.shift(); }
});

export function snapshot(): StateSnapshot {
  const deal = must(store.getDeal(DEAL_ID), `deal ${DEAL_ID}`); // seeded on startup
  const sow = store.getSow(DEAL_ID) ?? null, tests = store.listAcceptanceTests(DEAL_ID);
  const builds = store.listBuilds().filter((b) => b.dealId === DEAL_ID)
    .map((b) => ({ ...b, run: store.latestTestRun(b.id) }));
  // coverage = green SOW lines / SOW lines, from the latest engineering (pr or main) build that has a TestRun.
  // Prototype results stay on the prototype's own build row.
  const eng = builds.filter((b) => b.kind !== 'prototype' && b.run).at(-1);
  const passed = new Set(eng?.run?.results.filter((r) => r.pass).map((r) => r.testId) ?? []);
  const greenLines = new Set(tests.filter((t) => passed.has(t.id)).map((t) => t.sowLineId));
  const lines = sow?.lines ?? [];
  const proto = builds.filter((b) => b.kind === 'prototype' && b.deployUrl).at(-1);
  return {
    deal, sow, tests, builds,
    transcripts: store.listTranscripts(DEAL_ID),
    commitments: store.getCommitmentsByDeal(DEAL_ID),
    coverage: { green: lines.filter((l) => greenLines.has(l.id)).length, total: lines.length, buildId: eng?.id ?? null },
    prototype: proto?.deployUrl ? { buildId: proto.id, url: proto.deployUrl, repoUrl: proto.repoUrl } : null,
    crs: store.listChangeRequests(DEAL_ID),
    tickets: store.listTickets(DEAL_ID),
    logs: [...logs],
    counter: counter(),
    activity: bus.activity().map(({ skill, topic, since, stage }) => ({ skill, topic, since, stage })),
  };
}
