import type { Metadata } from 'next';
import { BrandProvider } from './components/BrandProvider';
import { Footer } from './components/Footer';
import { defaultBrand } from '../theme/tokens';
import './globals.css';

export const metadata: Metadata = {
  title: 'Booking prototype',
  description: 'Pact-generated booking flow prototype — demo data only.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-brand={defaultBrand}>
      <body>
        <BrandProvider>
          <div className="app-shell">
            {children}
            <Footer />
          </div>
        </BrandProvider>
      </body>
    </html>
  );
}
