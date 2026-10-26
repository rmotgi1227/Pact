'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAgentState } from '../lib/useAgentState';

type Status = { running: boolean; op: string | null; log: string[] };

// Start / Reset the whole stack through the dashboard's own server (/api/control), so it works while the agent is down.
export function PactControls({ compact = false }: { compact?: boolean }) {
  const agentUp = useAgentState() !== null;
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const r = await fetch('/api/control').catch(() => null);
    if (r?.ok) setStatus(await r.json());
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { // poll only while a job runs
    if (!status?.running) return;
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, [status?.running, refresh]);

  async function run(op: 'start' | 'reset') {
    if (op === 'reset' && !confirm('Reset Pact? This clears Pact\'s data, resets the demo booking repo with new PRs, and restarts Pact (about 3 minutes). Nothing runs until you mark the deal Closed Won.')) return;
    setError(null);
    const r = await fetch('/api/control', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ op }) });
    if (!r.ok) setError(((await r.json().catch(() => ({}))) as { error?: string }).error ?? `failed (${r.status})`);
    void refresh();
  }

  const busy = status?.running ?? false;
  const label = busy ? (status?.op === 'reset' ? 'Resetting…' : 'Starting…') : null;
  return (
    <div style={{ display: 'flex', flexDirection: compact ? 'row' : 'column', gap: '0.4rem', alignItems: compact ? 'center' : 'stretch' }}>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        {!agentUp && <button type="button" className="btn btn-primary" disabled={busy} onClick={() => run('start')}>{label ?? 'Start Pact'}</button>}
        <button type="button" className="btn" disabled={busy} onClick={() => run('reset')}>{busy && agentUp ? label : 'Reset Pact'}</button>
      </div>
      {error && <span style={{ fontSize: '0.78rem', color: 'var(--bad, #b42318)' }}>{error}</span>}
      {!compact && busy && status && (
        <pre className="mono" style={{ fontSize: '0.74rem', whiteSpace: 'pre-wrap', margin: 0, maxHeight: '10rem', overflow: 'auto' }}>
          {status.log.join('\n')}
        </pre>
      )}
      {compact && busy && status?.log.at(-1) && (
        <span className="muted mono" style={{ fontSize: '0.72rem', maxWidth: '22rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {status.log.at(-1)}
        </span>
      )}
    </div>
  );
}
