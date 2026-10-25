#!/usr/bin/env bash
# R1: core + agent shell. Typecheck passes, the agent seeds hertz-demo, /state has the full shape, no cloud calls.
source "$(dirname "$0")/_lib.sh"
pnpm -s typecheck || fail "typecheck"
ensure_agent
wait_for '.deal.id == "hertz-demo" and .deal.stage == "negotiation"' 30 "deal hertz-demo seeded at negotiation"
wait_for '([.transcripts[].id] | index("call-1") != null and index("call-2") != null)' 30 "calls 1 and 2 saved"
wait_for '(keys | sort) == (["builds","commitments","counter","coverage","crs","deal","logs","prototype","sow","tickets","tests","transcripts"] | sort)' 5 "/state matches StateSnapshot"
wait_for '.counter.cloud == 0' 5 "no cloud AI calls"
