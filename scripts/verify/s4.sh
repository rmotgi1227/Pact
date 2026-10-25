#!/usr/bin/env bash
# S4: merging Priya's tablet PR builds a fresh container, tests run, the tablet line goes green, nothing leaks.
source "$(dirname "$0")/_lib.sh"
need docker; need gh; [ -n "${BOOKING_REPO_SLUG:-}" ] || fail "set BOOKING_REPO_SLUG"
ensure_agent
gh pr merge 34 -R "$BOOKING_REPO_SLUG" --merge >/dev/null 2>&1 || true   # no-op if already merged
wait_for '[.builds[] | select(.kind=="pr" and .prNumber==34 and (.status=="passed" or .status=="failed"))] | length >= 1' 300 "PR #34 built and tested"
wait_for '.coverage.green >= .coverage.total - 1 and .coverage.total > 0' 5 "coverage after #34 (all green except any new CR line)"
[ -z "$(docker ps -aq --filter name='^app-')" ] || fail "leftover app containers"; pass "no leaked containers"
