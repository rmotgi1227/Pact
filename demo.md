# Pact — Demo Plan: "Hertz's rebuild, replayed with Pact"

**The idea:** we replay the Hertz website rebuild, using only facts from the public court filings, and show where Pact would have caught each problem. It runs live in about 4 minutes, and the 2-minute video is the same run with the waits cut.
**One chain the whole demo moves:** sales call quote → commitment → SOW line → acceptance test → code → ticket.
**Architecture:** everything runs on the GB10: the Pact dashboard (CRM board, console, portal), the agent (NemoClaw → OpenClaw agent → OpenShell sandbox), every model, the data, and a fresh Docker container for every build. **Vercel is used only to deploy the prototypes Pact builds, so they can be shared by link.** No AI keys and no Pact data go to Vercel.

---

## 1. Guardrails (read before building anything that says "Hertz")

We are putting a real company into a dramatized demo. These rules keep it factual and fair.

1. **Label it, always on screen:** *"Dramatized replay based on public court filings (Hertz v. Accenture, S.D.N.Y. 1:19-cv-03508). Not Hertz's real data, people, calls or systems."*
2. **Only the commitments come from the filings.** Each one cites its paragraph (table in §2). Everything else is invented and labeled as such: the people, the call audio, the code and the scope-drift request.
3. **The vendor is not named.** In the replay, the delivery firm is our made-up **Northstar Consulting**, and it is the one using Pact. We never show Accenture doing, saying or building anything. Accenture appears only on the source card, with its own response quoted.
4. **People are made up.** No real Hertz or Accenture employees, and no cloned voices. Stock voices, labeled.
5. **No Hertz branding.** No logo and no brand colors or fonts. Plain "Hertz" in text only. The booking site is a generic demo site called "Rental booking (replay)".
6. **Wording:** "Hertz alleged" · "per the lawsuit" · "Accenture says" · "would have flagged". Never "would have saved $X". Never guess the settlement.
7. **Before anything goes on screen,** check every paragraph number against the complaint PDF (PLAN.md §7).
8. **Keep it private until reviewed:** the mockup and video links are shared only with the team until all of the above is checked.

---

## 2. What the replay is built from (the filings)

| Commitment in the replay | Where it comes from | How Pact uses it |
|---|---|---|
| Responsive site with small, medium (tablet) and large layouts | Complaint ¶53 (per the complaint, the contract required "Medium (Tablet) browsers") | SOW §3.1 → acceptance test at tablet width. **The thread of the whole demo.** |
| Reusable code across the Hertz, Dollar and Thrifty brands | Complaint ¶¶11, 45–47 | SOW §4.1 → test: the same component library serves all three brand themes |
| Go-live December 2017 | Complaint ¶7 | Milestone on the plan. The coverage meter makes the slip visible early |
| Tablet layout not built; extra fees demanded for it | Complaint ¶10 (alleged) | The support beat: a covered, no-charge defect, not a paid change |
| "An impressive, one-day presentation" | Complaint ¶4 | Hook only |

**Invented for the replay, and labeled:** the call recordings and dialogue, the cast, the booking-site code, the "fuel-level column" scope-drift request, and the seeded iPad regression.

---

## 3. Cast (all made up)

| Name | Role in the replay |
|---|---|
| **Sam** | Northstar salesperson |
| **Maya** | Northstar delivery lead. Approves the SOW and change requests. |
| **Priya** | Northstar front-end engineer. Builds the tablet layout. |
| **Raj** | Northstar back-end engineer. Says "sure" too fast. |
| **Dana** | Hertz digital product lead (a made-up person) |

---

## 4. Setup (before judges walk up)

**Browser tabs:**
1. **CRM board** (dashboard on the GB10, `/deals`): "Hertz — Digital rebuild (replay)" in *Negotiation*, with calls 1–2 attached and their commitments already extracted.
2. **Pact console** (dashboard, `/console`): coverage meter, SOW, agent log (right), "Calls to cloud AI: 0" (bottom).
3. **GitHub:** the booking-site repo. Search, booking, receipts and brand themes are already merged. **Priya's "Tablet layout" PR is open and ready.**
4. **Customer portal** (dashboard, `/portal`): what Dana sees.
6. **A phone** to open the shared prototype link.
5. **Source card:** Complaint ¶8 next to Accenture's Motion to Dismiss p.1.

**On the GB10:** NemoClaw running, models warm, and the agent log plus GPU panel on the second screen.

**Demo controls** (a hidden drawer in the console, opened with a keyboard shortcut): **Drop call 3** · **Dana asks for fuel column** · **Merge regression** · **File iPad ticket** · **Try a cloud call** · **Load cached result** (fallback). Each button posts one real event to `/api/events`, exactly as a real source would. Everything after that is Pact doing real work.

---

## 5. The run (about 4 minutes live; cut to 2:00 for the video)

| # | Time (live) | Do | Pact does (event) | Say |
|---|---|---|---|---|
| 0 | 0:15 | Show the source card. | — | "Hertz alleged it paid Accenture over $32 million and never got a working site. Part of the fight was a tablet layout Hertz says the contract required, and that Accenture wanted extra fees to build. Accenture says the suit was about unpaid fees. Here's that project, replayed with Pact." |
| 1 | 0:30 | CRM tab → **Drop call 3**. | `transcript.added` → new commitment appears with a play button: *"It has to work on tablets."* | "Pact listens to every sales call. Every promise is captured with the exact quote. All on this box." |
| 2 | 0:45 | **Drag the deal to Closed Won.** (A judge can do it.) | `deal.closed_won` → the log shows "Re-reading 3 calls" and "14 commitments". SOW lines stream in, each with a criterion and its source. §3.1: *"Booking flow works at tablet width 768–1024px."* §4.1: *"One component library serves Hertz, Dollar and Thrifty."* Click **Approve SOW**. | "Closed Won is the trigger. Pact goes back through every call and writes the SOW, and every line is specific and testable." |
| 3a | 0:30 | Console. | `sow.approved` → `generate-prototype`: Pact builds a **prototype of the booking flow from the SOW**, including the tablet layout, in a fresh container on the GB10 → runs the SOW tests on it → **deploys it to Vercel**. The link appears in Dana's portal. **Open it on a phone and a tablet.** | "Day one: Pact turns the SOW into a working prototype and shares it. Dana sees the tablet layout before anyone has argued about it." |
| 3b | 0:30 | Console → GitHub. | Issues opened, one per SOW line. **PR: "Acceptance tests from SOW v1".** Engineering's real build: meter **7 / 8**, §3.1 tablet **red**. | "Engineering built search, booking, receipts and all three brands, and the tests prove it. The tablet layout isn't built yet. In the lawsuit, Hertz alleged that came out at the end. Here it's red on day one." |
| 4 | — | GitHub → **merge Priya's tablet PR**. | `build.requested` (from polling) → Pact builds the PR in a **fresh Docker container on the GB10** (target under 60 s). **Go straight to beat 5.** | "Pact is building Priya's fix in its own locked container on this box. Meanwhile…" |
| 5 | 0:40 | **Dana asks for fuel column.** | `transcript.added` (status call): Dana asks for a fuel-level column, and Raj says "sure, we can add that." → Tev1 (the local decision model) decides **not in the SOW** → **CR-014 drafted** (request, quote, effort estimate) → Maya. Click **Approve CR** → SOW v2, a new red test. Meter **7 / 9**. | "That 'sure' is how projects lose money and end up in court. Pact turned it into a paid change before anyone wrote code." |
| 6 | 0:20 | Back to the console. | `build.ready` → tests run against **Priya's PR container** on the GB10 → §3.1 **green**. PR comment: *"Satisfies SOW §3.1."* Pact deploys the tested build to Vercel, and Dana's portal shows *"Tablet support ready for review"* with the link. Meter **8 / 9**. | "Every change is built in its own container and tested against the contract. Dana reviews it as it's built, not months later." |
| 7 | 0:40 | Drawer → **Merge regression** (do this during beat 6, so its build is already running), then Portal → **File iPad ticket**. | `ticket.created`: *"Booking broken on my iPad."* → runs the §3.1 test → phone ✓ · **tablet ✗** · desktop ✓ → **"Warranty defect. Covered by SOW §3.1, no charge."** → routed to Priya (her PR made §3.1 pass). Optional: *"Can we export to Excel?"* → **"Not in SOW, so it's a change request."** | "Same contract, same tests, an answer in seconds. Per the lawsuit, at Hertz this became a demand for hundreds of thousands in extra fees. With Pact it's a free fix under the SOW, with proof." |
| 8 | 0:20 | Bottom strip → **Try a cloud call**. | OpenShell blocks it → **Cloud: 0 · Blocked: 1**. GPU panel: the models on one GB10. | "Everything runs on this box: the agent, every model, every build. Vercel only hosts the prototype link, with no AI keys and no Pact data." |
| — | 0:10 | Close. | — | "Pact would have flagged these problems months earlier. From the sales call to the support ticket, one contract that tests itself." |

**Cutting to 2:00 for the video:** drop the Excel ticket. Speed up the SOW streaming (beat 2), the prototype build (beat 3a), the test run (beat 3b) and the container build. Keep the never-cut moments below.

**Never cut:**
- the tablet commitment with its clip (beat 1),
- Closed Won → SOW (beat 2),
- the deployed prototype link (beat 3a),
- the red §3.1 test (beat 3),
- CR-014 from Raj's "sure" (beat 5),
- the warranty verdict (beat 7),
- the source card with Accenture's side (beat 0),
- the cloud counter (beat 8).

---

## 6. If something breaks

| Beat | Fallback |
|---|---|
| SOW slow or garbled | **Load cached result:** the SOW from a real earlier run, shown through the real console |
| Container build slow | Reuse the last container built for that commit |
| Tests hang | Cached test result for that same commit |
| Wi-Fi down | Phone hotspot. Pact and the dashboard are on the box, so the demo keeps running; only GitHub and the Vercel deploy wait. |
| Prototype weak or slow | Show the prototype from a real earlier run, already deployed, labeled cached |
| Everything | Play the 2-minute video |

---

## 7. What's real vs. scrappy

- **Real:**
  - every Pact output (SOW, tests, issues, PR comments, CR-014, ticket verdicts), generated live by local models on the GB10,
  - the PR builds in real Docker containers on the GB10, and the test runs against them,
  - the OpenShell block.
- **Scrappy, and fine:**
  - the CRM is our own simple board,
  - the events come from demo buttons,
  - the calls are dramatized and labeled,
  - the engineering PRs were pre-built today,
  - the iPad regression is seeded on purpose.

---

## 8. Events and skills this needs (feeds build-plan.md)

**Events:**
- `transcript.added`
- `deal.closed_won`
- `sow.approved`
- `build.requested`
- `build.ready`
- `build.passed` (then deploy to Vercel)
- `ticket.created`

**Skills:**
- `capture-commitments`
- `consolidate-commitments`
- `draft-sow` (with acceptance criteria)
- `generate-acceptance-tests`
- `generate-prototype`
- `run-acceptance-tests`
- `map-pr-to-sow`
- `classify-request`
- `triage-ticket`

**Owners:**
- **Rishab:** the local dashboard (CRM board, console, portal), `draft-sow`, `generate-prototype`.
- **Aryan:** `classify-request`, CR flow, `triage-ticket`, GitHub issues and PR comments.
- **Shreyesh:** GB10, models, the Docker builder and test-runner container, the Vercel deploy step, `generate-acceptance-tests`.
