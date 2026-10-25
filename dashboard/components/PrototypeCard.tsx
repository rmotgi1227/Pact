'use client';
import { useAgentState } from '../lib/useAgentState';

export function PrototypeCard() {
  const state = useAgentState();
  const url = state?.prototype?.url;

  return (
    <div className="card">
      <h3>Prototype from the SOW</h3>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="mono">
          {url}
        </a>
      ) : (
        <div className="muted">Pact is building the prototype in a fresh container…</div>
      )}
    </div>
  );
}
