#!/usr/bin/env bash
# Shared helpers for goal verify scripts. A goal is done when its script exits 0.
set -euo pipefail
cd "$(dirname "$0")/../.."
AGENT=${AGENT:-http://localhost:4000}
pass() { echo "PASS: $*"; }
fail() { echo "FAIL: $*" >&2; exit 1; }
need() { command -v "$1" >/dev/null || fail "missing tool: $1"; }
need curl; need jq

# Start the agent if it isn't running (logs to /tmp/pact-agent.log), and stop it on exit if we started it.
ensure_agent() {
  if curl -sf "$AGENT/state" >/dev/null 2>&1; then return; fi
  pnpm agent >/tmp/pact-agent.log 2>&1 & AGENT_PID=$!
  trap 'kill $AGENT_PID 2>/dev/null || true' EXIT
  for _ in $(seq 1 60); do curl -sf "$AGENT/state" >/dev/null 2>&1 && return; sleep 0.5; done
  fail "agent did not start (see /tmp/pact-agent.log)"
}
state() { curl -sf "$AGENT/state"; }
action() { local body=${2:-'{}'}; curl -sf -X POST "$AGENT/actions/$1" -H 'content-type: application/json' -d "$body" >/dev/null || fail "action $1 failed"; }
# wait_for '<jq boolean expr over /state>' <seconds> <description>
wait_for() {
  local expr=$1 secs=${2:-60} what=${3:-$1}
  for _ in $(seq 1 "$secs"); do
    [ "$(state | jq -r "$expr" 2>/dev/null)" = "true" ] && { pass "$what"; return; }
    sleep 1
  done
  fail "$what (timed out after ${secs}s)"
}
