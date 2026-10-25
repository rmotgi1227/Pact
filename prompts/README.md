# prompts/
One folder per model-facing skill: `system.md` (starts with `/no_think`, ends with the strict-JSON line) and `schema.ts` (zod). Loaded at runtime with `ctx.readPrompt('<skill>')`.
