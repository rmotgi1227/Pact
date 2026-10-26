'use client';
import { useState } from 'react';
import { postAction, useAgentState } from '../lib/useAgentState';

// Add a call live: type it, or describe it and let local Qwen write it. Either way the agent processes it
// exactly like the fixture calls (commitments on sales calls; scope checks and change requests on status calls).
export function NewCallCard() {
  const state = useAgentState();
  const [kind, setKind] = useState<'sales' | 'status'>('sales');
  const [mode, setMode] = useState<'write' | 'describe'>('describe');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; msg: string } | null>(null);
  const sowApproved = state?.sow?.status === 'approved';

  async function submit() {
    setBusy(true);
    setNote(null);
    const body = mode === 'write' ? { kind, text } : { kind, scenario: text };
    const res = await postAction('add-transcript', body).catch(() => null);
    const out = res ? await res.json().catch(() => ({})) : { error: 'agent not reachable' };
    setBusy(false);
    if (res?.ok) {
      setText('');
      setNote({ ok: true, msg: mode === 'write' ? 'Call added. Watch the agent log.' : 'Qwen is writing the call (about 20–60 s). It appears under Calls when done.' });
    } else setNote({ ok: false, msg: out.error ?? `failed (${res?.status})` });
  }

  const placeholder = mode === 'write'
    ? 'Dana: Can we get a loyalty-points badge on every result card?\nRaj: Sure, we can add that.'
    : kind === 'sales'
      ? 'e.g. Sam promises Dana a price-match banner on the results page and Spanish language support'
      : 'e.g. Dana asks for an SMS reminder the day before pickup; Raj agrees without checking the SOW';

  return (
    <div className="card">
      <h3>New call</h3>
      <div className="muted" style={{ fontSize: '0.82rem', marginBottom: '0.6rem' }}>
        Add a call nobody scripted. Pact handles it like any other: sales calls are read for commitments when the deal
        is marked Closed Won; status calls (after closing) are checked against the SOW right away.
      </div>
      <div className="row" style={{ marginBottom: '0.6rem', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button type="button" className={`btn ${kind === 'sales' ? 'btn-primary' : ''}`} onClick={() => setKind('sales')}>Sales call</button>
        <button type="button" className={`btn ${kind === 'status' ? 'btn-primary' : ''}`} onClick={() => setKind('status')}
          disabled={!sowApproved} title={sowApproved ? '' : 'Approve the SOW first'}>Status call</button>
        <span style={{ width: '1rem' }} />
        <button type="button" className={`btn ${mode === 'describe' ? 'btn-primary' : ''}`} onClick={() => setMode('describe')}>Describe it (Qwen writes)</button>
        <button type="button" className={`btn ${mode === 'write' ? 'btn-primary' : ''}`} onClick={() => setMode('write')}>Write it</button>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder}
        rows={mode === 'write' ? 6 : 3}
        style={{ width: '100%', fontFamily: mode === 'write' ? 'var(--font-mono, monospace)' : 'inherit', fontSize: '0.86rem',
          padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface, transparent)', color: 'inherit' }} />
      <div className="row" style={{ marginTop: '0.6rem', alignItems: 'center', gap: '0.6rem' }}>
        <button type="button" className="btn btn-primary" disabled={busy || !text.trim() || (kind === 'status' && !sowApproved)} onClick={submit}>
          {busy ? 'Sending…' : mode === 'write' ? 'Add call' : 'Write the call with Qwen'}
        </button>
        {note && <span style={{ fontSize: '0.82rem', color: note.ok ? 'var(--good)' : 'var(--bad, #b42318)' }}>{note.msg}</span>}
      </div>
    </div>
  );
}
