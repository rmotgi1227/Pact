#!/usr/bin/env bash
# A2: drop call 3 -> a commitment whose quote is exactly the tablet line.
source "$(dirname "$0")/_lib.sh"
ensure_agent
want=$(jq -r '.lines[] | select(.t==760) | .text' demo/fixtures/call-3.json)
action drop-transcript '{"id":"call-3"}'
wait_for "[.commitments[] | select(.quote.text == $(jq -Rn --arg s "$want" '$s'))] | length == 1" 120 "tablet commitment with exact quote"
