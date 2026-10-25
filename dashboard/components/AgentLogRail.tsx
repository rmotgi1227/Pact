'use client';
import { useAgentState } from '../lib/useAgentState';

function clock(at: number) {
  const d = new Date(at);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function AgentLogRail() {
  const state = useAgentState();
  const logs = state?.logs ?? []; // last 50 skill.log entries, agent-ordered oldest -> newest

  return (
    <div className="rail">
      <h3>Live agent activity</h3>
      <div className="rail-items">
        {logs.length === 0 && <div className="muted" style={{ fontSize: '0.85rem' }}>No activity yet.</div>}
        {logs
          .slice()
          .reverse()
          .map((l, i) => (
            <div key={i} className="log-row">
              <div className="log-row-head">
                <span>{clock(l.at)}</span>
                <span className="log-row-skill">{l.skill}</span>
              </div>
              <div className="log-row-text">{l.msg}</div>
            </div>
          ))}
      </div>
    </div>
  );
}
