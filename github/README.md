# github/ (goal A3, Aryan)
- `client.ts` exports `github`: getPr, getDiff, createIssue, openPrWithFiles, comment, getHeadSha, mergePr.
- `poll.ts` polls every 5 s and treats PRs already merged at startup as the baseline.
