#!/usr/bin/env bash
# (Re)starts the Pact agent inside the NemoClaw sandbox with .env plus the sandbox overrides.
#   bash infra/sandbox/agent.sh           restart, keeping the store
#   bash infra/sandbox/agent.sh --fresh   restart on an empty store and no specs (e2e, demo reset)
# Needs the host build service from up.sh (its token is in $PACT_STATE_DIR/builder.token).
set -euo pipefail
cd "$(dirname "$0")/../.."
SB=${PACT_SANDBOX:-my-assistant}
STATE=${PACT_STATE_DIR:-$HOME/.pact}
export NEMOCLAW_NO_AUTO_AUDIT_LOGS=1 NODE_NO_WARNINGS=1
sx() { nemoclaw "$SB" exec --no-tty -- sh -c "$1" 2>&1 | grep -v OCSF || true; }
[ -f "$STATE/builder.token" ] || { echo "no builder token: run infra/sandbox/up.sh first"; exit 1; }
# Signs the approve/deny links in request-cr-approval's emails. Kept across restarts so sent links stay valid.
[ -f "$STATE/approval.secret" ] || (umask 077; openssl rand -hex 32 >"$STATE/approval.secret")

# Uploaded, not passed on a command line, so the tokens never show in `ps`.
umask 077
{ grep -v '^\s*#' .env 2>/dev/null | grep '='
  echo PACT_MODEL_PROFILE=gb10
  echo PACT_LLM_URL=http://host.openshell.internal:11435
  echo PACT_DECIDE_URL=http://host.openshell.internal:11435/v1
  echo PACT_GB10_HOST=host.openshell.internal
  echo "PACT_LLM_TOKEN=$(cat "$HOME/.nemoclaw/ollama-proxy-token")"
  echo PACT_BUILDER_URL=http://host.openshell.internal:4100
  echo "PACT_BUILDER_TOKEN=$(cat "$STATE/builder.token")"
  echo PACT_DB=/sandbox/pact-data/pact.db
  echo PACT_SPECS_DIR=/sandbox/pact-data/specs
  echo PACT_OPENCLAW=1
  echo "PACT_APPROVAL_SECRET=$(cat "$STATE/approval.secret")"
} >"$STATE/agent.env"

# Stop by pid file only: a pkill -f pattern would match this very shell command.
sx 'mkdir -p /sandbox/pact-data; [ -f /sandbox/pact-data/agent.pid ] && kill $(cat /sandbox/pact-data/agent.pid) 2>/dev/null; sleep 1; true'
[ "${1:-}" = --fresh ] && sx 'rm -rf /sandbox/pact-data/pact.db /sandbox/pact-data/pact.db-shm /sandbox/pact-data/pact.db-wal /sandbox/pact-data/specs /tmp/pact-builds'
nemoclaw "$SB" upload "$STATE/agent.env" /sandbox/pact-data/agent.env >/dev/null
sx 'cd /sandbox/pact && set -a && . /sandbox/pact-data/agent.env && set +a &&
  nohup node_modules/.bin/tsx agent/main.ts >/sandbox/pact-data/agent.log 2>&1 & echo $! >/sandbox/pact-data/agent.pid'
for _ in $(seq 1 60); do curl -sf localhost:4000/state >/dev/null && exit 0; sleep 1; done
echo "agent not answering on :4000; see: nemoclaw $SB exec -- tail /sandbox/pact-data/agent.log"; exit 1
