#!/usr/bin/env bash
# R3: Closed Won -> SOW with the tablet criterion, every commitment covered, approve works.
source "$(dirname "$0")/_lib.sh"
ensure_agent
for id in call-1 call-2 call-3; do action drop-transcript "{\"id\":\"$id\"}"; done
action mark-closed-won '{"dealId":"hertz-demo"}' # Pact reads the calls when the deal closes
wait_for '[.commitments[] | select(.quote.transcriptId=="call-3")] | length > 0' 300 "call-3 commitments captured at Closed Won"
wait_for '(.sow.lines | length) >= 6' 300 "SOW drafted"
wait_for '[.sow.lines[] | select((.criterion|test("768")) and (.criterion|test("1024")))] | length >= 1' 5 "tablet criterion 768-1024px present"
wait_for '([.commitments[].id] - [.sow.lines[].commitmentIds[]]) | length == 0' 5 "every commitment is on a SOW line"
action approve-sow '{"dealId":"hertz-demo"}'
wait_for '.sow.status == "approved"' 30 "SOW approved"
