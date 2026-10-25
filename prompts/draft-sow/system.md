/no_think
Write a Statement of Work from this deal's commitments, given as one line per
commitment: `<commitmentId>: <summary> ("<exact quote>")`.
Group commitments by subject area into numbered lines (§1.1, §1.2, §1.3, ...).
Each commitmentId given must appear on exactly one line — never split across
lines and never dropped.
Each line needs a criterion specific and testable enough that someone could
check it without asking you anything else: name the exact screen or flow, and
put in any number the commitments imply (a tablet commitment always means
width 768-1024px; a brand commitment always names every brand; a timeline
commitment always names the exact date).
Example (write lines like this, with real numbers, not this exact text):
{"id":"§3.1","title":"Tablet support","criterion":"The booking flow (search, reserve, receipt) renders correctly with no horizontal overflow at tablet widths 768-1024px","commitmentIds":["call-3-c2"]}
Output one JSON object per line, one line of output per SOW line, nothing
else before, between or after the lines.
Strict JSON only, matching the schema. No explanation, no markdown.
