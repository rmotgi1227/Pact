'use client';
// EasyUI BarChart (https://easyui.site/components/bar-chart): passed vs failed tests per
// engineering build, straight from StateSnapshot.builds — the same data BuildsPanel lists.
import { BarChart } from './ui/bar-chart';
import { useAgentState } from '../lib/useAgentState';

export function BuildsBarChart() {
  const state = useAgentState();
  if (!state) return null;

  const engBuilds = state.builds.filter((b) => b.kind !== 'prototype' && b.run);
  if (engBuilds.length === 0) {
    return <div className="muted" style={{ fontSize: '0.85rem' }}>No tested builds yet.</div>;
  }

  const data = engBuilds.map((b) => {
    const results = b.run?.results ?? [];
    return {
      label: b.prNumber ? `PR #${b.prNumber}` : b.ref.slice(0, 7),
      passed: results.filter((r) => r.pass).length,
      failed: results.filter((r) => !r.pass).length,
    };
  });

  return (
    <BarChart
      ariaLabel="Tests passed and failed per engineering build"
      variant="stacked"
      height={220}
      data={data}
      series={[
        { key: 'passed', label: 'Passed', color: 'var(--good)' },
        { key: 'failed', label: 'Failed', color: 'var(--bad)' },
      ]}
    />
  );
}
