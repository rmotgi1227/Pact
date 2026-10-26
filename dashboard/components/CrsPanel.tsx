'use client';
import { postAction, useAgentState } from '../lib/useAgentState';
import { MagneticButton } from './ui/magnetic-button';

export function CrsPanel() {
  const state = useAgentState();
  const crs = state?.crs ?? [];

  return (
    <div className="card">
      <h3>Change requests</h3>
      {crs.length === 0 && <div className="muted">Nothing outside the SOW has come up yet.</div>}
      <ul className="list">
        {crs.map((cr) => (
          <li key={cr.id} className="list-item" style={{ borderColor: cr.needsReview ? 'var(--warn-border)' : undefined }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
              {cr.id} — {cr.request}
            </div>
            <div className="muted" style={{ fontSize: '0.84rem', marginBottom: '0.3rem' }}>
              Quote: <span style={{ fontStyle: 'italic' }}>&ldquo;{cr.quote.text}&rdquo;</span>
            </div>
            {cr.ack && (
              <div className="muted" style={{ fontSize: '0.84rem', marginBottom: '0.3rem' }}>
                Ack: <span style={{ fontStyle: 'italic' }}>&ldquo;{cr.ack.text}&rdquo;</span>
              </div>
            )}
            <div className="muted" style={{ fontSize: '0.84rem', marginBottom: '0.5rem' }}>
              Est. effort: {cr.estimate ?? '[needs estimate]'}
              {cr.needsReview ? ' · needs Maya’s call' : ''}
            </div>

            {cr.status === 'draft' && (
              <MagneticButton
                className="bg-[var(--good-bg)] text-[var(--good)] border-[var(--good-border)] hover:bg-[var(--good-border)]"
                onClick={() => postAction('approve-cr', { crId: cr.id })}
              >
                Approve (Maya)
              </MagneticButton>
            )}
            {cr.status === 'approved' && (
              <div className="pill pill-good">Approved by Maya — new SOW version, pending build</div>
            )}
            {cr.status === 'rejected' && <div className="pill pill-bad">Rejected</div>}

            {cr.approvalRequested && (
              <div className="muted" style={{ fontSize: '0.84rem', marginTop: '0.4rem' }}>
                {'to' in cr.approvalRequested
                  ? `Approve / deny request emailed to ${cr.approvalRequested.to}`
                  : `Approval email failed: ${cr.approvalRequested.error}`}
              </div>
            )}
            {cr.changeOrder && (
              <details style={{ marginTop: '0.5rem' }}>
                <summary style={{ fontSize: '0.86rem', cursor: 'pointer' }}>
                  {cr.changeOrder.number}: {cr.changeOrder.subject}
                  {' · '}
                  {cr.changeOrder.emailedAt
                    ? `emailed to ${cr.changeOrder.emailedTo}`
                    : cr.changeOrder.emailError ? 'email failed' : 'drafted, not emailed'}
                </summary>
                <pre className="mono" style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', marginTop: '0.4rem' }}>
                  {cr.changeOrder.body}
                </pre>
              </details>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
