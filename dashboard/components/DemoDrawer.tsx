'use client';
// Hidden fallback controls (Cmd+Shift+D). Every button but the last calls a real
// /actions/<name> the agent already handles, with ids read live off /state — same
// code path as the live demo. demo.replay is the one topic reserved for this drawer.
import { useEffect, useState } from 'react';
import { postAction, postEvent, useAgentState } from '../lib/useAgentState';

const DEAL_ID = 'hertz-demo';

export function DemoDrawer() {
  const [open, setOpen] = useState(false);
  const state = useAgentState();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'd' && (e.metaKey || e.ctrlKey) && e.shiftKey) { // Ctrl too: Linux grabs Super
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open) return null;

  const latestCr = state?.crs.at(-1);
  const prototypeBuildId = state?.prototype?.buildId;
  const latestPassedEngBuild = state?.builds
    .filter((b) => b.kind !== 'prototype' && b.status === 'passed')
    .at(-1);

  return (
    <div className="demo-drawer-backdrop" onClick={() => setOpen(false)} data-testid="demo-drawer-backdrop">
      <div className="demo-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Demo controls">
        <h3>Demo controls</h3>
        <p className="muted" style={{ fontSize: '0.8rem', marginTop: 0 }}>
          Ctrl/Cmd+Shift+D to toggle. Every button posts a real action to the agent.
        </p>

        <button type="button" className="btn" onClick={() => postAction('drop-transcript', { id: 'call-3' })}>
          Drop call 3 transcript
        </button>
        <button type="button" className="btn" onClick={() => postAction('drop-transcript', { id: 'status-1' })}>
          Drop status call (fuel ask)
        </button>
        <button type="button" className="btn btn-primary" onClick={() => postAction('mark-closed-won', { dealId: DEAL_ID })}>
          Mark Closed Won
        </button>
        <button type="button" className="btn btn-primary" onClick={() => postAction('approve-sow', { dealId: DEAL_ID })}>
          Approve SOW
        </button>
        <button
          type="button"
          className="btn btn-good"
          disabled={!latestCr}
          onClick={() => latestCr && postAction('approve-cr', { crId: latestCr.id })}
        >
          Approve CR{latestCr ? ` (${latestCr.id})` : ''}
        </button>
        <button type="button" className="btn" onClick={() => postAction('merge-regression', {})}>
          Merge regression PR
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => postAction('file-ticket', { dealId: DEAL_ID, text: 'iPad tablet layout is broken on the booking page' })}
        >
          File iPad ticket
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => postAction('file-ticket', { dealId: DEAL_ID, text: 'Can we export the booking table to Excel?' })}
        >
          File Excel ticket
        </button>
        <button
          type="button"
          className="btn"
          disabled={!prototypeBuildId}
          onClick={() => prototypeBuildId && postAction('share-build', { buildId: prototypeBuildId })}
        >
          Share prototype with Dana
        </button>
        <button
          type="button"
          className="btn"
          disabled={!latestPassedEngBuild}
          onClick={() => latestPassedEngBuild && postAction('share-build', { buildId: latestPassedEngBuild.id })}
        >
          Share latest passed build with Dana
        </button>
        <button type="button" className="btn" onClick={() => postAction('try-cloud-call', {})}>
          Try a cloud call
        </button>
        <button type="button" className="btn" onClick={() => postEvent('demo.replay', { runId: 'hertz-happy-path' })}>
          Load cached result
        </button>

        <button type="button" className="btn" style={{ marginTop: 'auto' }} onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
    </div>
  );
}
