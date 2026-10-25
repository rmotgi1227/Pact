'use client';
import { useAgentState } from '../../lib/useAgentState';
import { AgentDownNotice } from '../../components/AgentDownNotice';
import { AgentLogRail } from '../../components/AgentLogRail';
import { CoverageMeter } from '../../components/CoverageMeter';
import { PrototypeCard } from '../../components/PrototypeCard';
import { ProofStrip } from '../../components/ProofStrip';
import { SowPanel } from '../../components/SowPanel';
import { BuildsPanel } from '../../components/BuildsPanel';
import { CrsPanel } from '../../components/CrsPanel';
import { TicketsPanel } from '../../components/TicketsPanel';
import { StatsRow } from '../../components/StatsRow';
import { TestsDonut } from '../../components/TestsDonut';
import { BuildsBarChart } from '../../components/BuildsBarChart';
import { AgentActivityHeatmap } from '../../components/AgentActivityHeatmap';

export default function ConsolePage() {
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
    <>
      <main className="content">
        <div className="main-col">
          <StatsRow />
          <SowPanel />
          <CoverageMeter />
          <PrototypeCard />
          <div className="card">
            <h3>Tests, green vs red</h3>
            <TestsDonut />
          </div>
          <div className="card">
            <h3>Tests per build</h3>
            <BuildsBarChart />
          </div>
          <BuildsPanel />
          <CrsPanel />
          <TicketsPanel />
        </div>
        <div style={{ flex: '1 1 320px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AgentLogRail />
          <div className="card">
            <h3>Agent activity</h3>
            <AgentActivityHeatmap />
          </div>
        </div>
      </main>
      <ProofStrip />
    </>
  );
}
