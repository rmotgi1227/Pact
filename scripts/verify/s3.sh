#!/usr/bin/env bash
# S3: one Playwright spec per SOW line, tablet spec checks 768 and 1024.
source "$(dirname "$0")/_lib.sh"
ensure_agent
wait_for '(.tests | length) > 0 and (.tests | length) == (.sow.lines | length)' 300 "a test for every SOW line"
tablet=0
for f in $(state | jq -r '.tests[].file'); do
  src=$(readf "$f") && grep -q "@playwright/test" <<<"$src" || fail "bad spec $f"
  grep -q 768 <<<"$src" && grep -q 1024 <<<"$src" && tablet=1
done
[ $tablet = 1 ] || fail "no tablet spec at 768/1024"
pass "specs on disk"
