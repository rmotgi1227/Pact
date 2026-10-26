#!/usr/bin/env bash
# Puts the demo booking-site repo back to its starting state before a rehearsal or the live run:
# main = the initial import (tablet layout missing), fresh "Tablet layout" and "Refactor results grid"
# PRs (new numbers, written to .env), no open specs PRs or SOW issues. Only ever run on the demo repo.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; [ -f .env ] && . ./.env; set +a
# git authenticates through gh, which reads GITHUB_TOKEN (a PAT works); no global git config.
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=credential.https://github.com.helper GIT_CONFIG_VALUE_0='!gh auth git-credential'
# No demo repo yet: setup creates a fresh one (and records it in .env), so there's nothing to reset.
[ -n "${BOOKING_REPO_SLUG:-}" ] || exec bash scripts/setup-booking-repo.sh
SLUG="$BOOKING_REPO_SLUG"
CLONE="${BOOKING_REPO:-$HOME/${SLUG##*/}}"
[[ "$SLUG" == */pact-booking-* ]] || { echo "refusing: $SLUG is not a demo repo (pact-booking-*)" >&2; exit 1; }

echo "== closing open PRs and SOW issues on $SLUG =="
for n in $(gh pr list -R "$SLUG" --state open --json number -q '.[].number'); do gh pr close "$n" -R "$SLUG" --delete-branch >/dev/null 2>&1 || gh pr close "$n" -R "$SLUG" >/dev/null; done
for n in $(gh issue list -R "$SLUG" --state open --search "SOW §" --limit 200 --json number -q '.[].number'); do gh issue close "$n" -R "$SLUG" >/dev/null; done

echo "== resetting main to the initial import =="
[ -d "$CLONE/.git" ] || git clone -q "https://github.com/$SLUG.git" "$CLONE"
git -C "$CLONE" fetch -q origin --prune
base=$(git -C "$CLONE" log origin/main --reverse --format='%H %s' | awk '/Booking prototype: initial import/{print $1; exit}')
[ -n "$base" ] || { echo "initial import commit not found on main" >&2; exit 1; }
git -C "$CLONE" push -q -f origin "$base:refs/heads/main"
for b in priya/tablet-layout raj/grid-refactor; do git -C "$CLONE" push -q origin --delete "$b" 2>/dev/null || true; git -C "$CLONE" branch -q -D "$b" 2>/dev/null || true; done
git -C "$CLONE" checkout -q -B main "$base"

echo "== re-creating the demo PRs =="
bash scripts/setup-booking-repo.sh
echo "Also reset Pact's own state: rm -f pact.db pact.db-shm pact.db-wal; rm -rf specs/hertz-demo"
