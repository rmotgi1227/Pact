#!/usr/bin/env bash
# R5: the whole demo.md run, in order, on fresh state (demo booking repo reset, empty store).
source "$(dirname "$0")/_lib.sh"
[ -z "${PACT_SANDBOX:-}" ] && { pkill -f "tsx.*agent/main.ts" 2>/dev/null || true; sleep 1; }
bash scripts/reset-booking-repo.sh >/tmp/pact-reset.log 2>&1 || fail "booking repo reset (see /tmp/pact-reset.log)"
set -a; . ./.env; set +a   # fresh PR numbers from the reset
if [ -n "${PACT_SANDBOX:-}" ]; then   # agent inside NemoClaw (infra/sandbox): restart builder + agent on an empty store
  bash infra/sandbox/up.sh --fresh >/tmp/pact-up.log 2>&1 || fail "sandbox restart (see /tmp/pact-up.log)"  # builder re-reads .env too
else
  rm -f "${PACT_DB:-pact.db}" "${PACT_DB:-pact.db}-shm" "${PACT_DB:-pact.db}-wal"; rm -rf specs/hertz-demo
fi
ensure_agent
for g in r3 r4 s3 s4 a4 a5; do echo "== $g"; bash "scripts/verify/$g.sh" || fail "demo run stopped at $g"; done
if [ "${PACT_MODEL_PROFILE:-}" = gb10 ]; then bash scripts/verify/s2.sh || fail "demo run stopped at s2"
else echo "SKIP: s2 (cloud-call block) runs only on the GB10 inside OpenShell"; fi
pass "full demo run"
