'use client';
import { PactControls } from './PactControls';

export function AgentDownNotice() {
  return (
    <div className="agent-down" role="status">
      <div style={{ marginBottom: '0.6rem' }}>Pact isn&apos;t running. Start it here (about 2 minutes) to see live data.</div>
      <PactControls />
    </div>
  );
}
