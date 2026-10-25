import { z } from 'zod';

// The only thing `generate-prototype` fills. The model never writes app code or markup —
// every data-testid and the page structure are static JSX; only this copy is model-derived.
export const slotFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1).max(40),
  type: z.enum(['text', 'date', 'select']),
});

export const slotsSchema = z.object({
  title: z.string().min(1).max(60),
  tagline: z.string().min(1).max(140),
  searchFields: z.array(slotFieldSchema).min(1).max(6),
  showTabletLayout: z.boolean(),
  screens: z.object({
    results: z.object({ heading: z.string().min(1).max(60) }),
    book: z.object({ heading: z.string().min(1).max(60), cta: z.string().min(1).max(24) }),
    confirm: z.object({ heading: z.string().min(1).max(60), message: z.string().min(1).max(160) }),
  }),
});

export type SlotField = z.infer<typeof slotFieldSchema>;
export type Slots = z.infer<typeof slotsSchema>;
