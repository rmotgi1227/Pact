// The shared contract (build-plan.md, Phase A). Only Rishab changes this file.
export type Quote = { transcriptId: string; t: number; text: string };
export type Deal = { id: string; name: string; stage: 'negotiation' | 'closed_won' };
export type Transcript = { id: string; dealId: string; kind: 'sales' | 'status';
  lines: { t: number; speaker: string; text: string }[] };
export type Commitment = { id: string; dealId: string; text: string; quote: Quote; quotes?: Quote[] }; // quotes: every source after a merge
export type SowLine = { id: string; sowVersion: number; title: string; criterion: string; commitmentIds: string[] };
export type Sow = { dealId: string; version: number; status: 'draft' | 'approved'; lines: SowLine[] };
export type TestStatus = 'red' | 'green' | 'unknown';
export type AcceptanceTest = { id: string; dealId: string; sowLineId: string; file: string;
  status: TestStatus; lastBuildId?: string };
export type GreenBy = { prNumber: number; author: string };
// dealId, kind, ref and srcDir are set at creation. Prototype: srcDir = fillTemplate output.
// pr/main: srcDir defaults to /tmp/pact-builds/<id>/src and the builder fills it with `git archive <sha>`.
export type Build = { id: string; dealId: string; kind: 'prototype' | 'pr' | 'main'; ref: string; srcDir: string;
  prNumber?: number; author?: string; createdAt: number;
  status: 'queued' | 'building' | 'ready' | 'testing' | 'passed' | 'failed'; deployUrl?: string;
  repoUrl?: string }; // repoUrl: a tested prototype's own GitHub repo
export type TestRun = { id: string; buildId: string; at: number; results: { testId: string; pass: boolean; error?: string }[] };
export type ChangeRequest = { id: string; dealId: string; request: string; quote: Quote; ack?: Quote; // ack = the team's "sure" reply
  estimate: string | null; needsReview?: boolean; status: 'draft' | 'approved' | 'rejected';
  source?: 'call' | 'ticket'; ticketId?: string;  // where the scope creep came from (default: a status call)
  approvalRequested?: { to: string; at: number } | { error: string; at: number };  // approve/deny email to the operator
  changeOrder?: ChangeOrder };
// Drafted (Qwen writes the prose, code fills number/estimate/quotes) and emailed to the customer once a CR is approved.
export type ChangeOrder = { number: string; subject: string; body: string; draftedAt: number;
  emailedTo?: string; emailedAt?: number; emailError?: string };
export type Ticket = { id: string; dealId: string; text: string; status: 'open' | 'triaged';
  verdict?: 'warranty' | 'change_request' | 'not_reproduced'; sowLineId?: string; testId?: string;
  buildId?: string; assignee?: string; reason?: string };
export type SkillLog = { skill: string; level: 'info' | 'warn' | 'error'; msg: string; at: number; extra?: unknown };
export type Topic = 'transcript.added' | 'deal.closed_won' | 'commitments.consolidated' | 'sow.line.drafted'
  | 'sow.drafted' | 'sow.approved' | 'tests.generated' | 'build.requested' | 'build.ready' | 'build.passed'
  | 'build.failed' | 'share.requested' | 'build.shared' | 'cr.drafted' | 'cr.approved' | 'ticket.created' | 'ticket.triaged'
  | 'skill.log' | 'demo.replay';

// Exactly what GET /state returns. The dashboard imports this and renders only these fields.
export type StateSnapshot = {
  deal: Deal;
  transcripts: Transcript[];
  commitments: Commitment[];
  sow: Sow | null;                            // latest version, draft or approved; lines grow as drafted
  tests: AcceptanceTest[];
  builds: (Build & { run?: TestRun })[];      // oldest first; run = that build's latest TestRun
  coverage: { green: number; total: number; buildId: string | null }; // latest pr/main build with a run
  prototype: { buildId: string; url: string; repoUrl?: string } | null;                 // latest deployed prototype
  crs: ChangeRequest[];
  tickets: Ticket[];
  logs: SkillLog[];                           // last 50
  counter: { local: number; cloud: number; blocked: number };
  // what Pact is doing right now: openclaw = waiting on OpenClaw's turn, running = the skill itself is running
  activity: { skill: string; topic: Topic; since: number; stage: 'openclaw' | 'running' }[];
};
