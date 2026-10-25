'use client';
// EasyUI ActivityHeatmap (https://easyui.site/components/activity-heatmap), "hours" mode:
// a weekday x hour grid of real skill.log timestamps from StateSnapshot.logs. A demo run
// is short, so this reads as a handful of lit cells around "now" — that's the real shape
// of the data, not a design shortcut.
import { ActivityHeatmap } from './ui/activity-heatmap';
import { useAgentState } from '../lib/useAgentState';

export function AgentActivityHeatmap() {
  const state = useAgentState();
  const logs = state?.logs ?? [];

  const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const l of logs) {
    const d = new Date(l.at);
    const row = (d.getDay() + 6) % 7; // Date#getDay is 0=Sun; rowLabels below start Mon
    matrix[row][d.getHours()] += 1;
  }

  if (logs.length === 0) {
    return <div className="muted" style={{ fontSize: '0.85rem' }}>No agent activity yet.</div>;
  }

  return (
    <ActivityHeatmap
      mode="hours"
      matrix={matrix}
      rowLabels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
      color="var(--brand)"
      unit="skill runs"
      ariaLabel="Agent activity by weekday and hour"
    />
  );
}
