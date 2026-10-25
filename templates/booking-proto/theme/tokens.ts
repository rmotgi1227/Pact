// Three *generic* brand themes. Names are text-only placeholders for three real brands this
// prototype stands in for — no logos, no real brand colors. Each theme swaps one confident,
// saturated accent hue (none of which match a real brand's actual identity color — Hertz's
// real yellow/black, for instance, has no presence here); the structural neutrals (bg/surface/
// border/ink/chrome) are shared, so switching brands never forks the component tree, only the
// CSS variables below.
export type BrandId = 'hertz' | 'dollar' | 'thrifty';

export type Brand = { id: BrandId; name: string; accent: string; accentInk: string };

export const brands: Brand[] = [
  { id: 'hertz', name: 'Hertz', accent: 'oklch(0.480 0.130 185)', accentInk: 'oklch(0.985 0 0)' },
  { id: 'dollar', name: 'Dollar', accent: 'oklch(0.460 0.140 265)', accentInk: 'oklch(0.985 0 0)' },
  { id: 'thrifty', name: 'Thrifty', accent: 'oklch(0.470 0.140 340)', accentInk: 'oklch(0.985 0 0)' },
];

export const defaultBrand: BrandId = 'hertz';

export const brandById = (id: string | null | undefined): Brand =>
  brands.find((b) => b.id === id) ?? brands.find((b) => b.id === defaultBrand)!;
