#!/usr/bin/env bash
# S1 verify: the 6 smoke checks from build-plan.md Phase B §4.4, profile-aware (gb10 | mac-dev).
# GB10-only checks print SKIP on mac-dev. Anything else that isn't up is a FAIL.
set -uo pipefail
cd "$(dirname "$0")/../.."
P=${PACT_MODEL_PROFILE:-mac-dev}; AGENT=${AGENT:-http://127.0.0.1:4000}; DASH=${DASH:-http://127.0.0.1:3000}
fail=0
check() { local name=$1; shift; printf '[%s] ' "$name"; if out=$("$@" 2>&1); then echo "OK ${out}"; else echo "FAIL ${out}"; fail=1; fi; }
skip() { echo "[$1] SKIP $2"; }

# Model tags and URLs straight from core, so smoke and the agent can't disagree.
eval "$(PACT_MODEL_PROFILE=$P PACT_DB=/tmp/pact-smoke.db pnpm -s tsx -e "import('@pact/core').then(({profile:p})=>console.log(
  'LLM='+p.url+' REASONING='+p.reasoning+' CODING='+p.coding+' EMBED='+p.embed+' DECIDE_URL='+p.decide.url+' DECIDE='+p.decide.model))")"
[ -n "${LLM:-}" ] || { echo "FAIL could not read profile from @pact/core"; exit 1; }

answers() { # $1 model: one real token from Ollama
  curl -fsS -m 120 "$LLM/api/chat" -d "{\"model\":\"$1\",\"stream\":false,\"think\":false,\"messages\":[{\"role\":\"user\",\"content\":\"Say OK\"}],\"options\":{\"num_predict\":4}}" \
    | jq -e '.message.content | length > 0' >/dev/null && echo "$1"; }
embeds() { curl -fsS -m 60 "$LLM/api/embed" -d "{\"model\":\"$EMBED\",\"input\":[\"hi\"]}" | jq -e '.embeddings[0] | length > 0' >/dev/null && echo "$EMBED"; }
decides() { # core's real ctx.decide, exactly as the agent calls it
  PACT_MODEL_PROFILE=$P PACT_DB=/tmp/pact-smoke.db pnpm -s tsx -e "import('@pact/core').then(async ({makeDecide})=>{
    const d=await makeDecide('smoke').choose({state:'Returns are allowed within 30 days. The purchase was 12 days ago.',
      question:'Is the return within the window?',options:[{key:'yes',label:'Yes'},{key:'no',label:'No'}]});
    console.log(JSON.stringify(d)); process.exit(d.key==='yes'?0:1)})"; }
isolated() { # a fresh container with no network starts in under 60 s
  local t0=$SECONDS; docker run --rm --network=none node:24-slim node -e "fetch('https://example.com').then(()=>process.exit(1)).catch(()=>process.exit(0))" \
    && [ $((SECONDS - t0)) -lt 60 ] && echo "no egress, $((SECONDS - t0))s"; }
testnet() { # the per-build network shape: internal, so the runner and app reach only each other
  docker network create --internal pact-smoke >/dev/null && docker network inspect pact-smoke | jq -e '.[0].Internal' >/dev/null
  local r=$?; docker network rm pact-smoke >/dev/null; [ $r -eq 0 ] && echo internal; }
deployed() {
  local url=${PACT_LAST_DEPLOY_URL:-$(curl -fsS "$AGENT/state" 2>/dev/null | jq -r '[.builds[] | .deployUrl // empty][-1] // empty')}
  [ -n "$url" ] || { echo "no deployed build yet (run s5 or set PACT_LAST_DEPLOY_URL)"; return 1; }
  curl -fsSL -m 30 "$url" -o /dev/null && echo "$url"; }
egress() {
  local before after; before=$(curl -fsS "$AGENT/state" | jq .counter.blocked) || return 1
  curl -fsS -X POST "$AGENT/actions/try-cloud-call" -o /dev/null || return 1; sleep 4
  after=$(curl -fsS "$AGENT/state" | jq .counter.blocked); [ "$after" -gt "$before" ] && echo "blocked $before -> $after"; }

echo "profile: $P"
check models-reasoning answers "$REASONING"
[ "$CODING" != "$REASONING" ] && check models-coding answers "$CODING"
check models-embed embeds
check models-decide decides
check dashboard curl -fsS -m 10 "$DASH/deals" -o /dev/null
check build-isolated isolated
check test-net testnet
if [ -n "${VERCEL_DEPLOY_TOKEN:-}${PACT_LAST_DEPLOY_URL:-}" ]; then check vercel-deploy deployed; else skip vercel-deploy "no VERCEL_DEPLOY_TOKEN"; fi
if [ "$P" = gb10 ]; then check egress-block egress; else skip egress-block "GB10 only (OpenShell / nft)"; fi
exit $fail
