#!/usr/bin/env bash
# S5: a tested build can be shared with Dana and the Vercel URL opens.
source "$(dirname "$0")/_lib.sh"
[ -n "${VERCEL_DEPLOY_TOKEN:-}" ] || fail "set VERCEL_DEPLOY_TOKEN"
ensure_agent
b=$(state | jq -r '[.builds[] | select(.kind!="prototype" and .status=="passed")][-1].id // empty')
[ -n "$b" ] || fail "no passed engineering build to share (run s4 first)"
action share-build "{\"buildId\":\"$b\"}"
wait_for "[.builds[] | select(.id==\"$b\" and .deployUrl != null)] | length == 1" 300 "build deployed"
url=$(state | jq -r ".builds[] | select(.id==\"$b\") | .deployUrl"); curl -sfL "$url" >/dev/null || fail "url does not open"; pass "$url opens"
