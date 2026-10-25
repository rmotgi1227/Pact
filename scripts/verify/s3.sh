#!/usr/bin/env bash
# S3: one Playwright spec per SOW line, tablet spec checks 768 and 1024.
source "$(dirname "$0")/_lib.sh"
ensure_agent
wait_for '(.tests | length) > 0 and (.tests | length) == (.sow.lines | length)' 300 "a test for every SOW line"
for f in $(state | jq -r '.tests[].file'); do [ -f "$f" ] && grep -q "@playwright/test" "$f" || fail "bad spec $f"; done
grep -l "768" specs/hertz-demo/*.spec.ts | xargs grep -l "1024" >/dev/null || fail "no tablet spec at 768/1024"
pass "specs on disk"
