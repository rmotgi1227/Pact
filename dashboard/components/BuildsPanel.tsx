'use client';
import { useAgentState } from '../lib/useAgentState';

const STATUS_PILL: Record<string, string> = {
  passed: 'pill-good',
  failed: 'pill-bad',
  queued: '',
  building: '',
  ready: '',
  testing: '',
};

export function BuildsPanel() {
  const state = useAgentState();
  const builds = state?.builds ?? [];
  const engBuilds = builds.filter((b) => b.kind !== 'prototype');

  return (
    <div className="card">
      <h3>Engineering builds</h3>
      <ul className="list">
        {engBuilds.length === 0 && <li className="muted">No builds yet.</li>}
        {engBuilds.map((b) => {
          const passed = b.run ? b.run.results.filter((r) => r.pass).length : 0;
          const total = b.run ? b.run.results.length : 0;
          return (
            <li key={b.id} className="list-item row">
              <div>
                {b.kind} · {b.prNumber ? `PR #${b.prNumber}` : b.ref.slice(0, 7)}
                {b.author ? <span className="muted"> · {b.author}</span> : null}
              </div>
              <div className="row" style={{ gap: '0.6rem', width: 'auto' }}>
                {b.run && (
                  <span className="muted mono" style={{ fontSize: '0.78rem' }}>
                    {passed}/{total} tests passed
                  </span>
                )}
                <span className={`pill ${STATUS_PILL[b.status] ?? ''}`.trim()}>{b.status}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
