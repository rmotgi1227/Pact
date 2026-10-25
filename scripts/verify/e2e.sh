#!/usr/bin/env bash
# R5: the whole demo.md run, in order, on a fresh store.
source "$(dirname "$0")/_lib.sh"
rm -f "${PACT_DB:-pact.db}"*; ensure_agent
bash scripts/verify/r3.sh && bash scripts/verify/r4.sh && bash scripts/verify/s3.sh && bash scripts/verify/s4.sh \
  && bash scripts/verify/a4.sh && bash scripts/verify/a5.sh && bash scripts/verify/s2.sh || fail "demo run"
pass "full demo run"
