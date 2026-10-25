import type { ReactNode } from 'react';
import './globals.css';
import { TopNav } from '../components/TopNav';
import { DemoDrawer } from '../components/DemoDrawer';

export const metadata = { title: 'Pact' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="page-shell">
          <p className="replay-banner">
            Dramatized replay based on public court filings (Hertz v. Accenture, S.D.N.Y. 1:19-cv-03508). Not Hertz&apos;s real
            data, people, calls or systems.
          </p>
          <TopNav />
          {children}
          <DemoDrawer />
        </div>
      </body>
    </html>
  );
}
