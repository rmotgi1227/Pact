# agent/ (goal R1, Rishab)
The one agent process. `main.ts` wires every skill from `skills/index.ts`, starts GitHub polling, seeds the `hertz-demo` deal, and serves HTTP on :4000:
- `POST /actions/<name>`
- `POST /events` (`demo.replay` only)
- `GET /stream` (SSE)
- `GET /state` (`StateSnapshot`)

`openclaw.ts` registers the skills with OpenClaw. It is the only file that knows OpenClaw's API (UNVERIFIED). See build-plan.md, Phase A.
