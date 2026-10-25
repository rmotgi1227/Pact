'use client';
import { useState } from 'react';
import { postAction, useAgentState } from '../../lib/useAgentState';
import { AgentDownNotice } from '../../components/AgentDownNotice';
import { verdictText } from '../../components/TicketsPanel';

function ReviewLinks() {
  const state = useAgentState();
  if (!state) return null;
  const shared = state.builds.filter((b) => b.kind !== 'prototype' && b.deployUrl);

  return (
    <div className="card">
      <h3>What's been shared with you</h3>
      <ul className="list">
        {state.prototype && (
          <li className="list-item row">
            <span>Prototype</span>
            <a href={state.prototype.url} target="_blank" rel="noreferrer" className="mono">
              {state.prototype.url}
            </a>
          </li>
        )}
        {shared.map((b) => (
          <li key={b.id} className="list-item row">
            <span>Build {b.prNumber ? `PR #${b.prNumber}` : b.ref.slice(0, 7)}</span>
            <a href={b.deployUrl} target="_blank" rel="noreferrer" className="mono">
              {b.deployUrl}
            </a>
          </li>
        ))}
        {!state.prototype && shared.length === 0 && <li className="muted">Nothing shared yet.</li>}
      </ul>
    </div>
  );
}

function ShareThisBuild() {
  const state = useAgentState();
  const buildId = state?.prototype?.buildId ?? state?.builds.filter((b) => b.status === 'passed').at(-1)?.id;

  return (
    <button type="button" className="btn" disabled={!buildId} onClick={() => buildId && postAction('share-build', { buildId })}>
      Share this build with Dana
    </button>
  );
}

function FileTicket() {
  const state = useAgentState();
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);

  const submit = () => {
    if (!text.trim() || !state) return;
    postAction('file-ticket', { dealId: state.deal.id, text: text.trim() });
    setSent(true);
    setText('');
  };

  return (
    <div className="card">
      <h3>File a ticket</h3>
      <div className="row" style={{ marginBottom: '0.6rem' }}>
        <input
          className="field-text"
          style={{ flex: '1 1 260px' }}
          placeholder="What's wrong?"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setSent(false);
          }}
        />
        <button type="button" className="btn btn-primary" onClick={submit} disabled={!text.trim()}>
          File ticket
        </button>
      </div>
      <div className="row" style={{ gap: '0.6rem' }}>
        <button
          type="button"
          className="btn"
          onClick={() => state && postAction('file-ticket', { dealId: state.deal.id, text: 'Booking broken on my iPad' })}
        >
          Booking broken on my iPad
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => state && postAction('file-ticket', { dealId: state.deal.id, text: 'Can we export to Excel?' })}
        >
          Can we export to Excel?
        </button>
      </div>
      {sent && <div className="muted" style={{ marginTop: '0.6rem', fontSize: '0.84rem' }}>Ticket filed — Pact is checking it now.</div>}
    </div>
  );
}

function TicketStatus() {
  const state = useAgentState();
  const tickets = state?.tickets ?? [];
  if (tickets.length === 0) return null;

  return (
    <div className="card">
      <h3>Your tickets</h3>
      <ul className="list">
        {tickets.map((t) => (
          <li key={t.id} className="list-item">
            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{t.text}</div>
            <div className="muted" style={{ fontSize: '0.84rem', marginTop: '0.3rem' }}>{verdictText(t)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PortalPage() {
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

  return (
    <main className="content">
      <div className="main-col">
        <div className="card">
          <h2>Hertz digital product — Dana's review</h2>
          <div className="muted" style={{ fontSize: '0.84rem' }}>
            Everything your Northstar team has built or shared, and a place to flag issues.
          </div>
        </div>
        <ReviewLinks />
        <div className="card">
          <ShareThisBuild />
        </div>
        <FileTicket />
        <TicketStatus />
      </div>
    </main>
  );
}
