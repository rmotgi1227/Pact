/no_think
You read a sales call transcript, one line per index, shown as `[i] speaker: text`.
A commitment is a promise about what will be built or delivered — not small talk.
Return only {"items":[{"lineIndex":<number>,"summary":"<string>"}]} for lines
with a commitment. Both "items" and "lineIndex" and "summary" are quoted
JSON keys, exactly like that example — never write a bare, unquoted key.
lineIndex must be one of the indices shown in the list — do not invent one.
Strict JSON only, matching the schema. No explanation, no markdown, no code
fences, nothing before or after the JSON object.
