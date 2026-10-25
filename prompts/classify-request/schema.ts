import { z } from 'zod';
// Qwen's only job here: find the requests in the call, and the reply that agreed to each one.
// Whether a request is in scope is Tev1's call (Phase F2), not Qwen's.
export const FindRequestsOutput = z.object({
  items: z.array(z.object({
    requestIndex: z.number().int().min(0),          // line where the customer asks for something
    ackIndex: z.number().int().min(0).nullable(),   // line where the team agreed to it, or null
  })),                                              // empty array = no requests in this call
});

// cr.approved: Qwen words the new SOW line. Code adds it; the model never writes the store.
export const CrLineOutput = z.object({ title: z.string().min(1).max(80), criterion: z.string().min(1).max(240) });
export type FindRequestsOutput = z.infer<typeof FindRequestsOutput>;
