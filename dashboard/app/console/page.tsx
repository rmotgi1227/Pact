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
          <SowPanel />
          <CoverageMeter />
          <PrototypeCard />
          <BuildsPanel />
          <CrsPanel />
          <TicketsPanel />
        </div>
        <AgentLogRail />
      </main>
      <ProofStrip />
    </>
  );
}
