# Pact: rules for anyone (or any agent) working in this repo

Read `build-plan.md` before changing anything. When sections disagree, this is the order that wins:
1. "Review round 2: binding decisions"
2. "How it all connects"
3. the phase sections

`demo.md` is the flow the code must support.

## Ownership
- **Rishab is the tech lead.** Only Rishab changes `core/` types, the event `Topic` list, `StateSnapshot`, the `/actions` list, or `skills/index.ts`. If your goal needs a contract change, stop and ask Rishab. Do not edit the contract to make your code compile.
- Work only in the folders listed for your goal in build-plan.md's "Goal loops" table.
- One branch per person (`rishab/*`, `aryan/*`, `shreyas/*`). Never push to `main`. Rishab merges.

## Hard rules
- **No cloud AI, ever.** All models run locally (Ollama, vLLM or MLX) on the GB10 or your laptop. No AI API keys anywhere: no OpenAI, Anthropic, Together, OpenRouter, Vercel AI Gateway or AI SDK providers. Tev1 and every other model run from local weights only.
- **No hard-coded results.** Every output on screen comes from a real skill running on real inputs. Cached runs are only for stage emergencies, and they replay a real earlier run.
- Every model call goes through `ctx.llm` or `ctx.decide`. The model never writes the store, and it never outputs numbers: code computes them.
- Every build runs in its own fresh Docker container. Only tested builds get deployed.
- Hertz guardrails (`demo.md` §1):
  - the vendor in the replay is the made-up Northstar,
  - never show Accenture inside the product,
  - no Hertz logos or branding,
  - say "Hertz alleged" or "per the lawsuit".

## Style
- TypeScript, Node 24, strict, ESM (`NodeNext`). Relative imports use `.js` specifiers. Shared types come from `@pact/core`.
- Hackathon scope: make the main demo path really work. Skip edge cases the demo never hits.
- A goal is done when `scripts/verify/<goal>.sh` exits 0.
