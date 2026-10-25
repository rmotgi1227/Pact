'use client';
import { postAction, useAgentState } from '../../lib/useAgentState';
import { AgentDownNotice } from '../../components/AgentDownNotice';
import { QuoteClip } from '../../components/QuoteClip';
import { MagneticButton } from '../../components/ui/magnetic-button';

const COLUMNS = [
  { key: 'negotiation' as const, label: 'Negotiation' },
  { key: 'closed_won' as const, label: 'Closed Won' },
];

export default function DealsPage() {
  const state = useAgentState();

  if (!state) {
    return (
      <main className="content">
        <div className="main-col">
          <AgentDownNotice />
        </div>
      </main>
    );
  }

  const { deal, transcripts, commitments } = state;
  const calls = transcripts.filter((t) => t.dealId === deal.id);
  const call3Dropped = calls.some((c) => c.id === 'call-3');
  const latestCommitment = commitments.filter((c) => c.dealId === deal.id).at(-1);

  return (
    <main className="content">
      <div className="main-col">
        <div className="kanban">
          {COLUMNS.map((col) => (
            <div key={col.key} className="kanban-col">
              <div className="kanban-col-label">{col.label}</div>
              {deal.stage === col.key && (
                <div className="kanban-card">
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.3rem' }}>{deal.name}</div>
                  <div className="muted" style={{ fontSize: '0.76rem' }}>
                    {calls.length} call{calls.length === 1 ? '' : 's'} · {commitments.length} commitment
                    {commitments.length === 1 ? '' : 's'}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="card">
          <h2>{deal.name}</h2>
          <div className="muted" style={{ fontSize: '0.84rem', marginBottom: '1rem' }}>
            Stage: {deal.stage === 'negotiation' ? 'Negotiation' : 'Closed Won'}
          </div>

          <h3>Calls</h3>
          <ul className="list" style={{ marginBottom: '1rem' }}>
            {calls.length === 0 && <li className="muted">No calls dropped yet.</li>}
            {calls.map((call) => (
              <li key={call.id} className="list-item">
                <span style={{ fontWeight: 600 }}>{call.id}</span>{' '}
                <span className="muted">
                  · {call.kind} · {call.lines.length} line{call.lines.length === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ul>

          {latestCommitment && (
            <div style={{ marginBottom: '1rem' }}>
              <div className="muted" style={{ fontSize: '0.78rem', marginBottom: '0.3rem' }}>
                Latest commitment captured
              </div>
              <div style={{ fontSize: '0.86rem', marginBottom: '0.4rem' }}>{latestCommitment.text}</div>
              <QuoteClip q={latestCommitment.quote} />
            </div>
          )}

          <div className="row">
            {!call3Dropped && (
              <button type="button" className="btn" onClick={() => postAction('drop-transcript', { id: 'call-3' })}>
                Drop call 3 transcript
              </button>
            )}
            {deal.stage === 'negotiation' && (
              <MagneticButton
                className="bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] border-[var(--brand)]"
                onClick={() => postAction('mark-closed-won', { dealId: deal.id })}
              >
                Mark Closed Won
              </MagneticButton>
            )}
            {deal.stage === 'closed_won' && (
              <div className="pill pill-good">Closed Won — SOW drafting from this deal →</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
