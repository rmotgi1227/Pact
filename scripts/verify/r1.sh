#!/usr/bin/env bash
# R1: core + agent shell. Typecheck passes, the agent starts hertz-demo at negotiation (no calls: the operator adds
# them), /state has the full shape, no cloud calls.
source "$(dirname "$0")/_lib.sh"
pnpm -s typecheck || fail "typecheck"
ensure_agent
wait_for '.deal.id == "hertz-demo" and .deal.stage == "negotiation"' 30 "deal hertz-demo seeded at negotiation"
wait_for '(keys | sort) == (["activity","builds","commitments","counter","coverage","crs","deal","logs","prototype","sow","tickets","tests","transcripts"] | sort)' 5 "/state matches StateSnapshot"
wait_for '.counter.cloud == 0' 5 "no cloud AI calls"
