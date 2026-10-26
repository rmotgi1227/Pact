#!/usr/bin/env bash
# Start or reset the whole stack. Called by the dashboard's Start / Reset buttons (dashboard/app/api/control),
# or by hand: `sg docker -c "bash infra/sandbox/control.sh reset"`.
#   start  bring everything up (policy, skills, host builder, sandboxed agent, :4000 forward), keep the store
#   reset  a fresh demo: booking repo back to its start (new demo PRs), then everything up on an empty store
set -euo pipefail
cd "$(dirname "$0")/../.."
case "${1:-}" in
  start) bash infra/sandbox/up.sh ;;
  reset) bash scripts/reset-booking-repo.sh && bash infra/sandbox/up.sh --fresh ;;
  *) echo "usage: control.sh start|reset" >&2; exit 2 ;;
esac
echo "control: $1 done"
