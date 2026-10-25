#!/usr/bin/env bash
# A3: after SOW approval, one GitHub issue per SOW line and a baseline main build.
source "$(dirname "$0")/_lib.sh"
need gh; [ -n "${BOOKING_REPO_SLUG:-}" ] || fail "set BOOKING_REPO_SLUG"
ensure_agent
wait_for '.sow.status == "approved"' 5 "SOW approved (run r3 first)"
n=$(state | jq '.sow.lines | length')
for _ in $(seq 1 60); do c=$(gh issue list -R "$BOOKING_REPO_SLUG" --search "SOW §" --json number -q length); [ "$c" -ge "$n" ] && break; sleep 2; done
[ "$c" -ge "$n" ] || fail "expected $n SOW issues, found $c"; pass "$c SOW issues"
wait_for '[.builds[] | select(.kind=="main")] | length >= 1' 120 "baseline main build requested"
