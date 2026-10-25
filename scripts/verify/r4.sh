#!/usr/bin/env bash
# R4: approved SOW -> prototype built in a container, all tests green, deployed, link opens.
source "$(dirname "$0")/_lib.sh"
ensure_agent
wait_for '.sow.status == "approved"' 5 "SOW approved (run r3 first)"
wait_for '.prototype.url != null' 600 "prototype deployed"
url=$(state | jq -r .prototype.url); curl -sfL "$url" >/dev/null || fail "prototype url does not open: $url"; pass "prototype opens: $url"
wait_for '[.builds[] | select(.kind=="prototype" and .status=="passed")] | length >= 1' 5 "prototype build passed its tests"
