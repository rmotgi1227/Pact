#!/usr/bin/env bash
# A4: Dana's fuel ask -> CR with her quote and Raj's ack -> approve -> SOW v2 with a new test.
source "$(dirname "$0")/_lib.sh"
ensure_agent
action drop-transcript '{"id":"status-1"}'
wait_for '[.crs[] | select((.quote.text|test("fuel";"i")) and (.ack.text|test("sure";"i")))] | length == 1' 120 "CR with Dana's quote and Raj's sure"
cr=$(state | jq -r '[.crs[] | select(.quote.text|test("fuel";"i"))][0].id')
action approve-cr "{\"crId\":\"$cr\"}"
wait_for '.sow.version == 2 and (.tests | length) == (.sow.lines | length)' 300 "SOW v2 with a test for every line"
