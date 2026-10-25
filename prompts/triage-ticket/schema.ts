import { z } from 'zod';
export const TriageTicketOutput = z.object({
  sowLineId: z.string().nullable(), // from the candidate list given, or null
  reason: z.string().min(1).max(240),
});
