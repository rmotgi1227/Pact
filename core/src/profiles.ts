// Ollama base URL, native API (no API key). The model tags are UNVERIFIED until `ollama list` is run on each box.
const profiles = {
  gb10: { url: process.env.PACT_LLM_URL ?? 'http://127.0.0.1:11434',
    reasoning: 'qwen3.6:35b-a3b', coding: 'qwen3-coder:30b-a3b', embed: 'bge-m3',
    decide: { url: process.env.PACT_DECIDE_URL ?? 'http://127.0.0.1:8002/v1', model: 'togethercomputer/Tev1-4B-experimental' } },
  'mac-dev': { url: process.env.PACT_LLM_URL ?? 'http://127.0.0.1:11434',
    reasoning: 'qwen3.5:9b', coding: 'qwen3.5:9b', embed: 'bge-m3',
    decide: { url: process.env.PACT_DECIDE_URL ?? 'http://127.0.0.1:11434/v1', model: 'togethercomputer/Tev1-4B-experimental' } },
};
export const profile = profiles[(process.env.PACT_MODEL_PROFILE ?? 'mac-dev') as keyof typeof profiles];
