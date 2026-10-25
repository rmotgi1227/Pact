# infra/decide/ (goal S1b, Shreyas)
Serves Tev1-4B-experimental from local weights: vLLM on the GB10 (port 8002), Ollama on the Mac. Never call it through Together or OpenRouter. See build-plan.md, Phase F2.

- **Weights:** `togethercomputer/Tev1-4B-experimental`, public (not gated), pinned to revision `0b7becf017daa0e5eb222f8ce7483c8c8259c52f`. The model card states **no license**. The base model, Qwen3.5-4B, is Apache-2.0. Rishab decides whether that's enough for the demo.
- **Mac:** `ollama pull hf.co/bartowski/togethercomputer_Tev1-4B-experimental-GGUF:Q4_K_M`, then `ollama create togethercomputer/Tev1-4B-experimental -f infra/decide/Modelfile`.
- **GB10:** `bash infra/decide/serve-gb10.sh` (UNVERIFIED flags).
- **Thinking must be off per request.** Without `reasoning_effort: "none"` (Ollama) / `chat_template_kwargs.enable_thinking: false` (vLLM), the model spends its 8 tokens thinking and returns no letter, so every decision is `unclear`.
- **Eval:** `pnpm tsx infra/decide/eval.ts` runs `demo/fixtures/decide-eval.json` (20 labeled cases) through the real `ctx.decide`.

## Eval result (mac-dev, Q4_K_M, 2026-10-25, thinking off)
- Accuracy **85.0% (17/20)**. All 4 demo cases are right: fuel column → new_scope, Excel → new_scope, iPad ticket → §3.1, Excel ticket → none.
- Misses: both "partial" cases came back as new_scope, and "Book button does nothing" came back as §1.2 instead of §2.1. Every miss had p ≤ 0.80.
- **`PACT_DECIDE_MIN_P=0.82`**: every answer at or above it was correct (12/20 sure). The rest escalate to Qwen, including the fuel (p 0.73) and Excel (p 0.65) asks.
- Median latency is about 0.2–1 s per decision on the Mac.
