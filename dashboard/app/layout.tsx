import type { ReactNode } from 'react';

export const metadata = { title: 'Pact' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <p>Dramatized replay based on public court filings (Hertz v. Accenture, S.D.N.Y. 1:19-cv-03508). Not Hertz&apos;s real data, people, calls or systems.</p>
        <nav><a href="/deals">Deals</a> · <a href="/console">Console</a> · <a href="/portal">Portal</a></nav>
        {children}
      </body>
    </html>
  );
}
