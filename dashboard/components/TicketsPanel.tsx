'use client';
import { useAgentState } from '../lib/useAgentState';

export function verdictText(t: { status: string; verdict?: string; sowLineId?: string; assignee?: string }) {
  if (t.status === 'open') return 'Pact is checking…';
  if (t.verdict === 'warranty') {
    return `Warranty defect — covered by SOW ${t.sowLineId}, no charge · assigned to ${t.assignee ?? '—'}`;
  }
  if (t.verdict === 'change_request') return 'Not in the SOW — change request';
  return 'Not reproduced on the current build';
}

export function TicketsPanel() {
  const state = useAgentState();
  const tickets = state?.tickets ?? [];

  return (
    <div className="card">
      <h3>Tickets</h3>
      {tickets.length === 0 && <div className="muted">No tickets filed yet.</div>}
      <ul className="list">
        {tickets.map((t) => (
          <li key={t.id} className="list-item">
            <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.3rem' }}>{t.text}</div>
            <div className={t.verdict === 'warranty' ? 'pill pill-warn' : 'muted'} style={{ fontSize: '0.84rem' }}>
              {verdictText(t)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
