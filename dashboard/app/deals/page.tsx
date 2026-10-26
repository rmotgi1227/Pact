'use client';
import { postAction, useAgentState } from '../../lib/useAgentState';
import { AgentDownNotice } from '../../components/AgentDownNotice';
import { MagneticButton } from '../../components/ui/magnetic-button';
import { NewCallCard } from '../../components/NewCallCard';

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
  const dropped = (id: string) => calls.some((c) => c.id === id);
  const fromCall = (id: string) => commitments.filter((c) => (c.quotes ?? [c.quote]).some((q) => q.transcriptId === id));

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
            {calls.length === 0 && <li className="muted">No calls yet. Drop the demo calls or add your own below; Pact gets to work when you mark the deal Closed Won.</li>}
            {calls.map((call) => (
              <li key={call.id} className="list-item">
                <details>
                  <summary style={{ cursor: 'pointer' }}>
                    <span style={{ fontWeight: 600 }}>{call.id}</span>{' '}
                    <span className="muted">
                      · {call.kind} · {call.lines.length} line{call.lines.length === 1 ? '' : 's'}
                    </span>
                  </summary>
                  <div style={{ fontSize: '0.84rem', marginTop: '0.4rem' }}>
                    {call.lines.map((l, i) => (
                      <div key={i}><span style={{ fontWeight: 600 }}>{l.speaker}:</span> {l.text}</div>
                    ))}
                  </div>
                </details>
                {call.kind === 'sales' && (
                  <div style={{ fontSize: '0.82rem', marginTop: '0.4rem' }}>
                    {fromCall(call.id).length === 0
                      ? <span className="muted">{deal.stage === 'negotiation' ? 'Pact reads this call when the deal is marked Closed Won.' : 'Reading this call…'}</span>
                      : (
                        <>
                          <div className="muted" style={{ marginBottom: '0.2rem' }}>Commitments Pact captured from this call:</div>
                          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                            {fromCall(call.id).map((c) => (
                              <li key={c.id}>{c.text} <span className="muted" style={{ fontStyle: 'italic' }}>&ldquo;{(c.quotes ?? [c.quote]).find((q) => q.transcriptId === call.id)?.text}&rdquo;</span></li>
                            ))}
                          </ul>
                        </>
                      )}
                  </div>
                )}
              </li>
            ))}
          </ul>


          <div className="row">
            {deal.stage === 'negotiation' && ['call-1', 'call-2', 'call-3'].filter((id) => !dropped(id)).map((id) => (
              <button key={id} type="button" className="btn" onClick={() => postAction('drop-transcript', { id })}>
                Drop {id.replace('-', ' ')}
              </button>
            ))}
            {deal.stage === 'negotiation' && (
              <MagneticButton
                className="bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] border-[var(--brand)]"
                onClick={() => postAction('mark-closed-won', { dealId: deal.id })}
              >
                Mark Closed Won
              </MagneticButton>
            )}
            {deal.stage === 'closed_won' && (
              <a href="/pact" className="pill pill-good" style={{ textDecoration: 'none' }}>Closed Won · Pact is on it: see the SOW, tests and builds →</a>
            )}
          </div>
        </div>

        <NewCallCard />
      </div>
    </main>
  );
}
