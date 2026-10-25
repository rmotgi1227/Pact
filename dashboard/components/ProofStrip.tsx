'use client';
import { postAction, useAgentState } from '../lib/useAgentState';

export function ProofStrip() {
  const state = useAgentState();
  const counter = state?.counter ?? { local: 0, cloud: 0, blocked: 0 };

  return (
    <div className="footer-strip">
      <div className="footer-strip-count">
        Calls to cloud AI: <span style={{ color: 'var(--brand)' }}>{counter.cloud}</span> · Blocked:{' '}
        <span style={{ color: 'var(--bad)' }}>{counter.blocked}</span>
      </div>
      <button type="button" className="btn" onClick={() => postAction('try-cloud-call', {})}>
        Try a cloud call
      </button>
      <div className="footer-strip-tag">All on GB10 · NemoClaw · OpenClaw · OpenShell · Vercel for shared links</div>
    </div>
  );
}
