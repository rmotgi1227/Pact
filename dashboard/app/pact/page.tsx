'use client';
import { useAgentState } from '../../lib/useAgentState';
import { AgentDownNotice } from '../../components/AgentDownNotice';
import { AgentLogRail } from '../../components/AgentLogRail';
import { CoverageMeter } from '../../components/CoverageMeter';
import { SharedLinks } from '../../components/SharedLinks';
import { ProofStrip } from '../../components/ProofStrip';
import { SowPanel } from '../../components/SowPanel';
import { BuildsPanel } from '../../components/BuildsPanel';
import { CrsPanel } from '../../components/CrsPanel';
import { TicketsPanel } from '../../components/TicketsPanel';
import { StatsRow } from '../../components/StatsRow';
import { TestsDonut } from '../../components/TestsDonut';
import { BuildsBarChart } from '../../components/BuildsBarChart';
import { AgentActivityHeatmap } from '../../components/AgentActivityHeatmap';

// Everything Pact does for the deal, on one page: SOW, tests and builds, the shared prototype, change requests,
// and tickets. The deal itself (calls, Closed Won) lives on /deals.
export default function PactPage() {
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
          <SharedLinks />
          <div className="card">
            <h3>Tests</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>
              <div style={{ flex: '0 1 220px' }}><TestsDonut /></div>
              <div style={{ flex: '1 1 320px' }}><BuildsBarChart /></div>
            </div>
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
