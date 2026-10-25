import defaultSlots from '../slots.json';
import { slotsSchema, type Slots } from '../slots.schema';

// `generate-prototype` overwrites slots.json with model-derived, schema-validated copy before this
// template is built, so this is a defensive fallback, not the primary validation path.
export function getSlots(): Slots {
  const parsed = slotsSchema.safeParse(defaultSlots);
  if (parsed.success) return parsed.data;
  console.error('slots.json failed schema validation, using built-in default copy', parsed.error.message);
  return {
    title: 'Find your rental car',
    tagline: 'Search by location, dates and class.',
    searchFields: [{ key: 'location', label: 'Pickup location', type: 'text' }],
    showTabletLayout: false,
    screens: {
      results: { heading: 'Available cars' },
      book: { heading: 'Complete your reservation', cta: 'Reserve this car' },
      confirm: { heading: "You're booked", message: 'A confirmation is on its way to your email.' },
    },
  };
}
