#!/usr/bin/env bash
# implemented by Rishab's loop; Aryan owns going forward
#
# A3: idempotent setup of the booking-site repo (the real GitHub target Phase D polls,
# issues against and opens PRs on). Safe to re-run: it reuses the repo, local clone,
# branches and PRs it already created instead of recreating them.
#
# Produces, on rmotgi1227/pact-booking-site (private):
#   main                  - templates/booking-proto, with the tablet breakpoint deliberately
#                           missing from the results grid (phone 1-col, desktop multi-col,
#                           nothing in between -> 768-1024px shows 1 card per row).
#   priya/tablet-layout   - adds the missing tablet breakpoint back. PR "Tablet layout".
#   raj/grid-refactor     - extracts the grid into a component with a hard-coded single
#                           column, which (merged after the tablet PR) silently reintroduces
#                           the same regression. PR "Refactor results grid". Neither PR is
#                           merged by this script.
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"

need() { command -v "$1" >/dev/null 2>&1 || { echo "need $1" >&2; exit 1; }; }
need gh; need git

SLUG="${BOOKING_REPO_SLUG:-rmotgi1227/pact-booking-site}"
OWNER="${SLUG%%/*}"; NAME="${SLUG##*/}"
CLONE="${BOOKING_REPO:-/tmp/pact-booking-site}"
TEMPLATE_DIR="$ROOT/templates/booking-proto"

echo "== repo: $SLUG =="
if gh repo view "$SLUG" >/dev/null 2>&1; then
  echo "repo already exists, reusing"
else
  gh repo create "$SLUG" --private --description "Pact demo: Hertz-replay booking prototype (A3 engineering target)" >/dev/null
  echo "created $SLUG"
fi

echo "== local clone: $CLONE =="
if [ -d "$CLONE/.git" ]; then
  git -C "$CLONE" fetch origin >/dev/null
else
  rm -rf "$CLONE"
  mkdir -p "$CLONE"
  git clone "https://github.com/$SLUG.git" "$CLONE" >/dev/null 2>&1 || {
    # brand-new repo has no refs yet; init locally and push the first commit below
    git -C "$CLONE" init -q
    git -C "$CLONE" remote add origin "https://github.com/$SLUG.git"
  }
fi
git -C "$CLONE" checkout -q -B main
git -C "$CLONE" config user.email "rmotgi1227@users.noreply.github.com"
git -C "$CLONE" config user.name "rmotgi1227"

seed_from_template() {
  # Copy the template into the clone, minus anything that's local-only or belongs to
  # Pact's own monorepo tooling. Never touch templates/booking-proto itself.
  rsync -a --delete \
    --exclude .git --exclude node_modules --exclude .next --exclude .vercel \
    --exclude test-results --exclude playwright-report \
    "$TEMPLATE_DIR/" "$CLONE/"
}

# The one line in the template that's intentionally "fixed" in templates/booking-proto
# (Pact's own prototype target, owned by R4) but that main here must NOT have: this repo's
# main is the pre-fix state the tablet PR fixes and the regression PR breaks again.
break_tablet_css() {
  local css="$CLONE/app/globals.css"
  python3 - "$css" <<'PY'
import re, sys
path = sys.argv[1]
src = open(path).read()
pattern = re.compile(
    r"/\*.*?\*/\s*\n\.results-grid \{\n"
    r"  display: grid;\n"
    r"  grid-template-columns: repeat\(auto-fit, minmax\(240px, 1fr\)\);\n"
    r"  gap: var\(--space-3\);\n"
    r"  width: 100%;\n"
    r"\}",
    re.DOTALL,
)
broken = """/* Results grid: phone is a single column, desktop is a real grid. There is no rule for
   tablet widths (768-1024px), so a tablet inherits the phone's single column. */
.results-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
  width: 100%;
}

@media (min-width: 1280px) {
  .results-grid {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }
}"""
new_src, n = pattern.subn(broken, src, count=1)
assert n == 1, "template results-grid rule not found; booking-site setup is out of sync with templates/booking-proto"
open(path, 'w').write(new_src)
PY
}

fix_tablet_css() {
  local css="$CLONE/app/globals.css"
  python3 - "$css" <<'PY'
import sys
path = sys.argv[1]
src = open(path).read()
anchor = "@media (min-width: 1280px) {"
assert anchor in src, "broken results-grid rule not found; run from main after break_tablet_css"
fix = """@media (min-width: 768px) {
  .results-grid {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }
}

""" + anchor
open(path, 'w').write(src.replace(anchor, fix, 1))
PY
}

write_results_grid_component() {
  # raj's "refactor": pulls the grid markup into its own component. The inline style
  # it hard-codes beats every CSS media query (inline > class), so no matter what
  # globals.css says -- fixed or not -- the grid is single-column everywhere again.
  mkdir -p "$CLONE/app/components"
  cat > "$CLONE/app/components/ResultsGrid.tsx" <<'TSX'
import type { ReactNode } from 'react';

// Extracted from app/results/page.tsx so column behavior lives in one place.
export function ResultsGrid({ dense, children }: { dense: boolean; children: ReactNode }) {
  return (
    <div
      className="results-grid"
      data-testid="results-grid"
      data-tablet-dense={dense}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%' }}
    >
      {children}
    </div>
  );
}
TSX

  cat > "$CLONE/app/results/page.tsx" <<'TSX'
import { Header } from '../components/Header';
import { ResultCard } from '../components/ResultCard';
import { ResultsGrid } from '../components/ResultsGrid';
import { getSlots } from '../../lib/slots';
import { searchVehicles } from '../../data/vehicles';

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ carClass?: string }>;
}) {
  const slots = getSlots();
  const { carClass } = await searchParams;
  const results = searchVehicles(carClass);

  return (
    <main className="page">
      <Header title={slots.title} />
      <h1>{slots.screens.results.heading}</h1>
      {results.length === 0 ? (
        <p className="empty-state">No cars match that search. Try a different class or date range.</p>
      ) : (
        <ResultsGrid dense={slots.showTabletLayout}>
          {results.map((vehicle) => (
            <ResultCard key={vehicle.id} vehicle={vehicle} bookCta={slots.screens.book.cta} />
          ))}
        </ResultsGrid>
      )}
    </main>
  );
}
TSX
}

commit_and_push() {
  local branch="$1" msg="$2"
  git -C "$CLONE" add -A
  if git -C "$CLONE" diff --cached --quiet; then
    echo "$branch: nothing to commit"
  else
    git -C "$CLONE" commit -q -m "$msg"
  fi
  git -C "$CLONE" push -q -u origin "$branch"
}

existing_pr() {
  gh pr list -R "$SLUG" --head "$1" --state all --json number -q '.[0].number' 2>/dev/null || true
}

remote_branch_exists() {
  git -C "$CLONE" ls-remote --exit-code --heads origin "$1" >/dev/null 2>&1
}

# A feature branch is only ever created once: on rerun its remote tip already carries the
# seeded commit, and re-deriving it from a (possibly unchanged, same-SHA) main would just
# create a sibling commit git can't fast-forward to. So reruns check it out as-is and move on.
setup_branch() {
  local branch="$1" patch_fn="$2" msg="$3"
  if remote_branch_exists "$branch"; then
    echo "$branch: already on origin, reusing"
    git -C "$CLONE" fetch -q origin "$branch"
    git -C "$CLONE" checkout -q -B "$branch" "origin/$branch"
  else
    git -C "$CLONE" checkout -q -B "$branch" main
    "$patch_fn"
    commit_and_push "$branch" "$msg"
  fi
}

echo "== main (tablet breakpoint deliberately missing) =="
seed_from_template
break_tablet_css
commit_and_push main "Booking prototype: initial import"

echo "== priya/tablet-layout =="
setup_branch priya/tablet-layout fix_tablet_css "Add the missing tablet breakpoint to the results grid"
TABLET_PR="$(existing_pr priya/tablet-layout)"
if [ -z "$TABLET_PR" ]; then
  TABLET_PR="$(gh pr create -R "$SLUG" --base main --head priya/tablet-layout \
    --title "Tablet layout" \
    --body "Results grid has no rule between the phone and desktop breakpoints, so a tablet (768-1024px) falls back to the phone's single column. Adds the missing \`@media (min-width: 768px)\` rule so tablets get the same \`auto-fit\` grid as desktop." \
    | grep -oE '[0-9]+$')"
fi
echo "Tablet PR: #$TABLET_PR"

echo "== raj/grid-refactor =="
setup_branch raj/grid-refactor write_results_grid_component "Refactor results grid into its own component"
REGRESSION_PR="$(existing_pr raj/grid-refactor)"
if [ -z "$REGRESSION_PR" ]; then
  REGRESSION_PR="$(gh pr create -R "$SLUG" --base main --head raj/grid-refactor \
    --title "Refactor results grid" \
    --body "Pulls the results grid markup out of \`app/results/page.tsx\` into its own \`ResultsGrid\` component, so column behavior lives in one place." \
    | grep -oE '[0-9]+$')"
fi
echo "Regression PR: #$REGRESSION_PR"

git -C "$CLONE" checkout -q main

echo "== data-testid check (main) =="
MISSING=""
for id in search-form results-grid result-card book-cta booking-form confirmation-banner brand-switcher; do
  grep -rq "data-testid=\"$id\"\|data-testid={\`$id" "$CLONE/app" || MISSING="$MISSING $id"
done
grep -rq 'data-testid={`field-' "$CLONE/app" || MISSING="$MISSING field-<key>"
if [ -n "$MISSING" ]; then
  echo "missing testids on main:$MISSING" >&2
  exit 1
fi
echo "all template data-testids present on main"

echo "== writing .env (values only, never printed) =="
ENV_FILE="$ROOT/.env"
[ -f "$ENV_FILE" ] || cp "$ROOT/.env.example" "$ENV_FILE"
set_env() {
  local key="$1" val="$2"
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    sed -i.bak "s#^${key}=.*#${key}=${val}#" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
  else
    echo "${key}=${val}" >> "$ENV_FILE"
  fi
}
set_env TABLET_PR "$TABLET_PR"
set_env REGRESSION_PR "$REGRESSION_PR"
set_env BOOKING_REPO_SLUG "$SLUG"
set_env BOOKING_REPO "$CLONE"
# GITHUB_TOKEN: reuse the already-logged-in gh token (repo scope) rather than asking for a new one.
[ -n "${GITHUB_TOKEN:-}" ] || GITHUB_TOKEN="$(gh auth token)"
set_env GITHUB_TOKEN "$GITHUB_TOKEN"

echo
echo "repo:        https://github.com/$SLUG"
echo "clone:       $CLONE"
echo "tablet PR:   #$TABLET_PR"
echo "regression PR: #$REGRESSION_PR"
