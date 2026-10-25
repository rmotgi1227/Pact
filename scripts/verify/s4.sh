#!/usr/bin/env bash
# S4: merging Priya's tablet PR builds a fresh container, tests run, the tablet line goes green, nothing leaks.
source "$(dirname "$0")/_lib.sh"
need docker; need gh; [ -n "${BOOKING_REPO_SLUG:-}" ] || fail "set BOOKING_REPO_SLUG"
ensure_agent
gh pr merge "${TABLET_PR:-34}" -R "$BOOKING_REPO_SLUG" --merge >/dev/null 2>&1 || true   # no-op if already merged
wait_for "[.builds[] | select(.kind==\"pr\" and .prNumber==${TABLET_PR:-34} and (.status==\"passed\" or .status==\"failed\"))] | length >= 1" 300 "tablet PR built and tested"
wait_for '.coverage.green >= .coverage.total - 1 and .coverage.total > 0' 5 "coverage after #34 (all green except any new CR line)"
wait_for '[.builds[] | select(.status=="queued" or .status=="building" or .status=="ready" or .status=="testing")] | length == 0' 300 "no builds still running"
for _ in $(seq 1 30); do [ -z "$(docker ps -aq --filter name='^app-')" ] && break; sleep 2; done   # other builds on this docker host may still be finishing
[ -z "$(docker ps -aq --filter name='^app-')" ] || fail "leftover app containers"; pass "no leaked containers"
