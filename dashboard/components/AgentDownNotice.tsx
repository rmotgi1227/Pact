export function AgentDownNotice() {
  return (
    <div className="agent-down" role="status">
      Agent not running on :4000. Start it with <code className="mono">pnpm agent</code> to see live data here.
    </div>
  );
}
