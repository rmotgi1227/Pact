#!/usr/bin/env bash
# R2: dashboard builds and its three screens serve.
source "$(dirname "$0")/_lib.sh"
pnpm -C dashboard -s build || fail "dashboard build"
ensure_agent
(pnpm -C dashboard -s start >/tmp/pact-dashboard.log 2>&1 &) ; sleep 4
for p in deals pact; do curl -sf "http://localhost:3000/$p" | grep -qi "dramatized replay" || fail "/$p missing or no replay banner"; pass "/$p serves"; done
