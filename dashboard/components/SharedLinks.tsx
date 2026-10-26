'use client';
import { postAction, useAgentState } from '../lib/useAgentState';

// Everything Pact has shared with the customer: the prototype (and its source repo), plus any engineering build
// shared for review. One card, with the share button inside it.
export function SharedLinks() {
  const state = useAgentState();
  if (!state) return null;
  const shared = state.builds.filter((b) => b.kind !== 'prototype' && b.deployUrl);
  const shareable = state.builds.filter((b) => b.kind !== 'prototype' && (b.status === 'passed' || b.status === 'failed') && !b.deployUrl).at(-1);
  const building = state.sow?.status === 'approved' && !state.prototype;
  // The prototype's own progress (separate from engineering coverage): best tested build, and the round in flight.
  const protos = state.builds.filter((b) => b.kind === 'prototype');
  const green = (b: (typeof protos)[number]) => b.run?.results.filter((r) => r.pass).length ?? -1;
  const bestProto = protos.filter((b) => b.run).sort((a, b) => green(b) - green(a) || b.createdAt - a.createdAt)[0];
  const inFlight = protos.filter((b) => !['passed', 'failed'].includes(b.status)).at(-1);
  const round = (b?: { ref: string }) => b?.ref.match(/^features-r(\d+)$/)?.[1];
  const coding = state.activity.find((a) => a.skill === 'build-features');

  return (
    <div className="card">
      <h3>Shared links</h3>
      {bestProto && (
        <div style={{ fontSize: '0.86rem', marginBottom: '0.6rem' }}>
          Prototype: <b>{green(bestProto)}/{bestProto.run!.results.length}</b> SOW lines passing
          {(coding || inFlight) && (
            <span className="muted">
              {' · '}{coding ? 'Qwen3-Coder is writing code for the failing lines' : `building and testing ${round(inFlight) ? `round ${round(inFlight)}/3` : 'the prototype'}…`}
            </span>
          )}
        </div>
      )}
      <ul className="list">
        {state.prototype ? (
          <li className="list-item row">
            <span>Prototype</span>
            <a href={state.prototype.url} target="_blank" rel="noreferrer" className="mono">{state.prototype.url}</a>
          </li>
        ) : (
          <li className="muted">{building ? 'Pact is building and testing the prototype in a fresh container…' : 'The prototype is built once the SOW is approved.'}</li>
        )}
        {state.prototype?.repoUrl && (
          <li className="list-item row">
            <span>Prototype source</span>
            <a href={state.prototype.repoUrl} target="_blank" rel="noreferrer" className="mono">{state.prototype.repoUrl}</a>
          </li>
        )}
        {shared.map((b) => (
          <li key={b.id} className="list-item row">
            <span>Build {b.prNumber ? `PR #${b.prNumber}` : b.ref.slice(0, 7)}</span>
            <a href={b.deployUrl} target="_blank" rel="noreferrer" className="mono">{b.deployUrl}</a>
          </li>
        ))}
      </ul>
      {shareable && (
        <button type="button" className="btn" style={{ marginTop: '0.6rem' }} onClick={() => postAction('share-build', { buildId: shareable.id })}>
          Share the latest tested build ({shareable.prNumber ? `PR #${shareable.prNumber}` : shareable.ref.slice(0, 7)}) for review
        </button>
      )}
    </div>
  );
}
