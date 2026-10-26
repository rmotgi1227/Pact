#!/usr/bin/env bash
# A2: calls 1-3 dropped, deal marked Closed Won (Pact reads calls when the deal closes) -> a commitment whose
# quote is exactly the call-3 tablet line.
source "$(dirname "$0")/_lib.sh"
ensure_agent
want=$(jq -r '.lines[] | select(.t==760) | .text' demo/fixtures/call-3.json)
for id in call-1 call-2 call-3; do action drop-transcript "{\"id\":\"$id\"}"; done
action mark-closed-won '{"dealId":"hertz-demo"}'
wait_for "[.commitments[] | select(.quote.text == $(jq -Rn --arg s "$want" '$s'))] | length == 1" 300 "tablet commitment with exact quote"
