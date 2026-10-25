'use client';
import { postAction, useAgentState } from '../lib/useAgentState';

export function SowPanel() {
  const state = useAgentState();
  const sow = state?.sow ?? null;
  const lines = sow?.lines ?? []; // grows as draft-sow streams sow.line.drafted

  return (
    <div className="card">
      <div className="row" style={{ marginBottom: '0.9rem' }}>
        <h2 style={{ margin: 0 }}>Statement of Work{sow ? ` v${sow.version}` : ''}</h2>
        <div className="muted" style={{ fontSize: '0.82rem' }}>
          {lines.length} line{lines.length === 1 ? '' : 's'} drafted
        </div>
      </div>

      {!sow && <div className="muted">No SOW yet — mark the deal Closed Won to draft one.</div>}

      <ul className="list" style={{ marginBottom: '1rem' }}>
        {lines.map((line) => (
          <li key={line.id} className="list-item">
            <div className="row">
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{line.title}</div>
              <span className="pill pill-source">§{line.id}</span>
            </div>
            <div className="muted" style={{ fontSize: '0.84rem', marginTop: '0.3rem' }}>
              {line.criterion}
            </div>
          </li>
        ))}
      </ul>

      {sow?.status === 'draft' && lines.length > 0 && (
        <button type="button" className="btn btn-primary" onClick={() => state && postAction('approve-sow', { dealId: state.deal.id })}>
          Approve SOW (Maya)
        </button>
      )}
      {sow?.status === 'approved' && <div className="pill pill-good">Approved by Maya — sent to Engineering →</div>}
    </div>
  );
}
