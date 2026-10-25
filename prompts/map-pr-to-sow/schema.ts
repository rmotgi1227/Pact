import { z } from 'zod';
export const MapPrOut = z.object({ sowLineIds: z.array(z.string()) });
