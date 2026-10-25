'use client';
import { useAgentState } from '../lib/useAgentState';

export function CoverageMeter() {
  const state = useAgentState();
  if (!state) return null;
  const { green, total } = state.coverage;
  const pct = total > 0 ? Math.round((green / total) * 100) : 0;

  return (
    <div className="coverage-meter">
      <div className="coverage-number">
        {green}/{total}
      </div>
      <div style={{ flex: '1 1 220px', minWidth: 200 }}>
        <div className="muted" style={{ fontSize: '0.84rem', marginBottom: '0.4rem' }}>
          SOW lines covered by the latest engineering build
        </div>
        <div className="coverage-bar-track">
          <div className="coverage-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
