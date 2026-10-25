import { z } from 'zod';

// One JSON object per line — this is the itemSchema for ctx.llm.jsonLines.
export const DraftSowLine = z.object({
  id: z.string(),        // e.g. '§3.1'
  title: z.string(),
  criterion: z.string(), // testable, e.g. "works at tablet width 768-1024px"
  commitmentIds: z.array(z.string()),
});
export type DraftSowLine = z.infer<typeof DraftSowLine>;
