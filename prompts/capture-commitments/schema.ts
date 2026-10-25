import { z } from 'zod';

export const CaptureCommitmentsOut = z.object({
  items: z.array(z.object({ lineIndex: z.number().int(), summary: z.string() })),
});
export type CaptureCommitmentsOut = z.infer<typeof CaptureCommitmentsOut>;
