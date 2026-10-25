#!/usr/bin/env bash
# S2: on the GB10, a cloud call is blocked and counted; cloud stays 0.
source "$(dirname "$0")/_lib.sh"
[ "${PACT_MODEL_PROFILE:-}" = gb10 ] || fail "run on the GB10 with PACT_MODEL_PROFILE=gb10"
ensure_agent
before=$(state | jq .counter.blocked)
action try-cloud-call
wait_for ".counter.blocked > $before and .counter.cloud == 0" 15 "cloud call blocked and counted"
