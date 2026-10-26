import { DatabaseSync } from 'node:sqlite';
import { randomBytes } from 'node:crypto';
import { must } from './must.js';
import type { AcceptanceTest, Build, ChangeRequest, Commitment, Deal, GreenBy, Sow, SowLine,
  TestRun, TestStatus, Ticket, Transcript } from './types.js';

export const db = new DatabaseSync(process.env.PACT_DB ?? 'pact.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS docs (kind TEXT, id TEXT, doc TEXT, PRIMARY KEY (kind, id));
  CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, topic TEXT, payload TEXT, at INTEGER);
  CREATE TABLE IF NOT EXISTS handled (event_id TEXT, skill TEXT, done INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (event_id, skill));
  CREATE TABLE IF NOT EXISTS llm_calls (at INTEGER, skill TEXT, model TEXT, host TEXT, locality TEXT, outcome TEXT);`);

const get = <T>(kind: string, id: string | number): T | undefined => {
  const r = db.prepare('SELECT doc FROM docs WHERE kind=? AND id=?').get(kind, String(id)) as { doc: string } | undefined;
  return r && JSON.parse(r.doc);
};
const put = <T extends object>(kind: string, id: string | number, doc: T): T => {
  db.prepare('INSERT OR REPLACE INTO docs VALUES (?,?,?)').run(kind, String(id), JSON.stringify(doc));
  return doc;
};
const all = <T>(kind: string): T[] =>
  (db.prepare('SELECT doc FROM docs WHERE kind=?').all(kind) as { doc: string }[]).map((r) => JSON.parse(r.doc));
const patch = <T extends object>(kind: string, id: string, p: Partial<T>): T =>
  put(kind, id, { ...must(get<T>(kind, id), `${kind} ${id}`), ...p });
const newId = (prefix: string) => `${prefix}_${randomBytes(4).toString('hex')}`; // e.g. build_3f9a01c2
// test id = t_ + SOW line id with non-alphanumerics as _ ('§3.1' -> 't_3_1')
const testIdFor = (sowLineId: string) => `t_${sowLineId.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`;
const sowKey = (dealId: string, version: number) => `${dealId}:${version}`;
const sows = (dealId: string) => all<Sow>('sow').filter((s) => s.dealId === dealId).sort((a, b) => a.version - b.version);
const byDeal = <T extends { dealId: string }>(kind: string, dealId: string) => all<T>(kind).filter((x) => x.dealId === dealId);
const builds = () => all<Build>('build').sort((a, b) => a.createdAt - b.createdAt);
const testRuns = (buildId: string) =>
  all<TestRun>('testRun').filter((r) => r.buildId === buildId).sort((a, b) => a.at - b.at);

export const store = {
  get, put, all, newId, testIdFor,
  // deals and transcripts
  saveDeal: (d: Deal) => put('deal', d.id, d),
  getDeal: (id: string) => get<Deal>('deal', id),
  listDeals: () => all<Deal>('deal'),
  setDealStage: (id: string, stage: Deal['stage']) => patch<Deal>('deal', id, { stage }),
  saveTranscript: (t: Transcript) => put('transcript', t.id, t),
  getTranscript: (id: string) => get<Transcript>('transcript', id),
  listTranscripts: (dealId: string) => byDeal<Transcript>('transcript', dealId),
  // commitments
  saveCommitments: (cs: Commitment[]) => cs.map((c) => put('commitment', c.id, c)),
  getCommitmentsByDeal: (dealId: string) => byDeal<Commitment>('commitment', dealId),
  replaceCommitments(dealId: string, cs: Commitment[]) {
    db.prepare(`DELETE FROM docs WHERE kind='commitment' AND json_extract(doc,'$.dealId')=?`).run(dealId);
    return cs.map((c) => put('commitment', c.id, c));
  },
  // SOW: one doc per version
  getSow: (dealId: string, version?: number) =>
    version === undefined ? sows(dealId).at(-1) : get<Sow>('sow', sowKey(dealId, version)), // latest if omitted
  saveSow: (s: Sow) => put('sow', sowKey(s.dealId, s.version), s),
  approveSow: (dealId: string, version: number) => patch<Sow>('sow', sowKey(dealId, version), { status: 'approved' }),
  getApprovedSow: (dealId: string) => sows(dealId).filter((s) => s.status === 'approved').at(-1),
  // CR path: copies the latest version plus the new line into version+1, already approved (the CR approval is the approval)
  addSowLine(dealId: string, line: Omit<SowLine, 'id' | 'sowVersion'> & { sowVersion?: number }) {
    const prev = must(sows(dealId).at(-1), `sow for ${dealId}`), version = prev.version + 1;
    return put<Sow>('sow', sowKey(dealId, version), { dealId, version, status: 'approved',
      lines: [...prev.lines, { ...line, id: newId('line'), sowVersion: version }] });
  },
  // acceptance tests
  saveAcceptanceTest: (t: AcceptanceTest) => put('test', t.id, t),
  listAcceptanceTests: (dealId: string) => byDeal<AcceptanceTest>('test', dealId),
  setTestStatus: (testId: string, status: TestStatus, buildId: string) =>
    patch<AcceptanceTest>('test', testId, { status, lastBuildId: buildId }),
  setGreenBy: (testId: string, by: GreenBy) => put('greenBy', testId, by),
  getGreenBy: (testId: string) => get<GreenBy>('greenBy', testId),
  // builds and test runs
  createBuild(b: Pick<Build, 'dealId' | 'kind' | 'ref'> & Partial<Omit<Build, 'id' | 'dealId' | 'kind' | 'ref'>>) {
    const id = newId('build');
    return put<Build>('build', id, { status: 'queued', createdAt: Date.now(),
      srcDir: `/tmp/pact-builds/${id}/src`, ...b, id }); // prototypes pass their own srcDir
  },
  getBuild: (id: string) => get<Build>('build', id),
  updateBuild: (id: string, p: Partial<Build>) => patch<Build>('build', id, p),
  listBuilds: builds,
  latestBuild: (kind: Build['kind']) => builds().filter((b) => b.kind === kind).at(-1),
  saveTestRun: (r: TestRun) => put('testRun', r.id, r), // {id, buildId, at, results}
  listTestRuns: testRuns,
  latestTestRun: (buildId: string) => testRuns(buildId).at(-1), // what buildAndTest returns
  // GitHub bookkeeping
  setIssueNumber: (sowLineId: string, n: number) => put('issue', sowLineId, { sowLineId, n }),
  getIssueNumber: (sowLineId: string) => get<{ n: number }>('issue', sowLineId)?.n,
  sowLineForIssue: (n: number) => all<{ sowLineId: string; n: number }>('issue').find((i) => i.n === n)?.sowLineId,
  markCommentPosted: (key: string) => put('flag', `comment:${key}`, {}),
  hasPostedComment: (key: string) => get('flag', `comment:${key}`) !== undefined,
  markPrSeen: (n: number) => put('flag', `pr:${n}`, {}),
  isPrSeen: (n: number) => get('flag', `pr:${n}`) !== undefined,
  // change requests and tickets
  createChangeRequest(cr: Omit<ChangeRequest, 'id' | 'status'>) {
    const id = newId('cr');
    return put<ChangeRequest>('cr', id, { ...cr, id, status: 'draft' });
  },
  getChangeRequest: (id: string) => get<ChangeRequest>('cr', id),
  approveChangeRequest: (id: string) => patch<ChangeRequest>('cr', id, { status: 'approved' }),
  rejectChangeRequest: (id: string) => patch<ChangeRequest>('cr', id, { status: 'rejected' }),
  updateChangeRequest: (id: string, p: Partial<ChangeRequest>) => patch<ChangeRequest>('cr', id, p),
  listChangeRequests: (dealId: string) => byDeal<ChangeRequest>('cr', dealId),
  createTicket(t: Pick<Ticket, 'dealId' | 'text'>) {
    const id = newId('ticket');
    return put<Ticket>('ticket', id, { ...t, id, status: 'open' });
  },
  getTicket: (id: string) => get<Ticket>('ticket', id),
  updateTicket: (id: string, p: Partial<Ticket>) => patch<Ticket>('ticket', id, p),
  listTickets: (dealId: string) => byDeal<Ticket>('ticket', dealId),
};
export type Store = typeof store;
