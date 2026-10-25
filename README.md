# Pact

An event-driven agent that turns a closed deal into a contract that tests itself. It runs fully locally on a Dell Pro Max GB10 (NemoClaw → OpenClaw → OpenShell), and Vercel is used only to share the prototypes it builds.

- `build-plan.md`: the plan, the phases, the drafted code and the **Goal loops** table.
- `demo.md`: the demo, "Hertz's rebuild, replayed with Pact".
- `CLAUDE.md`: the rules for anyone, or any agent, working here.

## Start
```sh
pnpm install
cp .env.example .env              # set PACT_MODEL_PROFILE=mac-dev on laptops
ollama pull qwen3.5:9b bge-m3     # laptop models
pnpm verify a1                    # run any goal's check: r1..r4, e2e, a1..a5, s1, s1b, s2..s5
```
