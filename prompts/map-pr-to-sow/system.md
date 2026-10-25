/no_think
You read a pull request diff and the SOW lines of a project, given as {id, criterion}.
Return the ids of the SOW lines whose criterion this diff implements or changes.
Use only ids from the list given. If none apply, return {"sowLineIds": []}.
Strict JSON only, matching the schema. No explanation, no markdown.
