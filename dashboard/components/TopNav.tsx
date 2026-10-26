'use client';
import { usePathname } from 'next/navigation';
import { useAgentState } from '../lib/useAgentState';
import { PactControls } from './PactControls';
import { WorkingIndicator } from './WorkingIndicator';

const TABS = [
  { href: '/deals', label: 'Deal' },
  { href: '/pact', label: 'Pact' },
];

export function TopNav() {
  const pathname = usePathname();
  const state = useAgentState();
  const agentUp = state !== null;

  return (
    <div className="topbar">
      <div className="topbar-brand">
        <a href="/deals" className="topbar-logo" style={{ textDecoration: 'none' }}>
          Pact
        </a>
        <div className="topbar-divider" />
        <div className="topbar-deal">
          {state?.deal.name ?? 'Hertz — Digital rebuild (replay)'} · Northstar Consulting
        </div>
      </div>

      <nav className="tabs">
        {TABS.map((tab) => (
          <a key={tab.href} href={tab.href} className="tab" data-active={pathname?.startsWith(tab.href)}>
            {tab.label}
          </a>
        ))}
      </nav>

      {agentUp && <WorkingIndicator />}
      <PactControls compact />
      <div className="agent-status" data-ok={agentUp}>
        <span className="agent-status-dot" aria-hidden="true" />
        {agentUp ? 'Agent running' : 'Agent not running on :4000'}
      </div>
    </div>
  );
}
