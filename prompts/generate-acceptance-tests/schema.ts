import { z } from 'zod';

// The model names no files: the test id (and spec filename) is derived in code from sowLineId.
export const GenerateTestsOut = z.object({
  tests: z.array(z.object({
    sowLineId: z.string(),      // '§3.1', must be one of the ids given in the prompt
    source: z.string().min(20), // the Playwright spec, as text
  })),
});
