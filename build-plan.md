# Pact — Build Plan

**What we're building:** an event-driven agent that turns a closed deal into a contract that tests itself. The SOW is written from the sales calls, and every SOW line gets an acceptance test. Pact builds a prototype from the SOW and shares it, engineering's code is checked against the tests, and every new request or ticket is judged against the same SOW.
**The demo:** "Hertz's rebuild, replayed with Pact."
**Build rule: a real, working agent.**
- Every output on screen comes from a real skill running on real inputs: real transcripts, a real SOW, real tests, real containers, real deploys. No hard-coded results and no scripted answers.
- Keep the code simple, and don't spend time on edge cases the flow never hits (multiple deals, huge diffs, odd inputs).
- If something breaks, fix the real path. Cached fallbacks (Phase H) are for stage emergencies only, and they replay a real earlier run.
**Tech lead:** Rishab. Rishab owns the shared contracts (Phase A) and `main`. Nothing is pushed without Rishab's say-so.
**Drafted by the ycrest squad:** albert (A), derek (B), andreas (C), gary (D), ajay (E, G), deepak (F). **Reviewed by:** terence (codex), gary, gokul and deepak. Every main-path finding is fixed. The code is still a draft that nobody has run, and anything about NemoClaw, OpenClaw or OpenShell is marked `UNVERIFIED`.

---

## Which model runs what

| Where | Job | Model |
|---|---|---|
| **GB10** | **OpenClaw's agent brain** and all reasoning skills (commitments, SOW, classify, triage) | **Qwen3.6-35B-A3B**, the model NemoClaw installs and preselects |
| GB10 | Coding skills (acceptance tests, prototype fill, PR mapping) | **Qwen3-Coder-30B-A3B** |
| GB10 | Matching (embeddings) | **bge-m3** |
| GB10 | **Scope decisions** (covered / partly / new scope, ticket → SOW line, duplicate commitments) | **Tev1-4B-experimental** (decision model; Qwen only for unsure cases) |
| GB10 | Reading screenshots (optional, first to cut) | Nemotron 3 Nano Omni |
| **Laptops** (`mac-dev`) | Everything above except embeddings | **qwen3.5:9b** |
| Laptops | Embeddings | **bge-m3** |
| Laptops | Scope decisions | **Tev1-4B-experimental** (4-bit), the same model as the GB10 |

One env var, `PACT_MODEL_PROFILE=gb10 | mac-dev`, switches between them. The Ollama model tags are `UNVERIFIED` until someone runs `ollama list` on each box.

---

## Phases at a glance

| Phase | What | Owner(s) | Drafted by | Needs | Target |
|---|---|---|---|---|---|
| **A** | Foundations: types, store, bus, `ctx.llm`, counter, OpenClaw bridge | Rishab | albert | — | 11:30 |
| **B** | The box: GB10, NemoClaw, OpenClaw + Qwen, OpenShell, smoke test | Shreyas | derek | — | 11:30 |
| **C** | Sales → SOW: transcripts, commitments, consolidate, draft SOW | Aryan (capture, consolidate, transcripts) · Rishab (draft-sow) | andreas | A | 13:00 |
| **D** | Tests and builds: generate tests, Docker builder, runner, GitHub | Shreyas (builder, runner, tests) · Aryan (`github/`) | gary | A, B, C | 14:30 |
| **E** | Prototype and share: template, `generate-prototype`, Vercel deploy | Rishab (prototype) · Shreyas (deploy) | ajay | C, D | 15:30 |
| **F** | Scope drift and support: `classify-request`, CR, `triage-ticket` | Aryan | deepak | C, D | 15:30 |
| **F2** | Scope decisions with Tev1 4B: `ctx.decide`, serving, eval | Shreyas (serve + eval) · Rishab (`ctx.decide`) · Aryan (skills) | Claude | A, B | 14:30 |
| **G** | Dashboard: CRM board, console, portal, SSE, demo controls | Rishab | ajay | A (screens can start on fixtures) | built alongside, done 15:30 |
| **H** | Demo hardening: cached runs, rehearsal, video | Everyone, led by Rishab | — | all | 16:30 |

---

## Goals by developer

### Rishab (tech lead)
| # | Goal | Phase | Done when | By |
|---|---|---|---|---|
| R1 | Shared contracts and core are usable by everyone | A | The `echo` skill fires on an event, calls the model on `mac-dev`, returns valid JSON, and the counter shows cloud 0. Types pushed for Aryan and Shreyas. | 11:30 |
| R2 | The dashboard shell runs on the GB10 | G | `/deals`, `/console`, `/portal` render. Buttons post events. SSE updates the screen. | 13:00 |
| R3 | Closed Won writes the SOW | C | 8 SOW lines stream into the console, including the §3.1 tablet criterion. Every commitment is covered or flagged. Approve fires `sow.approved`. | 13:00 |
| R4 | Pact builds a prototype from the SOW | E | `generate-prototype` fills the template and requests a build. With Shreyas's deploy step, a Vercel link opens on a phone. | 15:30 |
| R5 | The whole demo runs end to end | H | The full demo run works 5 times in a row, with a cached fallback for every beat. | 16:30 |

### Aryan
| # | Goal | Phase | Done when | By |
|---|---|---|---|---|
| A1 | Demo transcripts exist | C | Calls 1–3 and the status call are written as JSON fixtures, dramatized, with the tablet line in call 3 at t=760s. | 11:30 |
| A2 | Transcripts become commitments | C | Drop call 3 → a commitment with the exact tablet quote. `consolidate-commitments` merges duplicates across the 3 calls. | 13:00 |
| A3 | GitHub is wired | D | Polling turns a PR into `build.requested`. Pact opens issues per SOW line and the test PR, and comments "Satisfies SOW §3.1". The booking-site repo has its pre-built PRs, Priya's tablet PR #34 and the seeded iPad regression. | 14:30 |
| A4 | Scope drift becomes a change request | F | Dana's fuel-column ask → CR-014 with Raj's exact quote. Approve → SOW v2 with a new red test. | 15:30 |
| A5 | Tickets are triaged by the tests | F | iPad ticket → §3.1 test runs → "Warranty defect, covered by SOW §3.1" → Priya. Excel ticket → change request. | 15:30 |

### Shreyas
| # | Goal | Phase | Done when | By |
|---|---|---|---|---|
| S1 | The GB10 is up | B | NemoClaw installed. Qwen3.6-35B-A3B is OpenClaw's model. The 4 models answer. `smoke.sh` passes on the GB10 and on a Mac. | 11:30 |
| S1b | Tev1 4B runs locally | F2 | Weights downloaded and license checked. Served with vLLM on the GB10 and Ollama/MLX on Macs. `decide-eval.json` accuracy written down, and `PACT_DECIDE_MIN_P` set from it. | 12:30 |
| S2 | Locked down and provably local | B | The agent can reach only GitHub and Vercel. "Try a cloud call" is blocked and counted. | 11:30 |
| S3 | SOW lines become tests | D | `generate-acceptance-tests` writes one Playwright spec per SOW line, including the tablet spec at 768 and 1024 px. | 14:30 |
| S4 | Every build runs in its own container | D | PR #34 → fresh container in under 60 s → tests run → §3.1 green → `build.passed`. The container is cleaned up. | 14:30 |
| S5 | Tested prototypes get a shareable link | E | `build.passed` for a prototype → `vercel deploy` (Vercel builds it) → URL saved on the build and shown in the portal. | 15:30 |

**Handoffs:**
- **Rishab → everyone, 10:45:** Phase A types and `ctx`.
- **Shreyas → everyone, 11:30:** the model endpoints and the `gb10` profile.
- **Aryan → Rishab, 13:00:** commitments on the bus.
- **Shreyas → Aryan, 14:30:** `TestRun` results for ticket triage.
- **Shreyas → Rishab, 15:00:** the deploy step for the prototype.

**Check-ins:** 11:30, 13:00, 14:30, 15:30. Rishab runs the demo as far as it goes, and the team fixes the first broken beat.

---

## Goal loops (how each of us builds)

Each person points a coding-agent loop at one goal at a time: *"make `scripts/verify/<goal>.sh` pass, following build-plan.md."* A goal is done when its verify script exits 0.

| Goal | Owner | Works in | Verify | Needs first |
|---|---|---|---|---|
| R1 core + agent shell | Rishab | `core/` `agent/` `skills/index.ts` | `scripts/verify/r1.sh` | — |
| R2 dashboard | Rishab | `dashboard/` | `scripts/verify/r2.sh` | R1 |
| R3 Closed Won → SOW | Rishab | `skills/draft-sow/` `prompts/draft-sow/` | `scripts/verify/r3.sh` | R1, A2 |
| R4 prototype + share | Rishab | `skills/generate-prototype/` `templates/booking-proto/` | `scripts/verify/r4.sh` | R3, S4, S5 |
| R5 full demo | Rishab | anywhere, small fixes only | `scripts/verify/e2e.sh` | all |
| A1 transcripts | Aryan | `demo/fixtures/` | `scripts/verify/a1.sh` | — |
| A2 commitments | Aryan | `skills/capture-commitments/` `skills/consolidate-commitments/` `prompts/` | `scripts/verify/a2.sh` | R1, A1 |
| A3 GitHub | Aryan | `github/` `skills/github-sync/` `skills/map-pr-to-sow/` + booking-site repo | `scripts/verify/a3.sh` | R1, S3 |
| A4 scope drift → CR | Aryan | `skills/classify-request/` `prompts/classify-request/` | `scripts/verify/a4.sh` | R3, S1b |
| A5 ticket triage | Aryan | `skills/triage-ticket/` `prompts/triage-ticket/` | `scripts/verify/a5.sh` | S4, A3 |
| S1 GB10 + models | Shreyas | `infra/` | `infra/gb10/smoke.sh` | by-hand checklist |
| S1b Tev1 decide | Shreyas | `infra/decide/` `demo/fixtures/decide-eval.json` | `scripts/verify/s1b.sh` | S1 |
| S2 locked down | Shreyas | `infra/openshell/` | `scripts/verify/s2.sh` | S1 |
| S3 SOW → tests | Shreyas | `skills/generate-acceptance-tests/` `prompts/generate-acceptance-tests/` | `scripts/verify/s3.sh` | R3 |
| S4 container builds | Shreyas | `builder/` `skills/run-acceptance-tests/` | `scripts/verify/s4.sh` | R1, S3 |
| S5 Vercel deploy | Shreyas | `builder/deploy.ts` | `scripts/verify/s5.sh` | S4 |

Until R1 lands, the others build against the types in `core/src/types.ts`. They are already in the scaffold, and they are the contract.

### Do these by hand first (loops can't)
- [ ] **Shreyas:** NemoClaw onboarding on the GB10 (Local Ollama). Note OpenClaw's real skill-registration API in `agent/openclaw.ts`.
- [ ] **Shreyas:** download the models: `qwen3.6:35b-a3b`, `qwen3-coder:30b-a3b`, `bge-m3` and Tev1-4B-experimental. Check Tev1's Hugging Face license. Use local weights only, never Together or OpenRouter.
- [ ] **Shreyas:** create a Vercel deploy token and a `pact-proto` project. Put `VERCEL_DEPLOY_TOKEN` in `.env` on the GB10.
- [ ] **Aryan:** create the booking-site repo from `templates/booking-proto` with pre-built feature PRs merged, **Priya's tablet PR #34 open**, and **regression PR #35 open**. Set `BOOKING_REPO`, `BOOKING_REPO_SLUG` and `REGRESSION_PR=35`.
- [ ] **Aryan:** create a GitHub token with repo scope on the booking-site repo. Set `GITHUB_TOKEN`.
- [ ] **Everyone:** on the Mac, `brew install ollama`, then `ollama pull qwen3.5:9b bge-m3`. Set `PACT_MODEL_PROFILE=mac-dev`. Get Docker Desktop running.

---

## How it all connects

These rules came out of the squad's code review (terence/codex, gary, gokul, deepak), and every phase below follows them. Where the older event table in the Overview disagrees, this section wins.

### Process topology
- **One agent process**: `agent/main.ts` (Node 24, ESM). It owns the bus, store, skills, GitHub polling, builder. It serves HTTP on `:4000`:
  - `POST /events` `{topic, payload}` → `bus.publish` **without awaiting handlers** → `202`.
  - `GET /stream` → SSE of every bus event (`data: {topic,payload}\n\n`, TextEncoder chunks).
  - `GET /state` → JSON snapshot for the dashboard: deal, transcripts, commitments, latest SOW, tests + statuses, builds, CRs, tickets, counter, last 50 skill.log lines.
- **Dashboard** (Next.js, `:3000`) never imports the bus. It POSTs to `http://localhost:4000/events`, reads `/state`, and subscribes to `/stream` (EventSource straight to :4000, agent sends `Access-Control-Allow-Origin: *`). On any event it refetches `/state`.

### Core (Phase A provides, other phases use)
- `bus.publish(topic, payload, eventId?)` runs matching handlers **in parallel** (`Promise.all`, each with its own try/catch + dedupe). `bus.emit` = alias. `bus.listen(fn)` receives `{topic, payload}`.
- `Topic` = `'transcript.added' | 'deal.closed_won' | 'commitments.consolidated' | 'sow.line.drafted' | 'sow.drafted' | 'sow.approved' | 'tests.generated' | 'build.requested' | 'build.ready' | 'build.passed' | 'build.failed' | 'share.requested' | 'build.shared' | 'cr.approved' | 'ticket.created' | 'ticket.triaged' | 'skill.log' | 'demo.replay'`.
- `Ctx = { store, bus, llm, github, builder, readPrompt, log }`
  - `readPrompt(skill)` → reads `prompts/<skill>/system.md` via `readFile(new URL(..., import.meta.url))`. No `.md` imports anywhere.
  - `log.info/warn/error(msg, extra?)` → console AND `bus.publish('skill.log', {skill, level, msg, at})`.
  - `llm.json({role:'reasoning'|'coding', system, user, schema})`: prepends `/no_think\n` to system, strips `<think>…</think>` before `JSON.parse`, `AbortSignal.timeout(90_000)`, one repair retry, logs `llm_calls`.
  - `llm.jsonLines({role, system, user, itemSchema, onItem})`: Ollama `stream: true`; model outputs **one JSON object per line**; each complete line is validated with `itemSchema` and passed to `onItem` as it arrives (real streaming). Used by draft-sow.
  - `llm.embed(texts)`, `llm.embedTopK(query, items, k)`.
- **Store is one typed object** (`export const store = { ...all helpers }`, no Object.assign). Helpers every phase relies on: `newId, getDeal, setDealStage, getTranscript, saveTranscript, listTranscripts, saveCommitments, getCommitmentsByDeal, replaceCommitments, getSow(dealId, version?) /*latest if omitted*/, saveSow, approveSow(dealId, version), getApprovedSow(dealId), addSowLine(dealId, line) /*creates next version*/, saveAcceptanceTest, listAcceptanceTests(dealId), setTestStatus(testId, status, buildId), setGreenBy(testId, {prNumber, author}), getGreenBy(testId), createBuild, getBuild, updateBuild, latestBuild(kind), saveTestRun, setIssueNumber(sowLineId, n), getIssueNumber(sowLineId), sowLineForIssue(n), markCommentPosted(key), hasPostedComment(key), markPrSeen(n), isPrSeen(n), createChangeRequest, getChangeRequest, approveChangeRequest, createTicket, getTicket, updateTicket`.
- `skills/index.ts` registers **every** skill with its topic; `agent/main.ts` calls `wireSkills(skills)`, `startPolling(ctx)`, starts the HTTP server.

### The chain (who listens to what)
1. `transcript.added {transcriptId}` → `capture-commitments` (sales) · `classify-request` (status).
2. `deal.closed_won {dealId}` → `consolidate-commitments` → `commitments.consolidated {dealId}` → `draft-sow` (streams `sow.line.drafted {dealId, line}` per line, then `sow.drafted {dealId, version}`).
3. Maya clicks Approve → `sow.approved {dealId, version}` → in parallel: `generate-acceptance-tests` (→ `tests.generated {dealId, version}`) and `generate-prototype` (→ `build.requested` for a prototype).
4. `tests.generated` → `github-sync` skill (Phase D): one issue per SOW line, a PR adding the generated specs to the booking repo, and a `build.requested` for the booking repo's `main` HEAD (engineering baseline).
5. `build.requested {buildId}` → builder builds + starts container → `build.ready` → `run-acceptance-tests` → results persisted per test → `build.passed` (every expected test green) or `build.failed`.
6. On `build.passed`/`build.failed` for kind `pr`: `map-pr-to-sow` + PR comment ("Satisfies SOW §x") for each mapped line that is green; `setGreenBy` for tests that turned green in this build.
7. On `build.passed` for kind `prototype`: deploy → `build.shared {buildId, url}`. `share.requested {buildId}` deploys any tested build (used for Dana's review link on engineering builds, even at 8/9).
8. `cr.approved {crId}` → adds the SOW line (new version) → `sow.approved {dealId, version}` → new test generated → next build shows it red.
9. `ticket.created {ticketId}` → `triage-ticket` → `ticket.triaged`.

Coverage meter = green tests ÷ SOW lines, from the **latest engineering (kind `pr`/`main`) build's** results. Prototype results are shown separately.

---

## Review round 2: binding decisions

These decisions came out of the second review round. They sit on top of "How it all connects", and where the two disagree, this section wins.

### Imports and types
- Every relative import uses a `.js` specifier. All shared types are imported from `@pact/core` (core `index.ts` re-exports `types.ts`). No `@pact/core/types` subpath.
- Core exports `must<T>(x: T | undefined, what: string): T` (throws if missing). Use it on every store lookup.
- Core exports `StateSnapshot` (the exact `/state` shape). The dashboard imports and renders only its fields:
  `{ deal, transcripts, commitments, sow /* draft or approved, lines grow as drafted */, tests: AcceptanceTest[], builds: (Build & { run?: TestRun })[], coverage: { green: number, total: number, buildId: string | null }, prototype: { buildId, url } | null, crs: ChangeRequest[], tickets: Ticket[], logs: SkillLog[], counter: { local, cloud, blocked } }`.

### IDs and seed
- Deal id `hertz-demo`. Transcript ids from fixtures: `call-1`, `call-2`, `call-3`, `status-1` (files `demo/fixtures/<id>.json`).
- On agent startup: seed deal `hertz-demo` at `negotiation` with `call-1` and `call-2` saved, and publish `transcript.added` for both (real capture).
- `store.newId(prefix)` → `${prefix}_${8 hex}`. Test id = `t_` + SOW line id with non-alphanumerics → `_` (`§3.1` → `t_3_1`). Spec file = `specs/hertz-demo/<testId>.spec.ts`.

### Demo actions (agent-side; the dashboard calls these, never raw /events for these)
`POST /actions/<name>` persists first, then publishes. Returns 202.
- `drop-transcript {id}` → read fixture, `saveTranscript`, publish `transcript.added {transcriptId}`.
- `mark-closed-won {dealId}` → `setDealStage('closed_won')`, publish `deal.closed_won`.
- `approve-sow {dealId}` → `approveSow(dealId, latestVersion)`, publish `sow.approved {dealId, version}`.
- `approve-cr {crId}` → publish `cr.approved {crId}` (handler approves + adds SOW line).
- `merge-regression {}` → `github.mergePr(REGRESSION_PR)` (seeded PR #35); polling then builds it.
- `file-ticket {text}` → `createTicket`, publish `ticket.created {ticketId}`.
- `share-build {buildId}` → publish `share.requested`.
- `try-cloud-call {}` → see Cloud probe.
`/events` stays for `demo.replay` only.

### Builds
- Every Build is created with `dealId`, `kind` (`prototype` | `pr` | `main`), `ref`, and `srcDir` set at creation. Prototype: `srcDir` = fillTemplate output. `pr`/`main`: the builder fills `srcDir` with `git archive <sha>` before building. Field name is `srcDir` everywhere.
- Events always carry `{ buildId: build.id }`.
- Registry entry `{ name: 'build', on: 'build.requested', handler: onBuildRequested }` where `onBuildRequested: Skill<{buildId:string}, void>` = `({buildId}, ctx) => builder.enqueue(buildId, ctx)` (exported from `builder/build.ts`).
- `builder.buildAndTest(buildId, ctx): Promise<TestRun>`: enqueue, then await a one-shot `bus.listen` for `build.passed`/`build.failed` with that buildId, then return its stored TestRun. Used by triage.
- `github.getHeadSha('main')`, `github.mergePr(n)` exist on the github client.
- Health check: `docker exec app-<id> node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"` (no wget). Interval 500 ms, max 40.
- Runner: `@playwright/test` (pinned to image version) is in `dependencies`; `npm ci`.
- Before each run the builder copies `specs/<dealId>/` into `/tmp/pact-builds/<id>/specs` and mounts that. Results map back by spec file basename (`<testId>.spec.ts`); the JSON parser walks nested suites recursively. Expected tests = all acceptance tests for the deal; any missing result = fail.
- `saveTestRun` gets `{id, buildId, at, results}`.
- Testing a build waits until tests exist for the deal's current SOW version (`listAcceptanceTests(dealId)` non-empty).
- On CR approval, `generate-acceptance-tests` generates only for SOW lines that have no test yet; existing tests, statuses and greenBy stay.
- Files: core exports `files = { writeSpec(dealId, testId, src), readSpec(dealId, testId), specsDir(dealId) }` over `node:fs/promises`; on `Ctx` as `ctx.files`.

### Generated test prompt (from deepak)
- Search fields: do not assert `field-<key>` names; use `[data-testid^="field-"]`, assert count ≥ 1, fill each, click `search-submit`.
- "First row": read `getBoundingClientRect().top` of every `result-card`, group by top, the smallest-top group must have ≥ 2 cards; plus `results-grid` scrollWidth ≤ clientWidth at 768×1024 and 1024×768.
- `ctx.readPrompt('generate-acceptance-tests')` (bare skill name everywhere).

### SOW streaming
- `draft-sow` saves the draft SOW with the new line appended BEFORE publishing `sow.line.drafted`, so `/state` shows lines as they arrive.

### Triage
- `triage-ticket`: match SOW line → `sha = await ctx.github.getHeadSha('main')` → `createBuild({dealId, kind:'main', ref: sha})` → `run = await ctx.builder.buildAndTest(id, ctx)` → that line's result fails → `warranty` (+ `getGreenBy(testId).author`); passes → `not_reproduced`. The demo runs `merge-regression` before filing the ticket, so main is really broken.

### Cloud probe and counter
- `try-cloud-call`: the agent makes a real request to `https://api.openai.com/v1/models` (3 s timeout) from inside its sandbox. OpenShell/firewall blocks it; the agent records an `llm_calls` row `{locality:'cloud', outcome:'blocked', host}` via core's `recordBlocked(host)` and logs `skill.log`. The counter reads only `llm_calls`. No `egress_calls` table.
- Firewall fallback must keep local traffic: allow `lo`, `127.0.0.0/8`, the LAN subnet (dashboard/judges' screen), established connections, the GitHub + Vercel allowlist, then log + drop.

### Registry
- Phase A's `skills/index.ts` is the only registry. Delete every per-phase registry snippet in C, D, E, F.

---

## Overview (the event table is superseded by "How it all connects")

### Architecture

```
 ┌──────────────────────────── GB10 (everything runs here) ─────────────────────────┐
 │ Pact dashboard (local web app): CRM board · console · Dana's portal               │
 │ NemoClaw → OpenClaw agent (9 skills) in an OpenShell sandbox                      │
 │ core: store · event bus · ctx.llm · "Calls to cloud AI" counter                   │
 │ local models                                                                      │
 │ Docker: one fresh container per build (Pact's prototype or an engineer's PR)     │
 │         + a test-runner container                                                 │
 └──────────────┬──────────────────────────────────────────────┬────────────────────┘
                │ read code, write issues and PR comments       │ deploy a built prototype
                ▼ (GitHub, polled, outbound only)                ▼ (outbound only)
             GitHub                                Vercel → shareable link, e.g. hertz-replay-proto.vercel.app
```

- **Pact and its dashboard run on the GB10**, not on Vercel. The judges' screen is the dashboard served from the box.
- **Vercel is used for one thing: deploying the prototypes Pact builds**, so anyone (Dana, judges) can open them from a link.
- **The deployed prototype holds only the built app with demo data.** No models, transcripts, SOW data or keys go to Vercel.
- **Only outbound connections.** GitHub is polled. Vercel is a deploy target. Nothing calls into the box.
- **Events are local.** CRM clicks, transcript drops and ticket filing all happen in the dashboard on the box and go straight onto the local bus.

### The chain

**Quote → Commitment → SOW line → Acceptance test → Prototype / Code change → Ticket**, plus **Change request** for anything outside the SOW. One id threads through all of it. The coverage meter (green tests ÷ SOW lines) is computed when shown, never stored.

### Events → skills

| Event | Comes from | Pact does |
|---|---|---|
| `transcript.added` | A transcript dropped on the deal (dashboard) | `capture-commitments`. On status calls, `classify-request` → CR draft |
| `deal.closed_won` | CRM board (dashboard) | `consolidate-commitments` → `draft-sow` (each line has a testable criterion) |
| `sow.approved` | Maya approves (also CR approval → SOW v2) | `generate-acceptance-tests` → GitHub issues + test PR · `generate-prototype` from the SOW |
| `build.requested` | A new prototype, or a PR found by polling | Build it in a **fresh Docker container** (plain code) |
| `build.ready` | The container is up | `run-acceptance-tests` against it → coverage meter, PR comment |
| `build.passed` | Tests done | **Deploy to Vercel** → shareable link (prototypes always; PRs on request) |
| `ticket.created` | Dana files it (portal on the dashboard) | `triage-ticket` → runs that line's test → warranty (free) or change request, plus the owner |

**The 9 skills:**
- **reasoning:** `capture-commitments`, `consolidate-commitments`, `draft-sow`, `classify-request`, `triage-ticket`
- **coding:** `generate-acceptance-tests`, `generate-prototype`, `map-pr-to-sow`
- **plain code, no model:** `run-acceptance-tests`

The build, test and deploy steps are also plain code.

### Rules

1. **The model never writes the store.** It returns small, strict JSON. Code validates it and does the write.
2. **Every model call goes through `ctx.llm`** and is logged as local or cloud. That log is the "Calls to cloud AI: 0" number.
3. **No AI keys anywhere.** OpenShell lets the agent reach only GitHub (code) and Vercel (deploys), and blocks and counts everything else.
4. **Every build gets its own container.** It is fresh from the source, has no network while it runs, is reachable only by its test runner, and is destroyed after the run. Screenshots and logs are kept.
5. **Only tested builds get deployed.** A prototype is deployed to Vercel only after its acceptance tests run. The link page shows which SOW lines pass.
6. **Every output cites its source:** quote, commitment, test run, commit. Cached fallbacks replay a real earlier run and are labeled as cached.

### Infra

| Where | What |
|---|---|
| **GB10** | NemoClaw with Local Ollama (vLLM where faster). Models: **Qwen3.6-35B-A3B** reasoning · **Qwen3-Coder-30B-A3B** coding · **bge-m3** embed · **Nemotron 3 Nano Omni** vision (optional, first to cut). About 60 GB of 128 GB. The dashboard runs here too. |
| **Docker builds** | Prebuilt **arm64 base image** with dependencies baked in, so builds are fast and need no network. Each build: a fresh app container plus a Playwright test-runner container on an internal-only network. Run under OpenShell if it can manage containers (UNVERIFIED), otherwise plain Docker. The same setup works on laptops with Docker Desktop. |
| **Vercel** | One project for prototypes. The GB10 uploads each tested build's source with a deploy token (`vercel deploy`), and Vercel builds it. One deployment per prototype or shared PR. No AI keys, no Pact code. |
| **Laptops** | `PACT_MODEL_PROFILE=mac-dev`: **qwen3.5:9b** for every role, plus **bge-m3**, via Ollama. One env var switches to the GB10. |
| **No speech-to-text** | Transcripts are text we write, replayed on their timestamps. |

**Verify first (before building on it):**
1. All four GB10 model endpoints answer.
2. The dashboard on the GB10 opens from the judges' screen.
3. A build runs in a fresh container in under 60 s, with no outbound network.
4. The test runner reaches that container, and nothing else.
5. The GB10 deploys a built prototype to Vercel, and the link opens on a phone.
6. "Try a cloud call" is blocked and counted.

---

---

---

## Phase A — Foundations

> **Scaffold note:** the store uses Node's built-in `node:sqlite` (`import { DatabaseSync } from 'node:sqlite'`) instead of `better-sqlite3`. It has the same `prepare/run/get/all` calls and needs no native build, which matters on the GB10's ARM CPU and on newer Node versions.

**Goal:** One small core that every skill uses: types, the typed store, the bus, `ctx.llm`, the cloud counter, the skill runner, the skill registry and the agent process (`agent/main.ts`, HTTP on `:4000`). Simple, but fully working.

**Done when:**
- `pnpm typecheck` passes on Node 24 (one root `tsc --noEmit` over `core skills builder github agent`).
- `pnpm agent` starts on an empty `pact.db`, seeds deal `hertz-demo` (stage `negotiation`) with `call-1` and `call-2`, and publishes `transcript.added` for both. A restart does not capture them twice (fixed seed event ids).
- `curl -X POST :4000/actions/drop-transcript -d '{"id":"call-3"}'` returns `202` at once, while `curl -N :4000/stream` shows the `skill.log` lines from `capture-commitments` and `classify-request` running in parallel. Every action in the addendum answers `202` after persisting.
- Publishing the same `eventId` twice runs each skill once.
- On `mac-dev`, `llm.json` returns zod-valid JSON from qwen3.5:9b even when the model emits `<think>` blocks, and `llm.jsonLines` calls `onItem` before the stream ends. Each call writes one `llm_calls` row with `local`.
- `curl :4000/state` returns exactly `StateSnapshot`; `jq .counter` shows `cloud: 0`. A non-local model URL throws before the fetch and is counted as `blocked`. `POST /actions/try-cloud-call` under OpenShell adds one `blocked` row.

**Owner:** Rishab. **Drafted by:** albert.

### Files
```
pact/
  package.json  pnpm-workspace.yaml  tsconfig.json
  core/src/  types.ts must.ts store.ts bus.ts profiles.ts llm.ts counter.ts files.ts skill.ts index.ts
  skills/index.ts          # the only skill registry
  skills/demo-replay.ts    # stage fallback
  agent/main.ts            # the one agent process: seed, /events, /actions/*, /state, /stream
  agent/actions.ts         # POST /actions/<name>: persist, then publish
  agent/state.ts           # builds the StateSnapshot
  agent/openclaw.ts        # OpenClaw bridge (UNVERIFIED API)
```

### Drafted code

**Workspace.** `pnpm-workspace.yaml` lists `core skills builder github agent dashboard`. Every package has `"type": "module"`. `@pact/core` has `"exports": "./src/index.ts"`, and the other packages depend on it with `workspace:*`. Root scripts are `"agent": "tsx agent/main.ts"` and `"typecheck": "tsc --noEmit"`. The root `tsconfig.json` uses `module/moduleResolution: NodeNext`, `target: ES2024` and `strict: true`, and includes everything except `dashboard` (Next.js has its own). Relative imports use `.js` specifiers. There are no `.md` imports. Prompts are read at runtime through `ctx.readPrompt`. `core` deps are `better-sqlite3` and `zod`. Root dev deps are `tsx`, `typescript` and `@types/node`.

**`core/src/types.ts`** (the shared contract)
```ts
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
  status: 'queued' | 'building' | 'ready' | 'testing' | 'passed' | 'failed'; deployUrl?: string };
export type TestRun = { id: string; buildId: string; at: number; results: { testId: string; pass: boolean; error?: string }[] };
export type ChangeRequest = { id: string; dealId: string; request: string; quote: Quote; ack?: Quote; // ack = the team's "sure" reply
  estimate: string | null; needsReview?: boolean; status: 'draft' | 'approved' | 'rejected' };
export type Ticket = { id: string; dealId: string; text: string; status: 'open' | 'triaged';
  verdict?: 'warranty' | 'change_request' | 'not_reproduced'; sowLineId?: string; testId?: string;
  buildId?: string; assignee?: string; reason?: string };
export type SkillLog = { skill: string; level: 'info' | 'warn' | 'error'; msg: string; at: number; extra?: unknown };
export type Topic = 'transcript.added' | 'deal.closed_won' | 'commitments.consolidated' | 'sow.line.drafted'
  | 'sow.drafted' | 'sow.approved' | 'tests.generated' | 'build.requested' | 'build.ready' | 'build.passed'
  | 'build.failed' | 'share.requested' | 'build.shared' | 'cr.approved' | 'ticket.created' | 'ticket.triaged'
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
  prototype: { buildId: string; url: string } | null;                 // latest deployed prototype
  crs: ChangeRequest[];
  tickets: Ticket[];
  logs: SkillLog[];                           // last 50
  counter: { local: number; cloud: number; blocked: number };
};
```

**`core/src/must.ts`**
```ts
// Use on every store lookup: turns a missing row into a clear error instead of a later `undefined` crash.
export function must<T>(x: T | undefined, what: string): T {
  if (x === undefined || x === null) throw new Error(`missing: ${what}`);
  return x;
}
```

**`core/src/store.ts`** (one table of JSON docs plus bookkeeping tables, and one typed `store` object; good enough for one demo deal)
```ts
import Database from 'better-sqlite3';
import { randomBytes } from 'node:crypto';
import { must } from './must.js';
import type { AcceptanceTest, Build, ChangeRequest, Commitment, Deal, GreenBy, Sow, SowLine,
  TestRun, TestStatus, Ticket, Transcript } from './types.js';

export const db = new Database(process.env.PACT_DB ?? 'pact.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS docs (kind TEXT, id TEXT, doc TEXT, PRIMARY KEY (kind, id));
  CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, topic TEXT, payload TEXT, at INTEGER);
  CREATE TABLE IF NOT EXISTS handled (event_id TEXT, skill TEXT, PRIMARY KEY (event_id, skill));
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
```

**`core/src/bus.ts`** (in-process. Every event is saved first. Handlers run in parallel, and each one is isolated. The `handled` row is claimed before the handler runs, which dedupes by `eventId`, and it is released on failure so a republish retries.)
```ts
import { randomUUID } from 'node:crypto';
import { db } from './store.js';
import type { Topic } from './types.js';

export type BusEvent = { id: string; topic: Topic; payload: any };
type Handler = (payload: any) => Promise<unknown>;
const subs: { skill: string; topic: Topic; fn: Handler }[] = [];
const listeners = new Set<(e: BusEvent) => void>();
const save = db.prepare('INSERT OR IGNORE INTO events VALUES (?,?,?,?)');
const claim = db.prepare('INSERT OR IGNORE INTO handled VALUES (?,?)');
const release = db.prepare('DELETE FROM handled WHERE event_id=? AND skill=?');

export const bus = {
  subscribe(skill: string, topic: Topic, fn: Handler): void { subs.push({ skill, topic, fn }); },
  listen(fn: (e: BusEvent) => void): () => void { listeners.add(fn); return () => { listeners.delete(fn); }; },
  publish(topic: Topic, payload: object, eventId: string = randomUUID()): Promise<void> {
    save.run(eventId, topic, JSON.stringify(payload), Date.now());
    for (const l of listeners) try { l({ id: eventId, topic, payload }); } catch { /* a dead SSE client */ }
    return Promise.all(subs.filter((s) => s.topic === topic).map(async (s) => {
      if (claim.run(eventId, s.skill).changes === 0) return; // already handled or running
      try { await s.fn(payload); }
      catch (err) { release.run(eventId, s.skill); console.error(`[${s.skill}] ${topic} failed`, err); }
    })).then(() => undefined);
  },
  emit(topic: Topic, payload: object, eventId?: string): Promise<void> { return bus.publish(topic, payload, eventId); },
};
```

**`core/src/profiles.ts`** (Ollama base URL. The model tags are UNVERIFIED until `ollama list` is run on each box.)
```ts
const profiles = {
  gb10: { url: process.env.PACT_LLM_URL ?? 'http://127.0.0.1:11434',
    reasoning: 'qwen3.6:35b-a3b', coding: 'qwen3-coder:30b-a3b', embed: 'bge-m3' },
  'mac-dev': { url: process.env.PACT_LLM_URL ?? 'http://127.0.0.1:11434',
    reasoning: 'qwen3.5:9b', coding: 'qwen3.5:9b', embed: 'bge-m3' },
};
export const profile = profiles[(process.env.PACT_MODEL_PROFILE ?? 'mac-dev') as keyof typeof profiles];
```

**`core/src/llm.ts`** (the only way to reach a model; Ollama native API, no API key)
```ts
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
```

**`core/src/counter.ts`** (the counter reads only `llm_calls`; there is no `egress_calls` table)
```ts
import { db } from './store.js';
const insert = db.prepare('INSERT INTO llm_calls VALUES (?,?,?,?,?,?)');
// A cloud request that was stopped (by our host check or by the OpenShell firewall).
export const recordBlocked = (host: string, skill = 'cloud-probe', model = '-') =>
  void insert.run(Date.now(), skill, model, host, 'cloud', 'blocked');
// A cloud request that got through. Only the probe can cause this, and it means the sandbox is leaking.
export const recordCloud = (host: string, skill = 'cloud-probe', model = '-') =>
  void insert.run(Date.now(), skill, model, host, 'cloud', 'ok');
export const counter = () => db.prepare(`SELECT
  COUNT(*) FILTER (WHERE locality='local') AS local,
  COUNT(*) FILTER (WHERE locality='cloud' AND outcome!='blocked') AS cloud,
  COUNT(*) FILTER (WHERE outcome='blocked') AS blocked FROM llm_calls`).get() as
  { local: number; cloud: number; blocked: number };
```

**`core/src/files.ts`** (generated specs live in the repo under `specs/<dealId>/<testId>.spec.ts`)
```ts
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../../specs/', import.meta.url)); // pact/specs/, any cwd
export const files = {
  specsDir: (dealId: string) => join(root, dealId),
  async writeSpec(dealId: string, testId: string, src: string) {
    await mkdir(files.specsDir(dealId), { recursive: true });
    const path = join(files.specsDir(dealId), `${testId}.spec.ts`);
    await writeFile(path, src, 'utf8');
    return path;
  },
  readSpec: (dealId: string, testId: string) => readFile(join(files.specsDir(dealId), `${testId}.spec.ts`), 'utf8'),
};
export type Files = typeof files;
```

**`core/src/skill.ts`** (`Ctx`, the runner and `wireSkills`. `github` and `builder` come from Phase D's modules. They are imported here as types only, so there is no runtime cycle, and `agent/main.ts` injects them.)
```ts
import { readFile } from 'node:fs/promises';
import { store } from './store.js';
import { bus } from './bus.js';
import { makeLlm, type Llm } from './llm.js';
import { files, type Files } from './files.js';
import type { SkillLog, Topic } from './types.js';
import type { github } from '../../github/client.js';
import type { builder } from '../../builder/index.js';

export type Log = Record<SkillLog['level'], (msg: string, extra?: unknown) => void>;
export type Ctx = { store: typeof store; bus: typeof bus; llm: Llm; github: typeof github; builder: typeof builder;
  files: Files; readPrompt: (skill: string) => Promise<string>; log: Log };
export type Skill<In, Out> = (input: In, ctx: Ctx) => Promise<Out>;
export type SkillDef = { name: string; on: Topic; handler: Skill<any, unknown> };

let deps: Pick<Ctx, 'github' | 'builder'> | undefined;
export const inject = (d: Pick<Ctx, 'github' | 'builder'>) => { deps = d; };

// prompts/<skill>/system.md, resolved from core/src so it works under tsx with any cwd
export const readPrompt = (skill: string) =>
  readFile(new URL(`../../prompts/${skill}/system.md`, import.meta.url), 'utf8');

const makeLog = (skill: string): Log => {
  const at = (level: SkillLog['level']) => (msg: string, extra?: unknown) => {
    console[level](`[${skill}] ${msg}`, extra ?? '');
    const e: SkillLog = { skill, level, msg, at: Date.now(), extra: extra instanceof Error ? extra.message : extra };
    void bus.publish('skill.log', e);
  };
  return { info: at('info'), warn: at('warn'), error: at('error') };
};

export function makeCtx(skill: string): Ctx {
  if (!deps) throw new Error('call inject({ github, builder }) first');
  return { store, bus, llm: makeLlm(skill), ...deps, files, readPrompt, log: makeLog(skill) };
}

export async function runSkill(s: SkillDef, input: unknown) {
  const ctx = makeCtx(s.name);
  ctx.log.info(`started on ${s.on}`);
  try { const out = await s.handler(input, ctx); ctx.log.info('done'); return out; }
  catch (err) { ctx.log.error('failed', err); throw err; } // bus releases the claim so a republish retries
}

export function wireSkills(skills: SkillDef[]) {
  for (const s of skills) bus.subscribe(s.name, s.on, (input) => runSkill(s, input));
}
```

**`core/src/index.ts`**
```ts
// The only entry point: `import { ..., type Build } from '@pact/core'`. There is no '@pact/core/types' subpath.
export * from './types.js'; export * from './must.js'; export * from './store.js'; export * from './bus.js';
export * from './profiles.js'; export * from './llm.js'; export * from './counter.js'; export * from './files.js';
export * from './skill.js';
```

**`skills/index.ts`** (the only registry. Phases export handlers under these names and do not keep their own `skills` arrays. Every handler is `Skill<payload, unknown>`, which means it is called as `(eventPayload, ctx)`.)
```ts
import type { SkillDef } from '@pact/core';
import { handler as captureCommitments } from './capture-commitments/handler.js';
import { handler as classifyRequest, onCrApproved } from './classify-request/handler.js';
import { handler as consolidateCommitments } from './consolidate-commitments/handler.js';
import { handler as draftSow } from './draft-sow/handler.js';
import { handler as generateAcceptanceTests } from './generate-acceptance-tests/handler.js';
import { handler as generatePrototype } from './generate-prototype/handler.js';
import { handler as githubSync } from './github-sync/handler.js';
import { handler as runAcceptanceTests } from './run-acceptance-tests/handler.js';
import { handler as mapPrToSow } from './map-pr-to-sow/handler.js';
import { handler as triageTicket } from './triage-ticket/handler.js';
import { demoReplay } from './demo-replay.js';
import { onBuildRequested } from '../builder/build.js'; // ({buildId}, ctx) => builder.enqueue(buildId, ctx)
import { onBuildPassed, onShareRequested } from '../builder/deploy.js';

export const skills: SkillDef[] = [
  { name: 'capture-commitments', on: 'transcript.added', handler: captureCommitments },
  { name: 'classify-request', on: 'transcript.added', handler: classifyRequest },
  { name: 'consolidate-commitments', on: 'deal.closed_won', handler: consolidateCommitments },
  { name: 'draft-sow', on: 'commitments.consolidated', handler: draftSow },
  { name: 'generate-acceptance-tests', on: 'sow.approved', handler: generateAcceptanceTests },
  { name: 'generate-prototype', on: 'sow.approved', handler: generatePrototype },
  { name: 'github-sync', on: 'tests.generated', handler: githubSync },
  { name: 'build', on: 'build.requested', handler: onBuildRequested },
  { name: 'run-acceptance-tests', on: 'build.ready', handler: runAcceptanceTests },
  { name: 'map-pr-to-sow', on: 'build.passed', handler: mapPrToSow }, // payload {buildId}; skips non-pr builds
  { name: 'map-pr-to-sow', on: 'build.failed', handler: mapPrToSow },
  { name: 'deploy', on: 'build.passed', handler: onBuildPassed },      // prototypes only
  { name: 'deploy-share', on: 'share.requested', handler: onShareRequested },
  { name: 'apply-change-request', on: 'cr.approved', handler: onCrApproved },
  { name: 'triage-ticket', on: 'ticket.created', handler: triageTicket },
  { name: 'demo-replay', on: 'demo.replay', handler: demoReplay }, // stage fallback: re-publishes a recorded real run
];

```

**`skills/demo-replay.ts`**
```ts
import { readFile } from 'node:fs/promises';
import type { Skill } from '@pact/core';
// Reads demo/fixtures/runs/<runId>.json ({topic, payload}[] recorded from a real run)
// and re-publishes each event on the real bus, so the dashboard updates through its normal path.
export const demoReplay: Skill<{ runId: string }, void> = async ({ runId }, ctx) => {
  const events = JSON.parse(await readFile(new URL(`../demo/fixtures/runs/${runId}.json`, import.meta.url), 'utf8'));
  for (const e of events) await ctx.bus.publish(e.topic, e.payload);
};
```

**`agent/openclaw.ts`** (required stack: the skills run as OpenClaw skills. The OpenClaw API is UNVERIFIED, so this file is the only place that knows it.)
```ts
// Each skills/<name>/ folder has a SKILL.md (name, description, input = the event payload).
// On startup we register every skill with the local OpenClaw agent, which runs inside OpenShell
// via NemoClaw with Qwen3.6-35B-A3B as its model. When an event fires, wireSkills hands it to OpenClaw
// (OPENCLAW_URL set) or calls the handler directly (fallback, same code path).
import { skills } from '../skills/index.js';
export async function registerWithOpenClaw() {
  if (!process.env.OPENCLAW_URL) return; // fallback: direct dispatch
  for (const s of skills) {
    await fetch(`${process.env.OPENCLAW_URL}/skills`, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: s.name, skillDir: `skills/${s.name}`, trigger: s.on }) }); // UNVERIFIED shape
  }
}
```
Check on the GB10 first: how an OpenClaw skill is registered and invoked. Fix only this file. `agent/main.ts` calls `registerWithOpenClaw()` before `wireSkills(skills)`.

**`agent/state.ts`** (builds `StateSnapshot`, the exact `/state` shape)
```ts
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
    prototype: proto?.deployUrl ? { buildId: proto.id, url: proto.deployUrl } : null,
    crs: store.listChangeRequests(DEAL_ID),
    tickets: store.listTickets(DEAL_ID),
    logs: [...logs],
    counter: counter(),
  };
}
```

**`agent/actions.ts`** (`POST /actions/<name>`. Each action persists first, then publishes without waiting for handlers. The dashboard calls only these.)
```ts
import { readFile } from 'node:fs/promises';
import { must, recordBlocked, recordCloud, type Ctx, type Transcript } from '@pact/core';
import { DEAL_ID } from './state.js';

const REGRESSION_PR = Number(process.env.PACT_REGRESSION_PR ?? 35); // seeded PR #35 breaks main

// demo/fixtures/<id>.json is a full Transcript (id, dealId, kind, lines)
export async function dropTranscript(id: string, ctx: Ctx, eventId?: string) {
  if (!/^[\w-]+$/.test(id)) throw new Error(`bad fixture id ${id}`);
  const t: Transcript = JSON.parse(await readFile(new URL(`../demo/fixtures/${id}.json`, import.meta.url), 'utf8'));
  ctx.store.saveTranscript({ ...t, id, dealId: DEAL_ID });
  void ctx.bus.publish('transcript.added', { transcriptId: id }, eventId);
}

// Real egress attempt from inside the sandbox. Any HTTP answer (even 401) means the request left the box.
async function tryCloudCall(ctx: Ctx) {
  const url = 'https://api.openai.com/v1/models', host = new URL(url).hostname;
  try {
    await fetch(url, { signal: AbortSignal.timeout(3_000) });
    recordCloud(host);
    ctx.log.error(`cloud call to ${host} got through: sandbox egress is open`);
  } catch (err) {
    recordBlocked(host);
    ctx.log.info(`cloud call to ${host} blocked`, err);
  }
}

type Action = (body: any, ctx: Ctx) => Promise<void>;
export const actions: Record<string, Action> = {
  'drop-transcript': async ({ id }, ctx) => dropTranscript(id, ctx),
  'mark-closed-won': async ({ dealId = DEAL_ID }, ctx) => {
    ctx.store.setDealStage(dealId, 'closed_won');
    void ctx.bus.publish('deal.closed_won', { dealId }, `deal.closed_won:${dealId}`); // a double click runs once
  },
  'approve-sow': async ({ dealId = DEAL_ID }, ctx) => {
    const { version } = must(ctx.store.getSow(dealId), `sow for ${dealId}`); // latest version
    ctx.store.approveSow(dealId, version);
    void ctx.bus.publish('sow.approved', { dealId, version }, `sow.approved:${dealId}:${version}`);
  },
  'approve-cr': async ({ crId }, ctx) => {
    must(ctx.store.getChangeRequest(crId), `cr ${crId}`); // the cr.approved handler approves it and adds the SOW line
    void ctx.bus.publish('cr.approved', { crId }, `cr.approved:${crId}`);
  },
  'merge-regression': async (_body, ctx) => {
    await ctx.github.mergePr(REGRESSION_PR); // persisted on GitHub; polling sees the new main and builds it
    ctx.log.info(`merged PR #${REGRESSION_PR}`);
  },
  'file-ticket': async ({ text }, ctx) => {
    const t = ctx.store.createTicket({ dealId: DEAL_ID, text: must(text, 'ticket text') });
    void ctx.bus.publish('ticket.created', { ticketId: t.id });
  },
  'share-build': async ({ buildId }, ctx) => {
    must(ctx.store.getBuild(buildId), `build ${buildId}`);
    void ctx.bus.publish('share.requested', { buildId });
  },
  'try-cloud-call': async (_body, ctx) => { // the probe only makes sense inside OpenShell on the GB10
    if (process.env.PACT_MODEL_PROFILE !== 'gb10') return ctx.log.warn('try-cloud-call runs only on the GB10 (inside OpenShell)');
    void tryCloudCall(ctx); // up to 3 s; result arrives as skill.log
  },
};
```

**`agent/main.ts`** (the one agent process: injects deps, registers and wires skills, seeds the demo, starts GitHub polling, serves `:4000`)
```ts
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { bus, inject, makeCtx, store, wireSkills, type Topic } from '@pact/core';
import { skills } from '../skills/index.js';
import { github } from '../github/client.js';
import { builder } from '../builder/index.js';
import { startPolling } from '../github/poll.js';
import { registerWithOpenClaw } from './openclaw.js';
import { actions, dropTranscript } from './actions.js';
import { DEAL_ID, snapshot, trackLogs } from './state.js';

inject({ github, builder });
await registerWithOpenClaw();
wireSkills(skills);
trackLogs();
const ctx = makeCtx('demo-actions');

// Seed: deal at negotiation plus call-1 and call-2, captured for real. Fixed event ids, so a restart does not re-run them.
if (!store.getDeal(DEAL_ID)) store.saveDeal({ id: DEAL_ID, name: 'Hertz', stage: 'negotiation' });
for (const id of ['call-1', 'call-2']) await dropTranscript(id, ctx, `seed:${id}`);
void startPolling(makeCtx('github-poll'));

const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'GET, POST, OPTIONS' };
const send = (res: ServerResponse, code: number, body: unknown) => {
  res.writeHead(code, { ...cors, 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};
const readJson = async (req: IncomingMessage) => {
  let body = '';
  for await (const chunk of req) body += chunk;
  return body ? JSON.parse(body) : {};
};

const enc = new TextEncoder();
createServer(async (req, res) => {
  const path = new URL(req.url ?? '/', 'http://localhost').pathname;
  try {
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); return void res.end(); } // preflight for JSON POSTs
    if (req.method === 'POST' && path.startsWith('/actions/')) {
      const action = actions[path.slice('/actions/'.length)];
      if (!action) return send(res, 404, { error: `unknown action ${path}` });
      await action(await readJson(req), ctx); // persists, publishes, does not wait for handlers
      return send(res, 202, { ok: true });
    }
    if (req.method === 'POST' && path === '/events') { // stage fallback only
      const { topic, payload } = (await readJson(req)) as { topic: Topic; payload?: object };
      if (topic !== 'demo.replay') return send(res, 400, { error: 'use POST /actions/<name>; /events takes demo.replay only' });
      void bus.publish(topic, payload ?? {});
      return send(res, 202, { ok: true });
    }
    if (req.method === 'GET' && path === '/state') return send(res, 200, snapshot());
    if (req.method === 'GET' && path === '/stream') {
      res.writeHead(200, { ...cors, 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
      const write = (s: string) => res.write(enc.encode(s));
      write(': connected\n\n');
      const off = bus.listen((e) => write(`data: ${JSON.stringify({ topic: e.topic, payload: e.payload })}\n\n`));
      const ping = setInterval(() => write(': ping\n\n'), 15_000);
      req.on('close', () => { off(); clearInterval(ping); });
      return;
    }
    send(res, 404, { error: 'not found' });
  } catch (err) {
    send(res, 400, { error: (err as Error).message }); // bad JSON, missing row, failed merge: never crash the agent
  }
}).listen(4000, () => console.log('pact agent on :4000'));
```

### Tests
- `bus runs two skills on one topic in parallel` (two handlers that each wait 200 ms finish in about 200 ms, not 400 ms)
- `bus runs a skill once when the same eventId is published twice`, and `a failed handler is retried on republish`
- `one failing handler does not stop the others`
- `POST /actions/drop-transcript saves the transcript, then returns 202 before a slow handler finishes`
- `POST /actions/approve-sow approves the latest version and publishes sow.approved {dealId, version}` (one test per action: row persisted, topic + payload published)
- `POST /events rejects any topic but demo.replay`
- `startup seeds hertz-demo with call-1 and call-2, and a second startup does not re-run capture`
- `/state returns every StateSnapshot field; coverage comes from the latest pr/main build with a run, not a prototype`
- `store.newId('build') matches /^build_[0-9a-f]{8}$/`, `store.testIdFor('§3.1') === 't_3_1'`
- `files.writeSpec then readSpec round-trips under specs/<dealId>/<testId>.spec.ts`
- `try-cloud-call with no network records one blocked llm_calls row`
- `/stream delivers a published event as one SSE data line`
- `llm.json strips <think> blocks, retries once on bad JSON, then throws`
- `llm.jsonLines calls onItem for line 1 before the stream ends` (against a local stub server that sends Ollama frames slowly)
- `llm.json blocks a non-local host and counts it as blocked`
- `store.addSowLine creates version+1 with the old lines plus the new one`, and `getSow(dealId)` returns it

### Risks / fallbacks
- **The try-cloud-call probe is honest.** On a laptop without OpenShell the request gets through, is counted as `cloud`, and logs an error. Run it only on the GB10 inside the sandbox.
- **OpenClaw invoke API is unknown (UNVERIFIED).** It is not on the demo path. Skills run in-process through `wireSkills`. If the bridge becomes real, only `wireSkills` changes: it calls OpenClaw instead of `runSkill`.
- **qwen3.5:9b still breaks JSON.** `format: 'json'`, think-stripping and the one repair retry should cover it. `jsonLines` cannot use `format`, so it relies on the prompt plus skipping bad lines.
- **The host check is not a firewall.** It only keeps our own code local. OpenShell does the real blocking.
- **Phase D must export `github` (with `getHeadSha`, `mergePr`) from `github/client.ts`, `builder` (with `enqueue`, `buildAndTest`) from `builder/index.ts`, `onBuildRequested` from `builder/build.ts` and `startPolling` from `github/poll.ts`.** Phase E must export `onBuildPassed` and `onShareRequested` from `builder/deploy.ts` as plain `Skill`s, not as curried `(ctx) => fn`. The names in `skills/index.ts` are binding.

---

---

## Phase B — The box: GB10, NemoClaw, OpenClaw + Qwen, OpenShell

### 1. Goal / Done when

**Goal:** get the GB10 running local models, the dashboard reachable, and the agent's
network locked to GitHub + Vercel, with blocked calls counted. Keep it simple: ports and paths live in one
config file, and we skip retries and production hardening.

**Done when:**
- `infra/gb10/smoke.sh` passes on the GB10 and (mac profile) on a dev Mac.
- A blocked call shows up as a counted "deny" within a couple seconds of trying it.

### 2. Owner / drafted by

**Owner:** Shreyas. **Drafted by:** derek. NemoClaw/OpenClaw/OpenShell commands below
are UNVERIFIED guesses — if the real CLI differs, skip straight to the fallback in §7.

### 3. Files

```
infra/
  gb10/
    setup.sh        # Ollama install, pull 4 models, NemoClaw+OpenClaw wiring, vLLM fallback
    smoke.sh        # the 6 "verify first" checks (profile-aware)
  models/
    profiles.yaml   # gb10 vs mac-dev model profile
  openshell/
    policy.yaml     # egress allowlist (GitHub + Vercel) + firewall fallback, one file
  mac-dev-setup.sh  # laptop: Ollama + qwen3.5:9b + bge-m3 + Docker Desktop
```

### 4. Drafted code

#### 4.1 `infra/gb10/setup.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
# UNVERIFIED: nemoclaw CLI (init/attach) — confirm against real docs on the box.

curl -fsSL https://ollama.com/install.sh | sh

ollama pull qwen3.6:35b-a3b       # reasoning + OpenClaw's agent model
ollama pull qwen3-coder:30b-a3b   # coding
ollama pull bge-m3                 # embed
ollama pull nemotron3-nano-omni    # vision, optional, first to cut

# vLLM only if a demo run shows Ollama too slow for coding; then point the coding role at it in profiles.yaml.
# pip install vllm && python -m vllm.entrypoints.openai.api_server \
#   --model Qwen/Qwen3-Coder-30B-A3B --port 8001 &

nemoclaw init --model-endpoint http://127.0.0.1:11434/v1 \
  --network-policy ./infra/openshell/policy.yaml
nemoclaw attach openclaw --skills-dir ./skills --agent-model qwen3.6:35b-a3b

echo "done. run infra/gb10/smoke.sh"
```

OpenClaw's agent model is just one line in its config, pointed at the reasoning model:

```yaml
# openclaw.config.yaml (UNVERIFIED field names)
agent:
  model: qwen3.6:35b-a3b
  endpoint: http://127.0.0.1:11434/v1
sandbox: { runtime: openshell, policy_file: ./infra/openshell/policy.yaml }
```

#### 4.2 `infra/models/profiles.yaml`

```yaml
profiles:
  gb10:
    reasoning: { model: qwen3.6:35b-a3b }
    coding:    { model: qwen3-coder:30b-a3b }
    embed:     { model: bge-m3 }
    vision:    { model: nemotron3-nano-omni, optional: true }  # first to cut
    endpoint: http://127.0.0.1:11434/v1
  mac-dev:
    reasoning: { model: qwen3.5:9b }
    coding:    { model: qwen3.5:9b }
    embed:     { model: bge-m3 }
    endpoint: http://127.0.0.1:11434/v1
```

#### 4.3 `infra/openshell/policy.yaml`

One file: the allowlist OpenShell should enforce, plus the same rule as an `nft` command
to run by hand on the GB10 if OpenShell has no allowlist (checked first, per build-plan §8).

```yaml
# UNVERIFIED: OpenShell policy schema. If this isn't real, use the nft fallback below
# and skip OpenShell's own enforcement.
egress:
  default: deny
  allow:
    - { domain: github.com, port: 443 }
    - { domain: api.github.com, port: 443 }
    - { domain: api.vercel.com, port: 443 }
log: { on: [allow, deny] }

# fallback, run once on the box if OpenShell has no allowlist. Keep local traffic
# working (loopback, LAN so the judges' screen can reach the dashboard on :3000
# and the agent on :4000, and established/related connections), then allow the
# GitHub + Vercel allowlist, then log + drop everything else:
#   nft add rule inet filter output oif lo accept
#   nft add rule inet filter output ip daddr 127.0.0.0/8 accept
#   nft add rule inet filter output ip daddr 192.168.0.0/16 accept   # LAN subnet, adjust to the box's actual range
#   nft add rule inet filter output ct state established,related accept
#   ips=$(dig +short github.com api.github.com api.vercel.com)
#   for ip in $ips; do nft add rule inet filter output ip daddr $ip tcp dport 443 accept; done
#   nft add rule inet filter output log prefix "pact-blocked: " drop
```

No `egress_calls` table and no `store.run`/`store.increment` calls here — the
counter reads only `llm_calls`. The `try-cloud-call` action (see the addendum's
Cloud probe) is what records the blocked probe: when the agent's attempted cloud
call is denied by OpenShell/the `nft` fallback, the agent's own handler calls
core's `recordBlocked(host)`, which writes the `llm_calls` row
`{locality:'cloud', outcome:'blocked', host}` that both the dashboard's counter
and `smoke.sh` read.

#### 4.4 `infra/gb10/smoke.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
EP=http://127.0.0.1:11434/v1
fail=0
check() { echo -n "[$1] "; shift; "$@" && echo OK || { echo FAIL; fail=1; }; }

check models curl -fsS $EP/models -o /dev/null
check dashboard curl -fsS http://127.0.0.1:3000/deals -o /dev/null
check build-isolated docker run --rm --network=none pact-base-arm64 true
check test-net docker network inspect pact-build-net
check vercel-deploy curl -fsS "${PACT_LAST_DEPLOY_URL:?}" -o /dev/null
check egress-block bash -c '
  before=$(curl -fsS http://127.0.0.1:4000/state | jq ".counter.blocked")
  curl -fsS -X POST http://127.0.0.1:4000/actions/try-cloud-call -o /dev/null
  sleep 2
  after=$(curl -fsS http://127.0.0.1:4000/state | jq ".counter.blocked")
  [ "$after" -gt "$before" ]'
exit $fail
```

#### 4.5 `infra/mac-dev-setup.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
brew install ollama && brew services start ollama
ollama pull qwen3.5:9b
ollama pull bge-m3
brew install --cask docker && open -a Docker
echo "export PACT_MODEL_PROFILE=mac-dev"
```

### 5. Which model does what

| Role | Model | Where |
|---|---|---|
| OpenClaw agent brain (reasoning) | Qwen3.6-35B-A3B | GB10 |
| Coding | Qwen3-Coder-30B-A3B | GB10 |
| Embed | bge-m3 | GB10 + laptops |
| Vision (optional, first cut) | Nemotron 3 Nano Omni | GB10 |
| Laptop, every role | qwen3.5:9b | Mac |

### 6. Tests

- `smoke_models_answer`
- `smoke_dashboard_reachable`
- `smoke_build_isolated_under_60s`
- `smoke_test_runner_scoped_network`
- `smoke_vercel_link_opens`
- `smoke_egress_block_counted`

### 7. Risks / fallbacks

- NemoClaw/OpenClaw CLI is guessed — if wrong, skip it and call skills straight from the
  bus dispatcher; enforce egress with the `nft` fallback in §4.3 alone.
- If OpenShell can't isolate per-build containers, run plain Docker with `--network=none`
  — same effect, no OpenShell needed.
- Vision model is optional; cut first if GPU memory or time is tight.

---

---

## Phase C — Sales → SOW

### Goal
Turn sales-call transcripts into commitments with exact quotes, and turn `deal.closed_won` into a testable SOW that traces back to those commitments.

**Done when:**
- Dropping the call-3 fixture produces a commitment whose quote matches the call-3 tablet line (t=760s) exactly.
- Closed Won produces 8 `SowLine`s, including `§3.1` with a tablet-width criterion.
- Every commitment is on a SOW line or listed in `gaps` — none silently dropped.
- `sow.approved` fires only from the explicit approve action, never from `draft-sow` itself.

### Owner
Aryan (capture-commitments, consolidate-commitments, transcripts). Rishab (draft-sow). Drafted by: Phase C squad.

Scope: a working agent with minimal files and no generic abstractions. Thresholds are one config value each. Main path only, with no edge-case handling.

### Files
```
pact/
  demo/
    fixtures/call-1.json, call-2.json, call-3.json, status-1.json   # call-3 tablet line at t=760s
    replay.ts
  skills/
    capture-commitments/handler.ts
    consolidate-commitments/handler.ts
    draft-sow/handler.ts
  prompts/
    capture-commitments/system.md, schema.ts
    draft-sow/system.md, schema.ts
```

### Drafted code

#### `demo/fixtures/call-3.json`
```json
{
  "id": "call-3",
  "dealId": "hertz-demo",
  "kind": "sales",
  "lines": [
    { "t": 40, "speaker": "Sam", "text": "So to confirm, this covers the full booking flow — search, reserve, receipts." },
    { "t": 410, "speaker": "Dana", "text": "Right, and it needs to work across Hertz, Dollar, and Thrifty, not just Hertz." },
    { "t": 760, "speaker": "Dana", "text": "One thing that's non-negotiable: it has to work on tablets. Our counter staff use iPads all shift." },
    { "t": 775, "speaker": "Sam", "text": "Understood — tablet is in scope, no extra charge for that." }
  ]
}
```

#### `demo/fixtures/status-1.json`
```json
{
  "id": "status-1",
  "dealId": "hertz-demo",
  "kind": "status",
  "lines": [
    { "t": 15, "speaker": "Raj", "text": "Hey Dana, quick status check-in before the sprint review." },
    { "t": 180, "speaker": "Dana", "text": "One thing — can we get a fuel-level column on the results grid? Ops keeps asking about it." },
    { "t": 195, "speaker": "Raj", "text": "Sure, we can add that." }
  ]
}
```

Fixtures are dropped by the agent's `drop-transcript` action (Phase A), so there is no separate replay script.

#### `prompts/capture-commitments/schema.ts`
```ts
import { z } from 'zod';

export const CaptureCommitmentsOut = z.object({
  items: z.array(z.object({ lineIndex: z.number().int(), summary: z.string() })),
});
export type CaptureCommitmentsOut = z.infer<typeof CaptureCommitmentsOut>;
```

#### `prompts/capture-commitments/system.md`
```
/no_think
You read a sales call transcript, one line per index, shown as `[i] speaker: text`.
A commitment is a promise about what will be built or delivered — not small talk.
Return only {items:[{lineIndex, summary}]} for lines with a commitment.
lineIndex must be one of the indices shown in the list — do not invent one.
Strict JSON only, matching the schema. No explanation, no markdown.
```

#### `skills/capture-commitments/handler.ts`
```ts
import type { Skill } from '@pact/core';
import { must } from '@pact/core';
import type { Transcript, Commitment } from '@pact/core';
import { CaptureCommitmentsOut } from '../../prompts/capture-commitments/schema.js';

type In = { transcriptId: string };
type Out = { commitmentIds: string[] };

export const handler: Skill<In, Out> = async ({ transcriptId }, ctx) => {
  const transcript = must(await ctx.store.getTranscript(transcriptId), `transcript ${transcriptId}`) as Transcript;
  const system = await ctx.readPrompt('capture-commitments');
  const user = transcript.lines.map((l, i) => `[${i}] ${l.speaker}: ${l.text}`).join('\n');

  const { items } = await ctx.llm.json({ role: 'reasoning', system, user, schema: CaptureCommitmentsOut });

  // Code owns the quote, not the model: copy the line verbatim, and the model's
  // lineIndex is untrusted — clamp it into the transcript before trusting it.
  const commitments: Commitment[] = items
    .filter(({ lineIndex }) => lineIndex >= 0 && lineIndex < transcript.lines.length)
    .map(({ lineIndex, summary }) => {
      const line = transcript.lines[lineIndex];
      return {
        id: `${transcript.id}-c${lineIndex}`,
        dealId: transcript.dealId,
        text: summary,
        quote: { transcriptId: transcript.id, t: line.t, text: line.text },
      };
    });

  await ctx.store.saveCommitments(commitments);
  return { commitmentIds: commitments.map((c) => c.id) };
};
```

#### `skills/consolidate-commitments/handler.ts`
```ts
import type { Skill } from '@pact/core';
import type { Commitment } from '@pact/core';

type In = { dealId: string };
type Out = { groups: Commitment[][] };

const SIM_THRESHOLD = Number(process.env.PACT_SIM_THRESHOLD ?? 0.86); // starting value; check it on the real calls

export const handler: Skill<In, Out> = async ({ dealId }, ctx) => {
  const commitments = await ctx.store.getCommitmentsByDeal(dealId);
  const vectors = await ctx.llm.embed(commitments.map((c) => c.text));

  const groups: Commitment[][] = [];
  const used = new Set<number>();
  for (let i = 0; i < commitments.length; i++) {
    if (used.has(i)) continue;
    const group = [commitments[i]];
    used.add(i);
    for (let j = i + 1; j < commitments.length; j++) {
      if (!used.has(j) && cosineSim(vectors[i], vectors[j]) >= SIM_THRESHOLD) {
        group.push(commitments[j]);
        used.add(j);
      }
    }
    groups.push(group);
  }

  // Merge here, in the handler, instead of asking the store to do it: each
  // group collapses to one commitment that keeps every source quote.
  const merged: Commitment[] = groups.map(([first, ...rest]) =>
    rest.length === 0 ? first : { ...first, quotes: [first.quote, ...rest.map((c) => c.quote)] },
  );
  await ctx.store.replaceCommitments(dealId, merged);
  await ctx.bus.emit('commitments.consolidated', { dealId });
  return { groups };
};

function cosineSim(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
```

#### `prompts/draft-sow/schema.ts`
```ts
import { z } from 'zod';

// One JSON object per line — this is the itemSchema for ctx.llm.jsonLines.
export const DraftSowLine = z.object({
  id: z.string(),        // e.g. '§3.1'
  title: z.string(),
  criterion: z.string(), // testable, e.g. "works at tablet width 768-1024px"
  commitmentIds: z.array(z.string()),
});
export type DraftSowLine = z.infer<typeof DraftSowLine>;
```

#### `prompts/draft-sow/system.md`
```
/no_think
Write a Statement of Work from this deal's commitments.
Group commitments by subject area into numbered lines (§1.1, §1.2, ...).
Each commitmentId given must appear on exactly one line — never split across
lines and never dropped.
Each line needs a testable criterion with concrete numbers where implied
(tablet means width 768-1024px). Cover every commitment given.
Output one JSON object per line, one line of output per SOW line, nothing else.
Strict JSON only, matching the schema. No explanation, no markdown.
```

#### `skills/draft-sow/handler.ts`
```ts
import type { Skill } from '@pact/core';
import type { Commitment, SowLine, Sow } from '@pact/core';
import { DraftSowLine } from '../../prompts/draft-sow/schema.js';

type In = { dealId: string };
type Out = { sow: Sow; gaps: string[] };

export const handler: Skill<In, Out> = async ({ dealId }, ctx) => {
  const commitments: Commitment[] = await ctx.store.getCommitmentsByDeal(dealId);
  const system = await ctx.readPrompt('draft-sow');
  const user = commitments.map((c) => `${c.id}: ${c.text} ("${c.quote.text}")`).join('\n');

  const validIds = new Set(commitments.map((c) => c.id));
  const covered = new Set<string>();
  const sow: Sow = { dealId, version: 1, status: 'draft', lines: [] };

  // Real streaming: each line is saved and then emitted the moment the model
  // finishes it, so /state shows the SOW growing line by line.
  await ctx.llm.jsonLines({
    role: 'reasoning',
    system,
    user,
    itemSchema: DraftSowLine,
    onItem: async (line) => {
      const commitmentIds = line.commitmentIds.filter((id) => validIds.has(id));
      commitmentIds.forEach((id) => covered.add(id));
      const sowLine: SowLine = { ...line, commitmentIds, sowVersion: 1 };
      sow.lines = [...sow.lines, sowLine];
      await ctx.store.saveSow(sow);
      await ctx.bus.emit('sow.line.drafted', { dealId, line: sowLine });
    },
  });

  const gaps = commitments.filter((c) => !covered.has(c.id)).map((c) => c.id);
  await ctx.bus.emit('sow.drafted', { dealId, version: sow.version });
  return { sow, gaps };
};
```

#### `sow.approved` handoff
```ts
// Called from the console's "Approve SOW" button. Only writer of status:'approved'.
export async function approveSow(ctx: Ctx, dealId: string, version: number) {
  await ctx.store.approveSow(dealId, version);
  await ctx.bus.emit('sow.approved', { dealId, version });
}
```

C's three handlers are registered in Phase A's single `skills/index.ts` (the only registry) — no per-phase registry file here.

### Tests
- `capture-commitments copies the exact call-3 tablet quote at t=760`
- `capture-commitments drops/ignores a lineIndex outside the transcript instead of crashing`
- `consolidate-commitments merges near-duplicate commitments across calls 1-3 via ctx.llm.embed`
- `consolidate-commitments emits commitments.consolidated {dealId}`
- `draft-sow produces 8 lines incl. §3.1 with a tablet-width criterion, streamed one sow.line.drafted per line as jsonLines yields it`
- `draft-sow lists any uncited commitment in gaps instead of dropping it`
- `draft-sow emits sow.drafted {dealId, version} once all lines are in`
- `sow.approved only fires from approveSow (store.approveSow), never from draft-sow`

### Risks / fallbacks
- 0.86 similarity threshold is a guess; wrong merges possible — fallback: "Load cached result" if it misfires live.
- Model may cite a bad commitmentId; handler strips it and reports the gap instead of trusting the model's coverage claim.
- Model may emit a malformed line mid-stream; `llm.jsonLines` validates each line against `itemSchema` before calling `onItem`, so a bad line is skipped rather than crashing the whole draft.

---

---

## Phase D — Tests and builds

### Goal / Done when

**Goal:** turn an approved SOW into acceptance tests + issues/PR, and turn a build request (prototype or PR) into a fresh container that gets tested and reported on.

**Done when:**
- Merging PR #34 (Priya's tablet fix) triggers a fresh container build, tests run against it, SOW §3.1 goes green.
- A PR comment "Satisfies SOW §3.1" is posted on #34.
- Builds run one at a time; re-polling the same merged PR twice doesn't double-build or double-comment.
- Containers/network for a build are removed after its test run, pass or fail.

### Owner / drafted by

Owner: Shreyas (builder/runner/test skills), Aryan (`github/`). Drafted by: gary.

### Files

```
pact/
  skills/generate-acceptance-tests/handler.ts
  skills/github-sync/handler.ts
  skills/run-acceptance-tests/handler.ts
  skills/map-pr-to-sow/handler.ts
  prompts/generate-acceptance-tests/{system.md, schema.ts}
  builder/Dockerfile.base   # base image: pnpm store pre-filled from the template's lockfile
  builder/Dockerfile.app    # per-build: COPY source, pnpm install --offline, build, next start :3000
  builder/build.ts          # real srcDir per build, build+run+health, simple queue, teardown, onBuildRequested, buildAndTest
  builder/index.ts          # export const builder = { enqueue, buildAndTest, runTests, teardown }
  builder/runner/Dockerfile
  builder/runner/package.json   # @playwright/test pinned to the runner image's Playwright version, in dependencies
  builder/runner/run-tests.ts   # specs mounted per run, --reporter=json, real parse, setTestStatus
  github/client.ts          # export const github = { getPr, getDiff, createIssue, openPrWithFiles, comment, getHeadSha, mergePr }
  github/poll.ts            # every 5s, startup baseline of already-merged PRs
```
`skills/index.ts` (Phase A's registry) registers `{ name: 'build', on: 'build.requested', handler: onBuildRequested }`, where `onBuildRequested` is exported from `builder/build.ts` and just calls `builder.enqueue(buildId, ctx)`. Phase D adds no registry of its own — any per-phase registry snippet drafted earlier is deleted.

### Drafted code

#### prompts/generate-acceptance-tests/schema.ts

```ts
import { z } from 'zod';
export const GenerateTestsOut = z.object({
  tests: z.array(z.object({
    sowLineId: z.string(),              // '§3.1', must be one of the ids given in the prompt
    source: z.string().min(20),         // playwright spec, as text
  })),
});
```
The model names no files. The test id, and therefore the spec filename, is derived in code from `sowLineId` so it's stable across regenerations (see handler below).

#### prompts/generate-acceptance-tests/system.md

```md
/no_think
Write one Playwright spec per SOW line given, using only the ids in
`sowLineIds`.
- import { test, expect } from '@playwright/test'
- navigate to process.env.APP_URL (fallback http://app:3000)
- the search form's fields are found with `[data-testid^="field-"]`
  (assert the count is >= 1, fill every one of them), then click
  `search-submit` — never assert exact field-<key> names, the SOW
  doesn't fix them
- use only these other data-testid values: search-form, results-grid,
  result-card, book-cta, booking-form, confirmation-banner,
  brand-switcher
- "first row of results": read `getBoundingClientRect().top` for every
  result-card, group the cards by that top value, and assert the
  smallest-top group has >= 2 cards — never assert just that the page
  loaded
- if the line mentions tablet/responsive, assert at both 768x1024 and
  1024x768 viewports that results-grid's scrollWidth <= clientWidth,
  plus the first-row check above at each viewport
Strict JSON only, matching the schema. No explanation, no markdown.
```

#### skills/generate-acceptance-tests/handler.ts

```ts
import type { Skill } from '@pact/core';
import { must } from '@pact/core';
import { GenerateTestsOut } from '../../prompts/generate-acceptance-tests/schema.js';

// Stable test id so re-running this skill (e.g. after a CR) never
// renames an existing test's spec file: 't_' + the sowLineId with every
// non-alphanumeric run collapsed to '_' ('§3.1' -> 't_3_1').
const testIdFor = (sowLineId: string) => `t_${sowLineId.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`;

// The model never touches the store or the specs dir directly (build-plan
// rule 1): code validates every spec before it's saved. An unknown
// sowLineId or a spec missing the @playwright/test import just stays
// unsaved -> that SOW line stays 'unknown', never silently marked green.
export const handler: Skill<{ dealId: string; version: number }, void> =
  async ({ dealId, version }, ctx) => {
    const sow = must(ctx.store.getSow(dealId, version), `sow ${dealId} v${version}`);
    const existing = new Set(ctx.store.listAcceptanceTests(dealId).map((t) => t.sowLineId));
    // On a CR (SOW v2+), only the new line(s) have no test yet; lines that
    // already have a test, status and greenBy keep them untouched.
    const pendingLines = sow.lines.filter((l) => !existing.has(l.id));
    if (pendingLines.length === 0) return;
    const sowIds = pendingLines.map((l) => l.id);

    const out = await ctx.llm.json({
      role: 'coding',
      system: await ctx.readPrompt('generate-acceptance-tests'),
      user: JSON.stringify({
        sowLineIds: sowIds,
        lines: pendingLines.map((l) => ({ id: l.id, criterion: l.criterion })),
      }),
      schema: GenerateTestsOut,
    });

    for (const t of out.tests) {
      const knownId = sowIds.includes(t.sowLineId);
      const hasImport = /from ['"]@playwright\/test['"]/.test(t.source);
      if (!knownId || !hasImport) {
        ctx.log.warn('spec rejected', { sowLineId: t.sowLineId, knownId, hasImport });
        continue;
      }
      const testId = testIdFor(t.sowLineId);
      await ctx.files.writeSpec(dealId, testId, t.source);
      ctx.store.saveAcceptanceTest({ id: testId, dealId, sowLineId: t.sowLineId, status: 'unknown' });
    }

    await ctx.bus.emit('tests.generated', { dealId, version });
  };
```

#### builder/Dockerfile.base

```dockerfile
FROM --platform=linux/arm64 node:24-slim AS base
WORKDIR /app
RUN corepack enable
# The pnpm content-addressable store is pre-filled here, once, from the
# template's lockfile, so every per-build `pnpm install --offline` in
# Dockerfile.app never touches the network.
COPY templates/booking-proto/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm fetch
```
Built once, tagged `pact-base`.

#### builder/Dockerfile.app

```dockerfile
FROM pact-base
WORKDIR /app
COPY . .
RUN pnpm install --offline --frozen-lockfile
RUN pnpm build
CMD ["pnpm", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
```

#### builder/build.ts

```ts
import { execa } from 'execa';
import { mkdir, cp } from 'node:fs/promises';
import type { Ctx, Skill, TestRun } from '@pact/core';
import { must } from '@pact/core';

const net = (buildId: string) => `pact-test-${buildId}`;
const srcDir = (buildId: string) => `/tmp/pact-builds/${buildId}`;

let busy = false;
const queue: string[] = []; // buildIds waiting their turn; drained as each build finishes

// Registered directly on topic 'build.requested' by skills/index.ts.
export const onBuildRequested: Skill<{ buildId: string }, void> = async ({ buildId }, ctx) => {
  enqueue(buildId, ctx);
};

export function enqueue(buildId: string, ctx: Ctx) {
  if (busy) { queue.push(buildId); return; }
  run(buildId, ctx).catch((e) => ctx.log.error('build failed', { buildId, err: String(e) }));
}

// Used by triage-ticket: fire a build and await its one real outcome
// instead of threading build.ready/build.passed/build.failed through
// a bespoke handler.
export function buildAndTest(buildId: string, ctx: Ctx): Promise<TestRun> {
  return new Promise((resolve) => {
    const stop = ctx.bus.listen(({ topic, payload }) => {
      if ((payload as { buildId?: string }).buildId !== buildId) return;
      if (topic !== 'build.passed' && topic !== 'build.failed') return;
      stop();
      // run-tests.ts saved the TestRun before emitting. A build that failed before
      // any test ran has no TestRun: treat that as every test failing.
      resolve(ctx.store.latestTestRun(buildId) ?? { id: `run_none_${buildId}`, buildId, at: Date.now(), results: [] });
    });
    enqueue(buildId, ctx);
  });
}

// Used by triage: reuse the build for this commit if one exists (e.g. the poll already
// built the merged regression), wait for it if it's still running, else start one.
export async function testRef(dealId: string, sha: string, ctx: Ctx): Promise<TestRun> {
  const existing = ctx.store.listBuilds().filter((b) => b.ref === sha && b.kind !== 'prototype').at(-1);
  if (existing && (existing.status === 'passed' || existing.status === 'failed'))
    return ctx.store.latestTestRun(existing.id) ?? { id: `run_none_${existing.id}`, buildId: existing.id, at: Date.now(), results: [] };
  if (existing) return new Promise((resolve) => {
    const stop = ctx.bus.listen(({ topic, payload }) => {
      if ((payload as { buildId?: string }).buildId !== existing.id) return;
      if (topic !== 'build.passed' && topic !== 'build.failed') return;
      stop();
      resolve(ctx.store.latestTestRun(existing.id) ?? { id: `run_none_${existing.id}`, buildId: existing.id, at: Date.now(), results: [] });
    });
  });
  const build = ctx.store.createBuild({ dealId, kind: 'main', ref: sha });
  return buildAndTest(build.id, ctx);
}

async function run(buildId: string, ctx: Ctx) {
  busy = true;
  const build = must(ctx.store.getBuild(buildId), `build ${buildId}`);
  const dir = srcDir(buildId);
  try {
    ctx.store.updateBuild(buildId, { status: 'building' });
    await mkdir(dir, { recursive: true });

    // Real source per build, no stubs: an engineering build (kind 'pr' or
    // 'main') is the exact commit from GitHub; a prototype build's srcDir
    // was already filled by generate-prototype with its own output dir.
    if (build.kind === 'prototype') {
      await cp(build.srcDir, dir, { recursive: true });
    } else {
      await execa('sh', ['-c',
        `git -C "$BOOKING_REPO" fetch && git -C "$BOOKING_REPO" archive ${build.ref} | tar -x -C ${dir}`]);
      ctx.store.updateBuild(buildId, { srcDir: dir });
    }

    const tag = `pact-build:${buildId}`;
    await execa('docker', ['build', '-f', 'builder/Dockerfile.app', '-t', tag, dir], { timeout: 50_000 }); // budget: <60s total
    await execa('docker', ['network', 'create', '--internal', net(buildId)]);
    await execa('docker', ['run', '-d', '--name', `app-${buildId}`,
      '--network', net(buildId), '--network-alias', 'app', tag]);
    await waitHealthy(buildId);

    ctx.store.updateBuild(buildId, { status: 'ready' });
    await ctx.bus.emit('build.ready', { buildId: build.id });
  } catch (err) {
    ctx.store.updateBuild(buildId, { status: 'failed' });
    await teardown(buildId);
    ctx.log.error('build failed', { buildId, err: String(err) });
    await ctx.bus.emit('build.failed', { buildId }); // so anyone awaiting this build (triage) gets an answer
  } finally {
    busy = false;
    const next = queue.shift();
    if (next) enqueue(next, ctx);
  }
}

async function waitHealthy(buildId: string, tries = 40) {
  // No published ports: the health check runs *inside* the app container
  // itself (via `docker exec`), so it works even though the runner/host
  // can't reach it directly. `node -e` with fetch() -- no wget, which
  // the slim app image doesn't have.
  const probe = "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))";
  for (let i = 0; i < tries; i++) {
    const { exitCode } = await execa('docker',
      ['exec', `app-${buildId}`, 'node', '-e', probe],
      { reject: false });
    if (exitCode === 0) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('app container never became healthy');
}

export async function teardown(buildId: string) {
  // Name first (container may never have started if the build itself
  // failed), network second -- always both, so nothing outlives its build.
  await execa('docker', ['rm', '-f', `app-${buildId}`], { reject: false });
  await execa('docker', ['network', 'rm', net(buildId)], { reject: false });
}
```

#### builder/index.ts

```ts
import { enqueue, buildAndTest, testRef, teardown } from './build.js';
import { runTests } from './runner/run-tests.js';

// The one surface the agent and skills talk to -- nothing outside this
// file calls docker directly or reaches into build.ts's queue internals.
export const builder = { enqueue, buildAndTest, testRef, runTests, teardown };
```

#### builder/runner/Dockerfile

```dockerfile
FROM --platform=linux/arm64 mcr.microsoft.com/playwright:v1.48.0-noble
WORKDIR /tests
COPY package.json package-lock.json ./
RUN npm ci
COPY playwright.config.ts .
# Specs are NOT baked in here. Each run bind-mounts the current build's
# generated specs at /tests/tests, so one runner image serves every build.
CMD ["npx", "playwright", "test", "--reporter=json"]
```

#### builder/runner/package.json

```json
{
  "name": "pact-runner",
  "private": true,
  "dependencies": {
    "@playwright/test": "1.48.0"
  }
}
```
`@playwright/test` is a regular `dependency`, not a `devDependency` — the image runs `npm ci` (not `--omit=dev`) and the test binary needs to be there at runtime, not just at a build step that gets discarded. Pinned to the exact version baked into `mcr.microsoft.com/playwright:v1.48.0-noble` — a mismatched runner/browser version is a classic source of "tests fail for no reason."

#### builder/runner/run-tests.ts

```ts
import { execa } from 'execa';
import { cp, mkdir } from 'node:fs/promises';
import type { Ctx } from '@pact/core';
import { must } from '@pact/core';
import { teardown } from '../build.js';

async function testsForDeal(dealId: string, ctx: Ctx, tries = 120) {
  // A build can reach 'ready' before generate-acceptance-tests has
  // written anything for a brand-new deal (prototype builds race the
  // SOW-approval fan-out). Wait rather than testing against zero specs.
  // Wait until every line of the CURRENT approved SOW has its test (e.g. the new CR line in v2).
  for (let i = 0; i < tries; i++) {
    const sow = ctx.store.getApprovedSow(dealId);
    const tests = ctx.store.listAcceptanceTests(dealId);
    if (sow && sow.lines.every((l) => tests.some((t) => t.sowLineId === l.id))) return tests;
    await new Promise((r) => setTimeout(r, 500));
  }
  return ctx.store.listAcceptanceTests(dealId); // missing tests count as failed
}

export async function runTests(buildId: string, ctx: Ctx) {
  const build = must(ctx.store.getBuild(buildId), `build ${buildId}`);
  if (build.status !== 'ready') return; // redelivery guard: already testing/tested
  ctx.store.updateBuild(buildId, { status: 'testing' });

  const tests = await testsForDeal(build.dealId, ctx);
  const buildDir = `/tmp/pact-builds/${buildId}`;
  const specsDir = `${buildDir}/specs`;

  try {
    // Stage this deal's specs into the per-build dir (not the shared
    // specs/<dealId>/ tree) so the bind mount below is this build's own
    // snapshot, immune to specs being regenerated mid-run.
    await mkdir(specsDir, { recursive: true });
    await cp(`specs/${build.dealId}`, specsDir, { recursive: true });

    const { stdout, exitCode } = await execa('docker', ['run', '--rm',
      '--network', `pact-test-${buildId}`,
      '-v', `${specsDir}:/tests/tests`,
      '-e', 'APP_URL=http://app:3000',
      'pact-runner'], { timeout: 45_000, reject: false });

    // Only trust the JSON if Playwright actually ran (0 = all passed,
    // 1 = ran with failures); any other exit code (crash, bad mount,
    // timeout) means no real results, and every test counts as failed.
    const byFile = exitCode === 0 || exitCode === 1 ? parsePlaywrightJson(stdout) : new Map<string, boolean>();

    const runId = ctx.store.newId('run');
    const results = tests.map((t) => {
      const pass = byFile.get(`${t.id}.spec.ts`) ?? false; // missing from the report = fail, never skipped
      ctx.store.setTestStatus(t.id, pass ? 'green' : 'red', buildId);
      return { testId: t.id, pass };
    });
    ctx.store.saveTestRun({ id: runId, buildId, at: Date.now(), results });

    const allGreen = results.length > 0 && results.every((r) => r.pass);
    ctx.store.updateBuild(buildId, { status: allGreen ? 'passed' : 'failed' });
    await ctx.bus.emit(allGreen ? 'build.passed' : 'build.failed', { buildId: build.id });
  } finally {
    await teardown(buildId); // every exit path, including the 45s timeout
  }
}

// Playwright --reporter=json nests suites inside suites (one per describe
// block / directory level), so a flat `report.suites` walk misses any spec
// that isn't at the top level. Walk recursively and key by the spec file's
// basename, which is `<testId>.spec.ts` because that's what we wrote it as.
function parsePlaywrightJson(raw: string): Map<string, boolean> {
  const byFile = new Map<string, boolean>();
  let report: any;
  try { report = JSON.parse(raw); } catch { return byFile; }

  const visit = (suite: any) => {
    for (const spec of suite.specs ?? []) {
      const file = (suite.file ?? spec.file ?? '').split('/').pop();
      if (!file) continue;
      const pass = (spec.tests ?? []).every((t: any) =>
        (t.results ?? []).some((r: any) => r.status === 'passed'));
      byFile.set(file, (byFile.get(file) ?? true) && pass);
    }
    for (const child of suite.suites ?? []) visit(child);
  };
  for (const suite of report.suites ?? []) visit(suite);
  return byFile;
}
```

#### skills/run-acceptance-tests/handler.ts

```ts
// Plain code, no model. Coverage is computed on read (green/total from
// the tests' current status), never stored, so it can't drift from what
// setTestStatus last recorded (build-plan §2).
import type { Skill } from '@pact/core';
import { must } from '@pact/core';

export const handler: Skill<{ buildId: string }, void> = async ({ buildId }, ctx) => {
  await ctx.builder.runTests(buildId, ctx);
};
```

#### github/client.ts

```ts
import { Octokit } from 'octokit';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN }); // outbound only
const repo = { owner: 'pact-demo', repo: 'booking-site' } as const;

export const github = {
  async getPr(prNumber: number) {
    const { data: pr } = await octokit.rest.pulls.get({ ...repo, pull_number: prNumber });
    const linkedIssues = [...(pr.body ?? '').matchAll(/(?:fixes|closes)\s+#(\d+)/gi)]
      .map((m) => Number(m[1]));
    return {
      prNumber, author: pr.user?.login ?? 'unknown',
      linkedIssues, mergeCommitSha: pr.merge_commit_sha,
    };
  },
  async getDiff(prNumber: number) {
    const { data } = await octokit.rest.pulls.get({
      ...repo, pull_number: prNumber, mediaType: { format: 'diff' },
    });
    return data as unknown as string;
  },
  async createIssue(title: string, body: string) {
    const { data } = await octokit.rest.issues.create({ ...repo, title, body });
    return data.number;
  },
  async openPrWithFiles(branch: string, files: { path: string; content: string }[], title: string, body: string) {
    const { data: mainRef } = await octokit.rest.git.getRef({ ...repo, ref: 'heads/main' });
    await octokit.rest.git.createRef({ ...repo, ref: `refs/heads/${branch}`, sha: mainRef.object.sha });
    for (const f of files) {
      await octokit.rest.repos.createOrUpdateFileContents({
        ...repo, path: f.path, branch, message: `add ${f.path}`,
        content: Buffer.from(f.content).toString('base64'),
      });
    }
    const { data: pr } = await octokit.rest.pulls.create({ ...repo, title, body, head: branch, base: 'main' });
    return pr.number;
  },
  async comment(prNumber: number, body: string) {
    await octokit.rest.issues.createComment({ ...repo, issue_number: prNumber, body });
  },
  // Used for the engineering baseline build (kind 'main') and by
  // triage-ticket, which rebuilds current main to see if a reported bug
  // still reproduces there.
  async getHeadSha(branch: string) {
    const { data } = await octokit.rest.repos.getBranch({ ...repo, branch });
    return data.commit.sha;
  },
  // Used by the `merge-regression` demo action to merge the seeded
  // iPad-regression PR so main is really broken before the ticket is filed.
  async mergePr(prNumber: number) {
    await octokit.rest.pulls.merge({ ...repo, pull_number: prNumber });
  },
};
```

#### github/poll.ts

```ts
import { Octokit } from 'octokit';
import type { Ctx } from '@pact/core';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const repo = { owner: 'pact-demo', repo: 'booking-site' } as const;
const DEAL_ID = 'hertz-demo';

export async function startPolling(ctx: Ctx) {
  await baseline(ctx); // mark every already-merged PR seen before the first live poll
  setInterval(() => poll(ctx).catch((e) => ctx.log.error('poll failed', { err: String(e) })), 5_000);
}

async function baseline(ctx: Ctx) {
  const { data: prs } = await octokit.rest.pulls.list({ ...repo, state: 'closed', per_page: 50 });
  for (const pr of prs) if (pr.merged_at) ctx.store.markPrSeen(pr.number);
}

async function poll(ctx: Ctx) {
  const { data: prs } = await octokit.rest.pulls.list({
    ...repo, state: 'closed', sort: 'updated', direction: 'desc', per_page: 20,
  });
  for (const pr of prs) {
    if (!pr.merged_at || ctx.store.isPrSeen(pr.number)) continue;
    // Mark seen before emitting: a slow build.requested handler can't
    // cause the next 5s poll to re-see this PR and double-build it.
    ctx.store.markPrSeen(pr.number);
    const build = ctx.store.createBuild({ dealId: DEAL_ID, kind: 'pr', ref: pr.merge_commit_sha!, prNumber: pr.number });
    await ctx.bus.emit('build.requested', { buildId: build.id });
  }
}
```
`DEAL_ID` is the one demo deal (`hertz-demo`); every PR build belongs to it.

#### skills/github-sync/handler.ts

```ts
import type { Skill } from '@pact/core';
import { must } from '@pact/core';

// Listens on tests.generated. Three real side effects, no stubs:
// one issue per SOW line, a PR adding the generated specs to the booking
// repo, and an engineering baseline build (kind 'main') of main HEAD so
// coverage has something real to read before any PR merges.
export const handler: Skill<{ dealId: string; version: number }, void> =
  async ({ dealId, version }, ctx) => {
    const sow = must(ctx.store.getSow(dealId, version), `sow ${dealId} v${version}`);
    for (const line of sow.lines) {
      if (ctx.store.getIssueNumber(line.id)) continue; // dedup, no GitHub search needed
      const n = await ctx.github.createIssue(`${line.id} ${line.title}`, line.criterion);
      ctx.store.setIssueNumber(line.id, n);
    }

    const tests = ctx.store.listAcceptanceTests(dealId);
    const files = await Promise.all(tests.map(async (t) => ({
      path: `specs/${dealId}/${t.id}.spec.ts`,
      content: await ctx.files.readSpec(dealId, t.id),
    })));
    if (files.length > 0) {
      await ctx.github.openPrWithFiles(
        `specs-${dealId}-v${version}`, files,
        `Acceptance tests for SOW v${version}`,
        'Generated from the approved SOW. One spec per line.',
      );
    }

    const sha = await ctx.github.getHeadSha('main');
    const build = ctx.store.createBuild({ dealId, kind: 'main', ref: sha });
    await ctx.bus.emit('build.requested', { buildId: build.id });
  };
```

#### skills/map-pr-to-sow/handler.ts

```ts
import type { Skill } from '@pact/core';
import { must } from '@pact/core';
import { z } from 'zod';
const MapOut = z.object({ sowLineIds: z.array(z.string()) });

// Runs on build.passed AND build.failed, filtered to kind 'pr' -- a build
// that's overall red can still satisfy some lines while others stay red.
// Two real signals, no hard-coding:
// 1. The PR body's "Fixes #n" links. github-sync opened one issue per SOW
//    line, so each linked issue maps straight back to its line.
// 2. The coding model reads the diff and proposes more lines (ids
//    restricted to the current SOW only).
// A line is commented/credited only if its test's *current* status
// (set by run-acceptance-tests for this exact build) is green.
export const handler: Skill<{ buildId: string }, void> = async ({ buildId }, ctx) => {
  const build = must(ctx.store.getBuild(buildId), `build ${buildId}`);
  if (build.kind !== 'pr' || !build.prNumber) return;

  const pr = await ctx.github.getPr(build.prNumber);
  const sow = must(ctx.store.getApprovedSow(build.dealId), `approved sow ${build.dealId}`);
  const sowIds = sow.lines.map((l) => l.id);
  const fromIssues = pr.linkedIssues.map((n: number) => ctx.store.sowLineForIssue(n)).filter(Boolean) as string[];

  const diff = (await ctx.github.getDiff(build.prNumber)).slice(0, 20_000);
  const fromModel = await ctx.llm.json({
    role: 'coding',
    schema: MapOut,
    system: await ctx.readPrompt('map-pr-to-sow'), // prompts/map-pr-to-sow/system.md
    user: JSON.stringify({ sowLineIds: sowIds, diff }),
  });

  const mapped = [...new Set([...fromIssues, ...fromModel.sowLineIds.filter((id) => sowIds.includes(id))])];
  const tests = ctx.store.listAcceptanceTests(build.dealId);

  for (const lineId of mapped) {
    const test = tests.find((t) => t.sowLineId === lineId);
    if (!test || test.status !== 'green') continue; // only this build's green lines get credit

    const key = `${build.prNumber}:${lineId}`;
    if (!ctx.store.hasPostedComment(key)) {
      await ctx.github.comment(build.prNumber, `Satisfies SOW ${lineId}`);
      ctx.store.markCommentPosted(key);
    }
    if (!ctx.store.getGreenBy(test.id)) {
      ctx.store.setGreenBy(test.id, { prNumber: build.prNumber, author: pr.author });
    }
  }
};
```

### Tests

- `build.single-flight-second-request-queues.test.ts`
- `build.redelivered-build-requested-is-noop.test.ts`
- `run-tests.missing-report-entry-counts-as-fail.test.ts`
- `run-tests.teardown-runs-on-timeout.test.ts`
- `poll.startup-baseline-marks-existing-merged-prs-seen.test.ts`
- `poll.same-merged-pr-polled-twice-creates-one-build.test.ts`
- `map-pr-to-sow.comment-posted-only-for-green-mapped-lines.test.ts`
- `map-pr-to-sow.comment-not-duplicated-on-redelivery.test.ts`
- `generate-acceptance-tests.spec-with-unknown-sow-id-is-rejected.test.ts`

### Risks / fallbacks

- **Build time budget:** base image bakes the pnpm store, but the per-build checkout + `docker build -f Dockerfile.app` is still the main risk to <60s. Fallback (build-plan §7): reuse the last container already built for that exact commit sha.
- **Concurrency:** the in-process `busy` flag + array queue in `builder/build.ts` only works within one builder process; fine for the demo, not safe if the builder ever runs as two processes.
- **Cleanup:** `teardown()` runs on every known exit path (build failure, test pass/fail, test timeout) and is keyed by container *name* (`app-<id>`) so it doesn't depend on having captured an id earlier. A hard process crash in between could still leak a container/network — not handled, acceptable for a few-hour demo; would need a periodic `docker ps`/`docker network ls` prune for anything longer-running.
- **Idempotency:** GitHub polling is keyed on `markPrSeen`/`isPrSeen` per PR number, with a startup baseline marking every already-merged PR seen so a restart doesn't re-build history. Builds for newly merged PRs use `merge_commit_sha`, not head sha, so a rebase-and-merge or squash still produces one stable ref per PR.
- **Runner/app version drift:** `@playwright/test` in `builder/runner/package.json` is pinned to the exact tag of the `mcr.microsoft.com/playwright` runner image; if that image tag is ever bumped, the package pin must move with it or specs can fail for version-skew reasons unrelated to the app.

---

---

## Phase E — Prototype and share

### Goal
On `sow.approved`, fill a fixed booking-flow template with SOW-derived copy/fields, build it in a container, test it, deploy to Vercel if green.

**Done when**
- SOW approved → `Build{kind:'prototype'}` created → `build.requested` fired.
- 8/8 SOW v1 tests pass against the built container.
- `deploy.ts` returns a `*.vercel.app` URL, stored on `Build.deployUrl`.
- URL opens and is usable on a phone.

### Owner
`generate-prototype` — Rishab. `builder/deploy.ts` — Shreyas. Drafted by: ajay.

### Files
```
pact/
  templates/booking-proto/        # Next.js app, routes below
    app/
      page.tsx                     # "/" search — data-testid="search-form", "field-<key>" per slot, "search-submit", "brand-switcher"
      results/page.tsx             # "/results" — data-testid="results-grid" (grid), "result-card" per item, "book-cta"
      book/page.tsx                # "/book" — data-testid="booking-form"
      confirm/page.tsx             # "/confirm" — data-testid="confirmation-banner"
      health/route.ts              # "/health" — returns 200 "ok", no slot/model dependency
    slots.schema.ts
    theme/tokens.ts                # 3 generic brand palettes
  skills/generate-prototype/handler.ts
  prompts/generate-prototype/system.md
  builder/{fill-template.ts, deploy.ts}
```

**Routes + testids (binding, matches fix-contract.md's Template contract exactly):** `/`, `/results`, `/book`, `/confirm`, `/health`. Testids: `search-form`, `field-<key>` (one per `slots.searchFields[].key`), `search-submit`, `results-grid`, `result-card`, `book-cta`, `booking-form`, `confirmation-banner`, `brand-switcher`. These are static in the template JSX — the model never writes markup, so the testids ship correctly by construction.

**Tablet layout rule (binding):** `results-grid` is a CSS grid (`grid-template-columns: repeat(auto-fit, minmax(...))`) with no fixed pixel widths that can force overflow. At both 768×1024 and 1024×768, `results-grid.scrollWidth <= results-grid.clientWidth` and it lays out ≥ 2 `result-card`s per row. This holds regardless of `slots.showTabletLayout` — that flag only toggles a tablet-specific density tweak (card padding/columns-per-row target), it does not gate whether the rule holds. Covered by the "deployed prototype booking flow works at 375px and 768px (Playwright)" test, extended to also assert the 768×1024 / 1024×768 non-overflow + ≥2-per-row rule.

### Drafted code

#### `templates/booking-proto/slots.schema.ts` — the only thing the model fills
```ts
import { z } from 'zod';
export const slotsSchema = z.object({
  brand: z.enum(['brandA', 'brandB', 'brandC']),
  heroTitle: z.string().max(60),
  ctaLabel: z.string().max(24),
  searchFields: z.array(z.object({ key: z.string(), label: z.string() })).max(6),
  resultColumns: z.array(z.string()).max(8),
  showTabletLayout: z.boolean(),
});
export type Slots = z.infer<typeof slotsSchema>;
```

#### `prompts/generate-prototype/system.md`
```
/no_think
Fill the slot schema from the SOW lines given. Do not write app code.
Set showTabletLayout=true if any SOW line mentions tablet width.
Strict JSON only, matching the schema. No explanation, no markdown.
```
Read via `ctx.readPrompt('generate-prototype')` — no `.md` import anywhere.

#### `skills/generate-prototype/handler.ts`
```ts
import type { Skill } from '@pact/core';
import { must } from '@pact/core';
import { slotsSchema } from '../../templates/booking-proto/slots.schema.js';
import { fillTemplate } from '../../builder/fill-template.js';

export const handler: Skill<{ dealId: string; version: number }, { buildId: string }> =
  async ({ dealId, version }, ctx) => {
    const system = await ctx.readPrompt('generate-prototype');
    const sow = must(ctx.store.getSow(dealId, version), `sow ${dealId} v${version}`);
    const user = JSON.stringify(sow.lines.map(l => ({ id: l.id, title: l.title, criterion: l.criterion })));
    const slots = await ctx.llm.json({ role: 'coding', system, user, schema: slotsSchema });

    const srcDir = await fillTemplate(slots, dealId);
    const build = ctx.store.createBuild({ dealId, kind: 'prototype', ref: srcDir, srcDir, status: 'queued' });
    ctx.bus.publish('build.requested', { buildId: build.id });
    return { buildId: build.id };
  };
```
Registration lives only in Phase A's `skills/index.ts` (see `build-plan.md`'s "Registry" rule) — no per-phase registry snippet here.

#### `builder/fill-template.ts` — copy + one JSON write, nothing else
```ts
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Slots } from '../templates/booking-proto/slots.schema.js';

export async function fillTemplate(slots: Slots, dealId: string) {
  const outDir = `/tmp/pact-builds/${dealId}-${Date.now()}`;
  await fs.cp(path.resolve(import.meta.dirname, '../templates/booking-proto'), outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'slots.generated.json'), JSON.stringify(slots));
  return outDir;
}
```

#### `builder/deploy.ts`: real Vercel path (link once, upload the tested source, Vercel builds it)
```ts
import { execa } from 'execa';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Ctx, Skill } from '@pact/core';
import { must } from '@pact/core';

const TEMPLATE_DIR = path.resolve(import.meta.dirname, '../templates/booking-proto');
let linked = false;

async function ensureLinked() {
  if (linked) return;
  await execa('vercel', ['link', '--yes', '--project', 'pact-proto', '--token', process.env.VERCEL_DEPLOY_TOKEN!], { cwd: TEMPLATE_DIR });
  await execa('vercel', ['pull', '--yes', '--environment=preview', '--token', process.env.VERCEL_DEPLOY_TOKEN!], { cwd: TEMPLATE_DIR });
  linked = true;
}

// The box only uploads the tested source (template + demo data). Vercel's own build machines
// install and build it, so the GB10 needs no package registry access, only the Vercel API.
export async function deploy(buildDir: string) {
  await ensureLinked();
  await fs.cp(path.join(TEMPLATE_DIR, '.vercel'), path.join(buildDir, '.vercel'), { recursive: true });
  const { stdout } = await execa('vercel', ['deploy', '--yes', '--token', process.env.VERCEL_DEPLOY_TOKEN!], { cwd: buildDir });
  return stdout.trim().split('\n').pop()!;
}

export const onBuildPassed: Skill<{ buildId: string }, void> = async ({ buildId }, ctx) => {
  const build = must(ctx.store.getBuild(buildId), `build ${buildId}`);
  if (build.kind !== 'prototype') return; // engineering builds deploy only via share.requested
  const url = await deploy(build.srcDir!);
  ctx.store.updateBuild(buildId, { deployUrl: url });
  await ctx.bus.publish('build.shared', { buildId, url });
};

export const onShareRequested: Skill<{ buildId: string }, void> = async ({ buildId }, ctx) => {
  const build = must(ctx.store.getBuild(buildId), `build ${buildId}`); // any tested build, e.g. Dana's review link at 8/9
  const url = await deploy(build.srcDir!);
  ctx.store.updateBuild(buildId, { deployUrl: url });
  await ctx.bus.publish('build.shared', { buildId, url });
};
```
Both handlers are wired only through Phase A's `skills/index.ts` (`onBuildPassed` on `build.passed`, fires only for `kind: 'prototype'`, skips otherwise — never deploys a `build.failed`; `onShareRequested` on `share.requested`, any already-tested build, e.g. an 8/9 engineering build Dana wants to see). No per-phase registry snippet here. Both paths end in `build.shared {buildId, url}` and persist `Build.deployUrl`.

### Tests
- `fillTemplate writes slots.generated.json, leaves app files untouched`
- `generate-prototype sets showTabletLayout=true for a tablet SOW line`
- `build.requested fires once per sow.approved`
- `deploy.ts does not run for a failed build`
- `deployed prototype booking flow works at 375px and 768px (Playwright)`

### Risks / fallbacks
- Model may try to write code anyway — `fillTemplate` only ever writes one JSON file, so it can't.
- Deploy path: `vercel link`/`pull` once, copy `.vercel/` into each build, then `vercel deploy` (Vercel builds it remotely, so the box needs no package registry). It lives entirely in `builder/deploy.ts`, decoupled from `generate-prototype` so the exact flags can still change without touching the skill.
- If the fill is weak or slow on demo day, hand-write `slots.generated.json` for the Hertz deal and skip the live `ctx.llm.json` call.

---

---

## Phase F — Scope drift and support

### Goal
Catch out-of-SOW requests on status calls and draft a change request with the exact quote. Triage support tickets by running the real acceptance test, not by asking a model to guess.

### Done when
- Dana's fuel-column ask → `CR-014` drafted with Raj's exact quote.
- iPad ticket → §3.1 test is built and run fresh against current `main` HEAD, **fails** → "Warranty defect — covered by SOW §3.1" (`verdict: 'warranty'`) → routed to Priya.
- Excel ticket → no matching SOW line → change request (`verdict: 'change_request'`).
- No model ever outputs a number. The model picks a request **category**; the effort range comes from a fixed category table in code.

### Owner
Aryan (per build-plan §6). Drafted by: this squad.

### Files
```
pact/
  skills/classify-request/handler.ts   # also handles cr.approved
  skills/triage-ticket/handler.ts
  skills/index.ts                      # add the two registrations below
  prompts/classify-request/{system.md, schema.ts}
  prompts/triage-ticket/{system.md, schema.ts}
```
The effort estimate is a small category table in `classify-request/handler.ts`. It works for any request, not just the demo's. No SKILL.md is drafted here; copy the pattern from another skill.

Registration for `classify-request` and `triage-ticket` happens only in Phase A's `skills/index.ts` (the single registry); no per-phase registry snippet is drafted here.

### Drafted code

#### `prompts/classify-request/schema.ts`
```ts
import { z } from 'zod';
// Qwen's only job here: find the requests in the call, and the reply that agreed to each one.
// Whether a request is in scope is Tev1's call (Phase F2), not Qwen's.
export const FindRequestsOutput = z.object({
  items: z.array(z.object({
    requestIndex: z.number().int().min(0),          // line where the customer asks for something
    ackIndex: z.number().int().min(0).nullable(),   // line where the team agreed to it, or null
  })),                                              // empty array = no requests in this call
});
```

#### `prompts/classify-request/system.md`
```
/no_think
You read a status-call transcript. Lines are shown as [i] speaker: text.
Find each line where the customer asks for something to be built or changed.
For each, give its index as requestIndex, and the index of the line where
someone on the delivery team agreed to it as ackIndex (null if nobody did).
Greetings, small talk and questions that ask for nothing new are not requests.
Use only indices shown in brackets. If there are no requests, return {"items": []}.
Strict JSON only, matching the schema. No explanation, no markdown.
```

#### `skills/classify-request/handler.ts`
```ts
import type { Skill } from '@pact/core';
import { must } from '@pact/core';
import { FindRequestsOutput } from '../../prompts/classify-request/schema.js';

// Effort by request category. Tev1 picks the category; code owns the numbers.
const EFFORT: Record<string, string | null> = {
  ui_change: '0.5-1 eng-days', new_field: '2-3 eng-days', new_screen: '3-5 eng-days',
  report_or_export: '1-2 eng-days', integration: '5-10 eng-days', other: null, // null -> "[needs estimate]"
};
const MIN_P = Number(process.env.PACT_DECIDE_MIN_P ?? 0.7);

export const handler: Skill<{ transcriptId: string }, { crIds: string[] }> =
  async ({ transcriptId }, ctx) => {
    const transcript = must(ctx.store.getTranscript(transcriptId), 'transcript');
    if (transcript.kind !== 'status') return { crIds: [] };
    const sow = must(ctx.store.getApprovedSow(transcript.dealId), 'approved SOW');
    const lines = transcript.lines;

    // 1. Qwen reads the whole call once: which lines are requests, and who agreed.
    const found = await ctx.llm.json({
      role: 'reasoning', system: await ctx.readPrompt('classify-request'), schema: FindRequestsOutput,
      user: lines.map((l, i) => `[${i}] ${l.speaker}: ${l.text}`).join('\n'),
    });

    const crIds: string[] = [];
    for (const { requestIndex, ackIndex } of found.items) {
      const req = lines[requestIndex];
      if (!req) continue;
      const cands = await ctx.llm.embedTopK(req.text, sow.lines, 5);

      // 2. Tev1 decides scope (Phase F2). Unsure -> Qwen once -> still unsure -> Maya reviews.
      const d = await ctx.decide.choose({
        state: `Customer request (${req.speaker}): "${req.text}"\n\nSOW lines:\n` + cands.map((c) => `${c.id}: ${c.criterion}`).join('\n'),
        question: 'Does an existing SOW line already require what the customer is asking for?',
        options: [
          ...cands.map((c) => ({ key: `covered:${c.id}`, label: `Yes, ${c.id} already requires it` })),
          { key: 'partial', label: 'Partly: a SOW line touches it but does not fully require it' },
          { key: 'new_scope', label: 'No: this is new work not in the SOW' },
        ],
      });
      const sure = d.key !== 'unclear' && (d.p === null || d.p >= MIN_P);
      const verdict = sure ? d.key : await escalateToQwen(req.text, cands, ctx); // same keys
      if (verdict.startsWith('covered:')) { ctx.log.info(`covered by ${verdict.slice(8)}`, { p: d.p }); continue; }

      const cat = await ctx.decide.choose({
        state: `Request: "${req.text}"`, question: 'What kind of work is this?',
        options: Object.keys(EFFORT).map((k) => ({ key: k, label: k.replace(/_/g, ' ') })),
      });
      const ack = ackIndex !== null ? lines[ackIndex] : undefined;
      const cr = ctx.store.createChangeRequest({
        dealId: transcript.dealId,
        request: req.text,
        quote: { transcriptId, t: req.t, text: req.text },                        // Dana's exact words
        ack: ack ? { transcriptId, t: ack.t, text: ack.text } : undefined,         // Raj's exact "sure"
        estimate: EFFORT[cat.key] ?? null,
        needsReview: verdict !== 'new_scope',                                     // partial/unclear -> Maya decides
      });
      crIds.push(cr.id);
    }
    return { crIds };
  };

// Second opinion for unsure cases: Qwen with thinking on, same option keys.
async function escalateToQwen(text: string, cands: { id: string; criterion: string }[], ctx: Parameters<Skill<unknown, unknown>>[1]) {
  const { z } = await import('zod');
  const keys = [...cands.map((c) => `covered:${c.id}`), 'partial', 'new_scope'] as [string, ...string[]];
  const out = await ctx.llm.json({
    role: 'reasoning', schema: z.object({ verdict: z.enum(keys) }),
    system: `Decide if the request is already required by one of these SOW lines. Answer with one of: ${keys.join(', ')}. Strict JSON {"verdict": "..."}.`,
    user: JSON.stringify({ request: text, sow: cands.map((c) => ({ id: c.id, criterion: c.criterion })) }),
  });
  return out.verdict;
}

// cr.approved -> approve the CR, add the SOW line, re-fire sow.approved
export const onCrApproved: Skill<{ crId: string }, void> =
  async ({ crId }, ctx) => {
    const cr = must(ctx.store.getChangeRequest(crId), 'change request');
    ctx.store.approveChangeRequest(crId);
    const sow = must(ctx.store.getApprovedSow(cr.dealId), 'approved SOW');
    ctx.store.addSowLine(cr.dealId, { sowVersion: sow.version + 1, title: cr.request, criterion: cr.request, commitmentIds: [] });
    const v2 = ctx.store.approveSow(cr.dealId, sow.version + 1);
    ctx.bus.emit('sow.approved', { dealId: cr.dealId, version: v2.version });
  };
```

#### `prompts/triage-ticket/schema.ts` + `system.md`
```ts
import { z } from 'zod';
export const TriageTicketOutput = z.object({
  sowLineId: z.string().nullable(), // from the candidate list given, or null
  reason: z.string().min(1).max(240),
});
```
```
/no_think
Map this ticket's text to the single closest SOW line from the candidates
given (already picked by embedding similarity), given only as {id, criterion}
pairs, or null if none plausibly relate. You do not decide warranty vs.
not_reproduced vs. change request — that is decided later by running the
line's test, not by you. reason is one short, neutral, factual sentence. No
numbers, scores, percentages, or confidence words. Never invent an id
outside the given list.
Strict JSON only, matching the schema. No explanation, no markdown.
```

#### `skills/triage-ticket/handler.ts`
```ts
import type { Skill } from '@pact/core';
import { must } from '@pact/core';
import { TriageTicketOutput } from '../../prompts/triage-ticket/schema.js';

// Extends the core Ticket verdict type with the two outcomes this skill can reach
// on top of 'change_request' (no matching SOW line): a failing re-test means the
// behavior really is broken and is covered by warranty; a passing re-test means
// the reported defect could not be reproduced against the current main HEAD.
export type TicketVerdict = 'warranty' | 'not_reproduced' | 'change_request';

export const handler: Skill<{ ticketId: string }, { verdict: TicketVerdict }> =
  async ({ ticketId }, ctx) => {
    const systemPrompt = await ctx.readPrompt('triage-ticket');
    const ticket = must(ctx.store.getTicket(ticketId), 'ticket');
    const sow = must(ctx.store.getApprovedSow(ticket.dealId), 'approved SOW');
    const candidates = await ctx.llm.embedTopK(ticket.text, sow.lines, 3);
    const pick = await ctx.llm.json({
      role: 'reasoning', system: systemPrompt,
      user: JSON.stringify({
        ticketText: ticket.text,
        candidates: candidates.map(c => ({ id: c.id, criterion: c.criterion })), // model never sees more than id+criterion
      }),
      schema: TriageTicketOutput,
    });

    if (!pick.sowLineId) {
      ctx.store.updateTicket(ticketId, { verdict: 'change_request', status: 'triaged' });
      ctx.bus.emit('ticket.triaged', { ticketId, verdict: 'change_request' });
      return { verdict: 'change_request' };
    }

    const test = must(
      ctx.store.listAcceptanceTests(ticket.dealId).find(t => t.sowLineId === pick.sowLineId),
      'acceptance test for picked SOW line',
    );

    // Build and test the CURRENT main HEAD fresh — never reuse a cached/past build.
    // The demo runs the merge-regression action before filing the ticket, so main
    // is really broken when this fires.
    const sha = await ctx.github.getHeadSha('main');
    const run = await ctx.builder.testRef(ticket.dealId, sha, ctx); // reuses the poll's build of this commit if there is one
    const result = run.results.find(r => r.testId === test.id) ?? { testId: test.id, pass: false }; // no result = failed build

    // FAIL on current main => the defect is real and in-scope => warranty.
    // PASS on current main => nothing to fix right now => not_reproduced.
    const verdict: TicketVerdict = result.pass ? 'not_reproduced' : 'warranty';
    const assignee = result.pass ? undefined : ctx.store.getGreenBy(test.id)?.author;
    ctx.store.updateTicket(ticketId, { verdict, sowLineId: pick.sowLineId, assignee, status: 'triaged' });
    ctx.bus.emit('ticket.triaged', { ticketId, verdict });
    return { verdict };
  };
```

### Tone rules for anything shown to Dana
- Plain verdict + SOW reference: "Warranty defect — covered by SOW §3.1." / "Not in SOW, so it's a change request."
- No confidence words, no model reasoning text, no dollar guesses.

### Prompt rules for every skill
Every `system.md` is loaded via `ctx.readPrompt(skill)` (never a static `.md` import), starts with `/no_think` on its own first line, and ends with "Strict JSON only, matching the schema. No explanation, no markdown." as its last line. Candidates given to the model are always trimmed to `{id, criterion}` — never the full SOW line object. Strict JSON, `temperature: 0`, one repair retry (built into `ctx.llm.json`). The model never outputs a number — no scores, confidence, or estimates. Quotes are always copied by code from the source line, never retyped by the model. Any id the model returns must come from the candidate list passed into that call; code drops anything else.

### Tests
- `classify-request.fuel-column` → CR drafted with exact quote.
- `classify-request.covered-request` → no CR created.
- `cr-approved.sow-v2` → `approveChangeRequest` called, new SOW line added, `sow.approved` re-fired.
- `triage-ticket.ipad-warranty` → demo runs `merge-regression` first so `main` is really broken; fresh build of current `main` HEAD via `ctx.builder.buildAndTest`, §3.1 result **fails** → `warranty`, assignee Priya (from `getGreenBy(testId).author`), `ticket.triaged` emitted.
- `triage-ticket.excel-change-request` → no matching SOW line → `change_request`, `ticket.triaged` emitted.

### Risks / fallbacks
- Embedding retrieval may surface the wrong SOW line; show the reason string in console for override.
- Triage requires `ctx.github.getHeadSha('main')` plus a fresh `kind: 'main'` build via `ctx.builder.buildAndTest` (Shreyas's phase); if the builder is down, fall back to the last cached `TestRun`, labeled "cached."
- The category table is rough. Anything in `other` shows `[needs estimate]`, never a guessed number. Tune the ranges with Maya's real numbers later.

---

---

## Phase F2 — Scope decisions with Tev1 4B (decision model)

**Why:** "Is this in scope?" is a choice, not writing. A small decision model makes that choice in a fraction of a second, gives the same answer every time, and keeps Qwen free for the work only it can do. Qwen is used only when Tev1 is unsure.

**The model:** **Tev1-4B-experimental** (Together AI). It is a fine-tune of Qwen3.5-4B, trained to pick one option from a *state*, a *question* and 2–24 lettered options, and it answers with a single letter. It keeps the normal language-model head, so it runs on an ordinary OpenAI-compatible server. Together recommends temperature 0, max_tokens 8 and thinking off. It is about 4.5 GB in bf16, or about 3 GB at 4-bit.

**Check before building on it (Shreyas, first hour; all `UNVERIFIED`):**
1. **Weights download.** Featherless serves it, which suggests the weights are public as `togethercomputer/Tev1-4B-experimental`. Check the license on the Hugging Face card. **Never call it through Together's or OpenRouter's API**, because that is cloud AI.
2. **It runs locally with logprobs:**
   - **GB10:** vLLM, which returns `logprobs`.
   - **Mac:** Ollama, if a GGUF exists, or `mlx_lm.server`.
   - If no logprobs are available, use the letter alone and rely on the "unclear" option.
3. **Accuracy on our cases.** Run it on ~20 labeled pairs (`demo/fixtures/decide-eval.json`): the fuel-column ask, the Excel export, the iPad ticket, plus look-alikes. Note the accuracy and set the confidence threshold from those results.

**Owners:** Shreyas serves it (Phase B). Rishab adds `ctx.decide` to core (Phase A). Aryan moves `classify-request`, `triage-ticket` (line matching) and `consolidate-commitments` onto it (Phases C and F).

### Where it runs

| Profile | `decide` endpoint | Model |
|---|---|---|
| `gb10` | `http://127.0.0.1:8002/v1` (vLLM) | `togethercomputer/Tev1-4B-experimental` |
| `mac-dev` | `http://127.0.0.1:11434/v1` (Ollama) or `:8080` (mlx_lm.server) | the same model, 4-bit |

```sh
# infra/gb10/setup.sh (added; UNVERIFIED flags)
vllm serve togethercomputer/Tev1-4B-experimental --port 8002 \
  --max-model-len 8192 --gpu-memory-utilization 0.08 &
```

Memory: about 3–5 GB on top of the ~60 GB budget, so it fits easily.

### Core: `ctx.decide` (Phase A, `core/src/decide.ts`)

```ts
import { profile } from './profiles.js';
import { recordLocalCall } from './llm.js';           // same llm_calls log, so the counter stays honest

export type Option = { key: string; label: string };
export type Decision = { key: string; p: number | null }; // p = probability of the chosen letter, if logprobs exist

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWX';

export const makeDecide = (skill: string) => ({
  async choose(a: { state: string; question: string; options: Option[] }): Promise<Decision> {
    const opts = a.options.slice(0, 24);
    const user = `State:\n${a.state}\n\nQuestion: ${a.question}\n\nOptions:\n` +
      opts.map((o, i) => `${LETTERS[i]}. ${o.label}`).join('\n') + '\n\nAnswer with one letter.';
    const res = await fetch(`${profile.decide.url}/chat/completions`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({ model: profile.decide.model, temperature: 0, max_tokens: 8,
        messages: [{ role: 'user', content: user }], logprobs: true, top_logprobs: 5 }),
    });
    const j = await res.json();
    recordLocalCall(skill, profile.decide.model, profile.decide.url);
    const letter = (j.choices[0].message.content as string).trim().charAt(0).toUpperCase();
    const i = LETTERS.indexOf(letter);
    if (i < 0 || i >= opts.length) return { key: 'unclear', p: null };   // treated as unsure below
    const lp = j.choices[0].logprobs?.content?.[0]?.top_logprobs?.find((t: any) => t.token.trim() === letter);
    return { key: opts[i].key, p: lp ? Math.exp(lp.logprob) : null };
  },
});
// Ctx gains: decide: ReturnType<typeof makeDecide>   (runSkill passes makeDecide(s.name))
// profiles gain: decide: { url, model } in both gb10 and mac-dev
```

**Confidence rule (plain code, one config value):** `PACT_DECIDE_MIN_P` defaults to 0.7 and is set from the eval. A decision is **sure** when it isn't `unclear` and `p` is null or at least `PACT_DECIDE_MIN_P`. A decision that isn't sure goes to Qwen (reasoning, with thinking on) once. If Qwen is unsure too, it goes to Maya.

### `classify-request` (Phase F): Tev1 decides, Qwen only escalates

```ts
// after finding the request line and the top-5 SOW candidates (embedTopK), per request:
const d = await ctx.decide.choose({
  state: `Customer request (status call, ${line.speaker}): "${line.text}"\n\nSOW lines:\n` +
    cands.map((c) => `${c.id}: ${c.criterion}`).join('\n'),
  question: 'Does an existing SOW line already require what the customer is asking for?',
  options: [
    ...cands.map((c) => ({ key: `covered:${c.id}`, label: `Yes, ${c.id} already requires it` })),
    { key: 'partial', label: 'Partly: a SOW line touches it but does not fully require it' },
    { key: 'new_scope', label: 'No: this is new work not in the SOW' },
  ],
});
const sure = d.key !== 'unclear' && (d.p === null || d.p >= MIN_P);
const verdict = sure ? d.key : await escalateToQwen(line, cands, ctx);   // returns the same keys
if (verdict === 'new_scope') { /* draft CR with exact quote + category -> EFFORT table (unchanged) */ }
else if (verdict === 'partial' || verdict === 'unclear') { /* CR draft marked "needs Maya's call" */ }
// covered:<id> -> log "covered by §x" with p; no CR
```

The category for the effort table is also a Tev1 decision, using the options `ui_change`, `new_field`, `new_screen`, `report_or_export`, `integration` and `other`.

### `triage-ticket` (Phase F): Tev1 picks the SOW line, and the test still decides warranty

```ts
const d = await ctx.decide.choose({
  state: `Ticket from ${ticket.reporter}: "${ticket.text}"\n\nSOW lines:\n` + cands.map((c) => `${c.id}: ${c.criterion}`).join('\n'),
  question: 'Which SOW line is this ticket about?',
  options: [...cands.map((c) => ({ key: c.id, label: `${c.id}` })), { key: 'none', label: 'None of these' }],
});
// none -> change_request; otherwise run that line's test exactly as now (fail -> warranty, pass -> not_reproduced)
```

### `consolidate-commitments` (Phase C): duplicates by decision, not by an embedding cutoff

For each pair of commitments that embeddings flag as close (the existing `PACT_SIM_THRESHOLD`), ask Tev1: *"Do these two commitments promise the same thing?"* with the options "Yes, same promise" and "No, different promises". Merge on a sure "yes", keeping both quotes.

### What Qwen still does
- Writing: the SOW lines, acceptance tests, prototype slot fill, and the change-request wording.
- The unsure middle band of scope decisions.
- Pulling commitments out of transcripts (it needs to write summaries).

### Tests (names only)
- `decide: maps letter to option key and reads p from logprobs`
- `decide: out-of-range letter returns unclear`
- `classify: fuel-column ask -> new_scope (sure) -> CR-014 drafted`
- `classify: request covered by §2.1 -> no CR, logs covered`
- `classify: low-confidence -> escalates to Qwen once`
- `triage: iPad ticket -> §3.1 picked; Excel ticket -> none -> change_request`
- `eval: decide-eval.json accuracy logged at startup on the GB10`

### Risks and fallbacks
- **Weights are gated, or it won't run locally:** use the same `ctx.decide` interface with Qwen as the model (one letter, `logprobs` from Ollama). Same code, just slower.
- **Weak on our wording:** add 2–3 worked examples to the state text, or lower the confidence threshold so more cases go to Qwen.
- **"Experimental" model:** pin the exact revision you downloaded.

---

## Phase G — Dashboard

### Goal
A local Next.js app on the GB10 with the deal board, console (SOW/tests/PRs/proto/CR/tickets/agent log), Dana's portal, and the "Calls to cloud AI" proof strip, all driven by one event bus.

**Done when**
- `/deals`, `/console`, `/portal` all render from live agent state, not mocked data.
- Clicking a button (Mark Closed Won, Drop call 3, File ticket) calls `POST /actions/<name>` on the agent and the right skill output appears on screen within a few seconds via SSE.
- The proof strip shows a live cloud-call counter and updates when "Try a cloud call" is blocked.
- A hidden demo drawer (keyboard shortcut) can replay a cached run if live generation is slow.

### Owner
Rishab. Drafted by: ajay. Light + purple look, tabs, agent log rail, and proof strip carried over from the mockup (`scratchpad/pact-mockup/project/Main.dc.html`) — same structure, real data instead of scripted fakes.

### Files
```
pact/dashboard/                  # Next.js, :3000 — never imports the agent's bus
  app/
    deals/page.tsx
    console/page.tsx
    portal/page.tsx
  components/
    AgentLogRail.tsx
    CoverageMeter.tsx
    PrototypeCard.tsx
    ProofStrip.tsx
    DemoDrawer.tsx
  lib/useAgentState.ts
```
The agent (`:4000`, see `build-plan.md`'s "How it all connects") owns `POST /actions/<name>`, `POST /events` (for `demo.replay` only), `GET /state`, `GET /stream`. The dashboard has no `api/events` or `api/stream` routes of its own and no server-side bus import.

### Drafted code

#### `lib/useAgentState.ts` — one hook, all screens use it: fetch `/state`, refetch on every SSE event. `postAction` is how every demo control talks to the agent; `postEvent` exists only for `demo.replay`.
```ts
'use client';
import { useEffect, useState, useCallback } from 'react';
import type { StateSnapshot } from '@pact/core';

const AGENT_URL = 'http://localhost:4000';

export function useAgentState() {
  const [state, setState] = useState<StateSnapshot | null>(null);

  const refetch = useCallback(() => {
    fetch(`${AGENT_URL}/state`).then((r) => r.json()).then(setState);
  }, []);

  useEffect(() => {
    refetch();
    const es = new EventSource(`${AGENT_URL}/stream`);
    es.onmessage = () => refetch(); // any event -> refetch /state; simplest correct option for a single-box demo
    return () => es.close();
  }, [refetch]);

  return state;
}

export function postAction(name: string, payload: object = {}) {
  return fetch(`${AGENT_URL}/actions/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// /events is for demo.replay only — every other control goes through postAction.
export function postEvent(topic: string, payload: object = {}) {
  return fetch(`${AGENT_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, payload }),
  });
}
```

#### `components/AgentLogRail.tsx` — reads `StateSnapshot.logs` straight from `/state`
```tsx
import { useAgentState } from '../lib/useAgentState';

export function AgentLogRail() {
  const state = useAgentState();
  const logs = state?.logs ?? []; // last 50 skill.log entries, agent-ordered oldest -> newest
  return (
    <div className="log-rail">
      {logs.slice().reverse().map((l, i) => (
        <div key={i} className="log-row">
          <span className="log-skill">{l.skill}</span>
          <span>{l.msg}</span>
        </div>
      ))}
    </div>
  );
}
```

#### `components/CoverageMeter.tsx` — the agent already computes `coverage.green`/`coverage.total` off the latest engineering build; the dashboard just renders it
```tsx
import { useAgentState } from '../lib/useAgentState';

export function CoverageMeter() {
  const state = useAgentState();
  if (!state) return null;
  const { green, total } = state.coverage;
  return <div className="coverage-meter">{green}/{total} SOW lines covered</div>;
}
```

#### `components/PrototypeCard.tsx` — shows `StateSnapshot.prototype.url` once deployed
```tsx
import { useAgentState } from '../lib/useAgentState';

export function PrototypeCard() {
  const state = useAgentState();
  const url = state?.prototype?.url;
  if (!url) return <div className="prototype-card prototype-card--pending">Building prototype…</div>;
  return (
    <div className="prototype-card">
      <a href={url} target="_blank" rel="noreferrer">{url}</a>
    </div>
  );
}
```

#### `components/ProofStrip.tsx` — reads `StateSnapshot.counter` off `/state`
```tsx
import { useAgentState } from '../lib/useAgentState';

export function ProofStrip() {
  const state = useAgentState();
  const counter = state?.counter ?? { local: 0, cloud: 0, blocked: 0 };
  return <div className="proof-strip">Calls to cloud AI: {counter.cloud} · Blocked: {counter.blocked}</div>;
}
```

#### Console excerpt — `app/console/page.tsx` renders the rest of `StateSnapshot` the same way: no derived state, no client-side filtering beyond display order
```tsx
'use client'; // pages that use hooks or onClick are Client Components
import { useAgentState } from '../../lib/useAgentState';

function SowPanel() {
  const state = useAgentState();
  const lines = state?.sow?.lines ?? []; // grows as draft-sow streams sow.line.drafted
  return (
    <ul className="sow-panel">
      {lines.map((line) => <li key={line.id}>{line.title}</li>)}
    </ul>
  );
}

function BuildsPanel() {
  const state = useAgentState();
  const builds = state?.builds ?? [];
  return (
    <ul className="builds-panel">
      {builds.map((b) => (
        <li key={b.id}>
          {b.kind} · {b.status}
          {b.run ? ` · ${b.run.results.filter((r) => r.pass).length}/${b.run.results.length} tests passed` : ''}
        </li>
      ))}
    </ul>
  );
}

function CrsPanel() {
  const state = useAgentState();
  const crs = state?.crs ?? [];
  return (
    <ul className="crs-panel">
      {crs.map((cr) => <li key={cr.id}>{cr.id} · {cr.request} · “{cr.quote.text}”{cr.ack ? ` → “${cr.ack.text}”` : ''} · {cr.estimate ?? '[needs estimate]'}{cr.needsReview ? ' · needs Maya’s call' : ''}</li>)}
    </ul>
  );
}

function TicketsPanel() {
  const state = useAgentState();
  const tickets = state?.tickets ?? [];
  return (
    <ul className="tickets-panel">
      {tickets.map((t) => (
        <li key={t.id}>
          {t.text} · {t.status === 'open' ? 'Pact is checking…'
            : t.verdict === 'warranty' ? `Warranty defect — covered by SOW ${t.sowLineId}, no charge · assigned to ${t.assignee ?? '—'}`
            : t.verdict === 'change_request' ? 'Not in the SOW — change request'
            : 'Not reproduced on the current build'}
        </li>
      ))}
    </ul>
  );
}
```

#### Portal share button — `app/portal/page.tsx` (excerpt). Every button is a real `/actions/<name>` call, never a raw `/events` POST.
```tsx
'use client';
import { postAction, useAgentState } from '../../lib/useAgentState';

// Dana's review links: the prototype, plus any engineering build that was shared with her.
function ReviewLinks() {
  const state = useAgentState();
  const shared = (state?.builds ?? []).filter((b) => b.kind !== 'prototype' && b.deployUrl);
  return (
    <ul>
      {state?.prototype && <li>Prototype: <a href={state.prototype.url}>{state.prototype.url}</a></li>}
      {shared.map((b) => <li key={b.id}>Build {b.prNumber ? `PR #${b.prNumber}` : b.ref.slice(0, 7)}: <a href={b.deployUrl}>{b.deployUrl}</a></li>)}
    </ul>
  );
}

function ShareWithDana({ buildId }: { buildId: string }) {
  return (
    <button onClick={() => postAction('share-build', { buildId })}>
      Share this build with Dana
    </button>
  );
}
```

#### `components/DemoDrawer.tsx` — hidden fallback controls, every button calls a real `/actions/<name>` with real ids pulled live from `/state` (deal `hertz-demo`); only "Load cached result" posts `demo.replay` to `/events`
```tsx
'use client';
import { useEffect, useState } from 'react';
import { useAgentState, postAction, postEvent } from '../lib/useAgentState';

export function DemoDrawer() {
  const [open, setOpen] = useState(false);
  const state = useAgentState();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'd' && e.metaKey && e.shiftKey) setOpen(o => !o); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  if (!open) return null;

  const dealId = 'hertz-demo';
  const latestCr = state?.crs.at(-1);
  const prototypeBuildId = state?.prototype?.buildId;

  return (
    <div className="demo-drawer">
      <button onClick={() => postAction('drop-transcript', { id: 'call-3' })}>Drop call 3 transcript</button>
      <button onClick={() => postAction('drop-transcript', { id: 'status-1' })}>Drop status call (fuel ask)</button>
      <button onClick={() => postAction('mark-closed-won', { dealId })}>Mark Closed Won</button>
      <button onClick={() => postAction('approve-sow', { dealId })}>Approve SOW</button>
      <button disabled={!latestCr} onClick={() => latestCr && postAction('approve-cr', { crId: latestCr.id })}>
        Approve CR{latestCr ? ` (${latestCr.id})` : ''}
      </button>
      <button onClick={() => postAction('merge-regression', {})}>Merge regression PR</button>
      <button onClick={() => postAction('file-ticket', { text: 'iPad tablet layout is broken on the booking page' })}>
        File iPad ticket
      </button>
      <button disabled={!prototypeBuildId} onClick={() => prototypeBuildId && postAction('share-build', { buildId: prototypeBuildId })}>
        Share prototype with Dana
      </button>
      <button onClick={() => postAction('try-cloud-call', {})}>Try a cloud call</button>
      <button onClick={() => postEvent('demo.replay', { runId: 'hertz-happy-path' })}>Load cached result</button>
    </div>
  );
}
```
Every button but the last calls a real `/actions/<name>` the agent already handles (`drop-transcript`, `mark-closed-won`, `approve-sow`, `approve-cr`, `merge-regression`, `file-ticket`, `share-build`, `try-cloud-call`) with real ids read live off `/state` — same code path as the live demo, no dashboard-only shortcuts. `demo.replay` is the one topic that only exists for this drawer, posted straight to `/events`: Phase A/C add a tiny `demo.replay` handler in the agent (`on: 'demo.replay'`) that reads a recorded `{topic, payload}[]` fixture for `runId` and re-publishes each event on the real bus in order, so the UI never special-cases it. If recording/replay isn't built in time, cut the button rather than leaving `demo.replay` unhandled on the bus.

Routes (`/deals`, `/console`, `/portal`) are plain pages composing `useAgentState`, `AgentLogRail`, `CoverageMeter`, `PrototypeCard`, `ProofStrip`, the Sow/Builds/Crs/Tickets panels above, with the mockup's layout (purple tabs, white cards, light grey background) — plain Tailwind classes, no design-token system.

### Tests
- `useAgentState refetches /state on every SSE message from /stream`
- `postAction POSTs JSON to /actions/<name> and resolves 202`
- `ProofStrip renders counter.cloud / counter.blocked from /state`
- `DemoDrawer is hidden until Cmd+Shift+D, and disables Approve CR / Share prototype when state has no CR / prototype yet`
- `/console shows a new agent-log row within 3s of a skill.log event (Playwright)`

### Risks / fallbacks
- No per-dashboard SSE route or bus import — the dashboard is a pure HTTP client of the agent on `:4000` (`/actions/<name>`, `/events`, `/state`, `/stream`), exactly as `build-plan.md` specifies; CORS is handled agent-side (`Access-Control-Allow-Origin: *`).
- "Refetch `/state` on every SSE message" is simplest-correct for a one-box demo (small state, local network) rather than diffing payloads client-side; revisit only if `/state` grows large enough to matter.
- No real auth/session — fine for a single-box demo, not revisited.
- `/events` is reserved for `demo.replay`; every other dashboard control goes through `/actions/<name>` so the "live demo vs. drawer" code path is identical except for that one cached-replay button. Cut the "Load cached result" button entirely if `demo.replay` doesn't get built, rather than ship a drawer button that POSTs a topic nothing listens for.

---

---

### Quote playback on the commitment card (demo beat 1)
The call fixtures hold text and timestamps. Before the event, record the dramatized calls with stock voices (labeled, made-up names). Drop them in `dashboard/public/audio/<transcriptId>.mp3`. The card plays the clip from the quote's timestamp. If a file is missing, the card shows the quote and its timestamp only.
```tsx
'use client';
export function QuoteClip({ q }: { q: { transcriptId: string; t: number; text: string } }) {
  const src = `/audio/${q.transcriptId}.mp3#t=${q.t}`;
  return (
    <figure>
      <blockquote>“{q.text}” <small>{q.transcriptId} · {Math.floor(q.t / 60)}:{String(q.t % 60).padStart(2, '0')}</small></blockquote>
      <audio controls preload="none" src={src} onError={(e) => ((e.target as HTMLAudioElement).style.display = 'none')} />
    </figure>
  );
}
```

---

## Phase H — Demo hardening (everyone, led by Rishab)

**Goal:** the demo works every time, even if something live fails.
**Done when:** the full demo run works 5 times in a row, and every beat has a cached fallback.

- **Cache every beat** in `demo/fixtures/cached/`: the SOW, the test-run results, CR-014, both ticket verdicts and the deployed prototype URL. Save each from a real run.
- **Demo controls drawer** (Phase G): Drop call 3 · Dana asks for fuel column · File iPad ticket · Load cached result. Each button posts the same event a real source would.
- **Warm-up script:** load the models and keep them loaded, reset the store, re-seed the deal at Negotiation, revert the booking repo to the "before PR #34" state, and zero the counter.
- **Record the video** from a clean run on the GB10, then cut it to 2:00.
- **Check the Hertz guardrails** on every screen before recording.

---

---

## Open questions

**Ask the organizers this morning:** is "the agent runs in OpenClaw, inside OpenShell, set up through NemoClaw" enough to meet the required stack? That is how we use all three:
- **NemoClaw** does the install, the local model connection and the network rules.
- **OpenClaw** runs our 9 skills, the only real code we write for the stack.
- **OpenShell** is the sandbox and the cloud-call block.

**Check first on the GB10:**

- Can an OpenClaw skill be started from our event bus, or only from its own channels and crons? (Fallback: a small bridge that calls the skill when an event arrives.)
- Does OpenShell's network policy allow a domain allowlist (GitHub + Vercel), and does it expose a blocked-call count?
- Can OpenShell run and isolate our per-build Docker containers, or do we run them as plain Docker next to it?
- How good is a prototype from the local coding model in a few minutes? Test this early. If it's weak, have it fill in a template app instead of writing from scratch.
