'use client';
import { useState } from 'react';
import { postAction, useAgentState } from '../lib/useAgentState';

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
  const [text, setText] = useState('');
  const file = (t: string) => { if (state && t.trim()) postAction('file-ticket', { dealId: state.deal.id, text: t.trim() }); };

  return (
    <div className="card">
      <h3>Tickets</h3>
      <div className="row" style={{ marginBottom: '0.5rem', gap: '0.5rem' }}>
        <input className="field-text" style={{ flex: '1 1 260px' }} placeholder="File a ticket as the customer: what's wrong, or what do you want?"
          value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { file(text); setText(''); } }} />
        <button type="button" className="btn btn-primary" disabled={!text.trim()} onClick={() => { file(text); setText(''); }}>File ticket</button>
      </div>
      <div className="row" style={{ marginBottom: '0.8rem', gap: '0.5rem' }}>
        <button type="button" className="btn" onClick={() => file('Booking broken on my iPad')}>Booking broken on my iPad</button>
        <button type="button" className="btn" onClick={() => file('Can we export to Excel?')}>Can we export to Excel?</button>
      </div>
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
