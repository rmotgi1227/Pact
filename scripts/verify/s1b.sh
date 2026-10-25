#!/usr/bin/env bash
# S1b: Tev1 answers locally and meets the accuracy bar on decide-eval.json.
source "$(dirname "$0")/_lib.sh"
url=$(PACT_MODEL_PROFILE=${PACT_MODEL_PROFILE:-mac-dev} pnpm -s tsx -e "import('@pact/core').then(m=>console.log(m.profile.decide.url))" 2>/dev/null) || fail "profile.decide not defined in core"
curl -sf "$url/models" >/dev/null || fail "decide endpoint not up: $url"; pass "decide endpoint up"
[ -f demo/fixtures/decide-eval.json ] || fail "demo/fixtures/decide-eval.json missing"
pnpm -s tsx infra/decide/eval.ts || fail "decide eval below threshold"; pass "decide eval"
