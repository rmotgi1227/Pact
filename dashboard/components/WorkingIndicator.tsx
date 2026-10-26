'use client';
import { useEffect, useState } from 'react';
import { useAgentState } from '../lib/useAgentState';

// "Pact is working on …": every skill in flight, and whether it's waiting on OpenClaw's turn or running.
export function WorkingIndicator() {
  const activity = useAgentState()?.activity ?? [];
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!activity.length) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [activity.length]);
  if (!activity.length) return <div className="muted" style={{ fontSize: '0.78rem' }}>Pact is idle</div>;
  const first = activity[0];
  const secs = (since: number) => Math.max(0, Math.round((now - since) / 1000));
  return (
    <div style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
      title={activity.map((a) => `${a.skill} (${a.topic}): ${a.stage === 'openclaw' ? 'waiting for OpenClaw' : 'running'} ${secs(a.since)}s`).join('\n')}>
      <span className="agent-status-dot" aria-hidden="true" style={{ background: 'var(--brand)' }} />
      <span>
        Working: <b>{first.skill}</b> {first.stage === 'openclaw' ? 'waiting for OpenClaw' : 'running'} · {secs(first.since)}s
        {activity.length > 1 && <span className="muted"> · +{activity.length - 1} more</span>}
      </span>
    </div>
  );
}
