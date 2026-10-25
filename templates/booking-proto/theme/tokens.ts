// Three *generic* brand themes. Names are text-only placeholders for three real brands this
// prototype stands in for — no logos, no real brand colors. Each theme swaps one low-chroma
// accent hue; the structural neutrals (bg/surface/border/ink) are shared, so switching brands
// never forks the component tree, only the CSS variables below.
export type BrandId = 'hertz' | 'dollar' | 'thrifty';

export type Brand = { id: BrandId; name: string; accent: string; accentInk: string };

export const brands: Brand[] = [
  { id: 'hertz', name: 'Hertz', accent: 'oklch(0.550 0.070 110)', accentInk: 'oklch(0.985 0 0)' },
  { id: 'dollar', name: 'Dollar', accent: 'oklch(0.550 0.070 250)', accentInk: 'oklch(0.985 0 0)' },
  { id: 'thrifty', name: 'Thrifty', accent: 'oklch(0.550 0.070 330)', accentInk: 'oklch(0.985 0 0)' },
];

export const defaultBrand: BrandId = 'hertz';

export const brandById = (id: string | null | undefined): Brand =>
  brands.find((b) => b.id === id) ?? brands.find((b) => b.id === defaultBrand)!;
