#!/usr/bin/env bash
# Usage: pnpm verify <goal>   e.g. pnpm verify a2
g=${1:?usage: pnpm verify <goal>  (r1..r4, e2e, a1..a5, s1b, s2..s5; s1 = infra/gb10/smoke.sh)}
[ "$g" = s1 ] && exec bash infra/gb10/smoke.sh
exec bash "$(dirname "$0")/$g.sh"
