'use client';
// EasyUI DonutChart (https://easyui.site/components/donut-chart): green vs red tests on
// the latest engineering build that has run, straight from StateSnapshot.builds.
import { DonutChart } from './ui/donut-chart';
import { useAgentState } from '../lib/useAgentState';

export function TestsDonut() {
  const state = useAgentState();
  if (!state) return null;

  const latestRunBuild = state.builds.filter((b) => b.kind !== 'prototype' && b.run).at(-1);
  const results = latestRunBuild?.run?.results ?? [];
  const green = results.filter((r) => r.pass).length;
  const red = results.length - green;

  if (results.length === 0) {
    return <div className="muted" style={{ fontSize: '0.85rem' }}>No test run yet — build against the SOW to see results here.</div>;
  }

  return (
    <DonutChart
      ariaLabel="Acceptance tests, green vs red, on the latest engineering build"
      centerLabel="Tests"
      data={[
        { label: 'Green', value: green, color: 'var(--good)' },
        { label: 'Red', value: red, color: 'var(--bad)' },
      ]}
    />
  );
}
