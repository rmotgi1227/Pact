#!/usr/bin/env bash
# A1: transcript fixtures exist, are valid, and carry the demo lines.
source "$(dirname "$0")/_lib.sh"
for f in call-1 call-2 call-3 status-1; do jq -e '.id and .dealId=="hertz-demo" and (.lines|length>0)' "demo/fixtures/$f.json" >/dev/null || fail "$f.json"; done
jq -e '[.lines[] | select(.t==760 and (.text|test("tablet";"i")))] | length==1' demo/fixtures/call-3.json >/dev/null || fail "call-3 tablet line at t=760"
jq -e '([.lines[]|select(.text|test("fuel";"i"))]|length>0) and ([.lines[]|select(.speaker=="Raj" and (.text|test("sure";"i")))]|length>0)' demo/fixtures/status-1.json >/dev/null || fail "status-1 fuel ask + Raj's sure"
! grep -qi accenture demo/fixtures/*.json || fail "Accenture must not appear in fixtures"
pass "fixtures"
