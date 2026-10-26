import { z } from 'zod';
// Qwen writes only the prose of a change order. Numbers (CO number, estimate, SOW version, dates) come from
// code, so any digit is rejected here and the repair retry asks the model again.
const prose = (max: number) => z.string().min(1).max(max).refine((s) => !/\d/.test(s), 'no digits: code adds every number');
export const ChangeOrderOutput = z.object({
  summary: prose(400),    // one or two sentences: what the customer gets
  scope: prose(700),      // what is added to the project, concretely
  rationale: prose(400),  // why this is outside the signed SOW
  nextSteps: prose(300),  // what the customer does now (review, sign, reply)
});
export type ChangeOrderOutput = z.infer<typeof ChangeOrderOutput>;
