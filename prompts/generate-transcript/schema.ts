import { z } from 'zod';
// A call written from the operator's scenario. Who says what only: code adds ids and timestamps.
export const TranscriptOutput = z.object({
  lines: z.array(z.object({ speaker: z.string().min(1).max(40), text: z.string().min(1).max(400) })).min(3).max(30),
});
export type TranscriptOutput = z.infer<typeof TranscriptOutput>;
