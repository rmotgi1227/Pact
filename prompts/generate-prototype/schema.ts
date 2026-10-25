import { z } from 'zod';

// Mirrors templates/booking-proto/slots.schema.ts exactly. Kept as a separate zod instance (not a
// cross-package import) to avoid cross-project zod type-instantiation blowups during root
// typecheck; the shapes must stay in sync by hand, which is one small object.
export const GenerateSlotsOut = z.object({
  title: z.string().min(1).max(60),
  tagline: z.string().min(1).max(140),
  searchFields: z
    .array(z.object({ key: z.string().min(1), label: z.string().min(1).max(40), type: z.enum(['text', 'date', 'select']) }))
    .min(1)
    .max(6),
  showTabletLayout: z.boolean(),
  screens: z.object({
    results: z.object({ heading: z.string().min(1).max(60) }),
    book: z.object({ heading: z.string().min(1).max(60), cta: z.string().min(1).max(24) }),
    confirm: z.object({ heading: z.string().min(1).max(60), message: z.string().min(1).max(160) }),
  }),
});
