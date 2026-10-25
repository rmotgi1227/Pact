'use client';
// EasyUI StatCard/StatGrid (https://easyui.site/components/stat-card), fed only by
// StateSnapshot — no numbers computed here, only read and formatted. The agent keeps no
// historical series, so the sparkline and delta are both flat at the current value
// rather than implying a trend the data doesn't support.
import { StatCard, StatGrid } from './ui/stat-card';
import { useAgentState } from '../lib/useAgentState';

export function StatsRow() {
  const state = useAgentState();
  if (!state) return null;

  const { coverage, counter, crs } = state;
  const coveragePct = coverage.total > 0 ? Math.round((coverage.green / coverage.total) * 100) : 0;

  return (
    <StatGrid>
      <StatCard
        label="SOW coverage"
        value={coveragePct}
        trend={[coveragePct, coveragePct]}
        format={(n) => `${Math.round(n)}%`}
        period={`${coverage.green}/${coverage.total} SOW lines green`}
        color="var(--brand)"
      />
      <StatCard
        label="Calls to cloud AI"
        value={counter.cloud}
        trend={[counter.cloud, counter.cloud]}
        goodWhen="down"
        period="should stay at 0"
        color="var(--bad)"
      />
      <StatCard
        label="Blocked by OpenShell"
        value={counter.blocked}
        trend={[counter.blocked, counter.blocked]}
        period="cloud calls caught and refused"
        color="var(--good)"
      />
      <StatCard
        label="Scope drift caught"
        value={crs.length}
        trend={[crs.length, crs.length]}
        period="requests outside the SOW"
        color="var(--warn)"
      />
    </StatGrid>
  );
}
