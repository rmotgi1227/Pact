'use client';

import Link from 'next/link';
import { BrandSwitcher } from './BrandSwitcher';
import { useBrand } from './BrandProvider';

// The wordmark is a generic product name plus a "Prototype" tag. A brand name never stands alone as a
// wordmark, so the prototype can't be mistaken for a real company's site (demo.md guardrails).
// Brand names appear only as plain text in the switcher.
export function Header() {
  const { brand } = useBrand();
  return (
    <header className="header">
      <Link href="/" className="header-title" aria-label={`Rental booking prototype, ${brand.name} theme`}>
        RentalDesk <span className="header-title-suffix">Prototype</span>
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
