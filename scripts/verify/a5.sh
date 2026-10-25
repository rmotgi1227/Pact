#!/usr/bin/env bash
# A5: merge the regression, file the iPad ticket -> warranty, covered by the tablet line.
source "$(dirname "$0")/_lib.sh"
ensure_agent
action merge-regression
action file-ticket '{"text":"Booking broken on my iPad"}'
wait_for '[.tickets[] | select(.status=="triaged" and .verdict=="warranty")] | length >= 1' 600 "iPad ticket -> warranty"
wait_for '[.tickets[] | select(.verdict=="warranty" and .assignee != null)] | length >= 1' 5 "warranty ticket routed to whoever made that test pass"
line=$(state | jq -r '[.tickets[] | select(.verdict=="warranty")][0].sowLineId')
state | jq -e --arg l "$line" '[.sow.lines[] | select(.id==$l and (.criterion|test("768")))] | length==1' >/dev/null || fail "warranty points at the tablet line"
action file-ticket '{"text":"Can we export bookings to Excel?"}'
wait_for '[.tickets[] | select(.verdict=="change_request")] | length >= 1' 120 "Excel ticket -> change request"
