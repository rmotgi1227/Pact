'use client';

import { brands, useBrand } from './BrandProvider';

// Text-only brand names, generic palette swap per theme/tokens.ts — no logos, no real brand colors.
export function BrandSwitcher() {
  const { brand, setBrandId } = useBrand();
  return (
    <div className="brand-switcher" role="group" aria-label="Brand" data-testid="brand-switcher">
      {brands.map((b) => (
        <button
          key={b.id}
          type="button"
          aria-pressed={b.id === brand.id}
          onClick={() => setBrandId(b.id)}
        >
          {b.name}
        </button>
      ))}
    </div>
  );
}
