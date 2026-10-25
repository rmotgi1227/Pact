import Link from 'next/link';
import { BrandSwitcher } from './BrandSwitcher';

export function Header({ title }: { title: string }) {
  return (
    <header className="header">
      <Link href="/" className="header-title">
        {title}
      </Link>
      <BrandSwitcher />
    </header>
  );
}
