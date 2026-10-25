'use client';

import Link from 'next/link';
import { BrandSwitcher } from './BrandSwitcher';
import { useBrand } from './BrandProvider';

// Top bar wordmark is the active brand's text-only name, never the page headline — so it never
// duplicates the hero's "Find your rental car" copy on the home page.
export function Header() {
  const { brand } = useBrand();
  return (
    <header className="header">
      <Link href="/" className="header-title">
        {brand.name} <span className="header-title-suffix">Rentals</span>
      </Link>
      <nav className="header-nav" aria-label="Primary">
        <Link href="/#search" className="header-nav-link">
          Search
        </Link>
        <Link href="/#popular" className="header-nav-link">
          Popular cars
        </Link>
      </nav>
      <BrandSwitcher />
    </header>
  );
}
