#!/usr/bin/env bash
# Runs Pact the way build-plan.md draws it, on the GB10:
#   - the agent runs inside the NemoClaw sandbox, so OpenShell decides its egress (S2),
#   - OpenClaw (Qwen3.6-35B-A3B) picks and starts Pact's skills (agent/openclaw.ts),
#   - Docker builds and the booking repo clone run on the host (builder/host.ts); the agent deploys to Vercel itself.
# Prereq: `nemoclaw onboard` with local Ollama and `--host-mount <repo>:/sandbox/pact` (infra/sandbox/README.md).
# Run from a shell that can use docker (`sg docker -c "bash infra/sandbox/up.sh"` until you re-login).
set -euo pipefail
cd "$(dirname "$0")/../.."
SB=${PACT_SANDBOX:-my-assistant}
STATE=${PACT_STATE_DIR:-$HOME/.pact}
export NEMOCLAW_NO_AUTO_AUDIT_LOGS=1 NODE_NO_WARNINGS=1
mkdir -p "$STATE" && chmod 700 "$STATE"
sx() { nemoclaw "$SB" exec --no-tty -- sh -c "$1" 2>&1 | grep -v OCSF || true; }

echo "1/5 egress policy"
BRIDGE=$(sx 'getent hosts host.openshell.internal' | awk '{print $1; exit}')
[ -n "$BRIDGE" ] || { echo "cannot resolve host.openshell.internal in $SB"; exit 1; }
# NemoClaw's baseline includes hosted-AI routes (NVIDIA API, ClawHub, openclaw.ai). Pact allows no cloud AI.
for k in nvidia clawhub openclaw_api; do nemoclaw "$SB" policy exclude "$k" --yes >/dev/null 2>&1 || true; done
bins=(--binary /usr/local/bin/node --binary /usr/bin/node)
# GitHub (Octokit: issues, PR comments, polling) and Vercel (the agent deploys tested builds itself), plus the
# host build service and NemoClaw's Ollama auth proxy (local models).
openshell policy update "$SB" --rule-name pact_github --add-endpoint api.github.com:443:full "${bins[@]}" --wait >/dev/null
openshell policy update "$SB" --rule-name pact_vercel --add-endpoint api.vercel.com:443:full "${bins[@]}" --wait >/dev/null
# Approval requests and change orders are emailed through Resend's API (skills/mail.ts).
openshell policy update "$SB" --rule-name pact_resend --add-endpoint api.resend.com:443:full "${bins[@]}" --wait >/dev/null
openshell policy update "$SB" --rule-name pact_host_4100 \
  --add-endpoint "host.openshell.internal:4100:full:rest:enforce:allowed-ip=$BRIDGE/32" "${bins[@]}" --wait >/dev/null
openshell policy update "$SB" --rule-name pact_host_11435 \
  --add-endpoint 'host.openshell.internal:11435:full:rest:enforce:allowed-ip=10.0.0.0/8,allowed-ip=172.16.0.0/12,allowed-ip=192.168.0.0/16' \
  "${bins[@]}" --wait >/dev/null

echo "2/5 OpenClaw skills"
pnpm -s tsx infra/sandbox/install-skills.ts "$SB"

echo "3/5 host build service"
[ -f "$STATE/builder.pid" ] && kill "$(cat "$STATE/builder.pid")" 2>/dev/null || true
umask 077; openssl rand -hex 24 >"$STATE/builder.token"
PACT_BUILDER_HOST=$BRIDGE PACT_BUILDER_TOKEN=$(cat "$STATE/builder.token") \
  nohup node_modules/.bin/tsx --env-file-if-exists=.env builder/host.ts >"$STATE/builder.log" 2>&1 &
echo $! >"$STATE/builder.pid"

echo "4/5 forward :4000 to the host"
openshell forward stop 4000 "$SB" >/dev/null 2>&1 || true
openshell forward start -d 4000 "$SB" >/dev/null 2>&1 # its ssh child must not hold our stdout

echo "5/5 agent inside $SB"
bash infra/sandbox/agent.sh "$@"
echo "pact agent up in $SB (http://localhost:4000), builder on $BRIDGE:4100. Dashboard: pnpm dashboard"
