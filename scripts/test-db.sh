#!/usr/bin/env bash
# Runs the pgTAP files in supabase/tests against the local Supabase database
# with psql (no pg_prove image needed). Fails if any assertion fails.
set -euo pipefail
DB_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
status=0
for f in supabase/tests/*.sql; do
  out=$(psql "$DB_URL" -v ON_ERROR_STOP=1 -q -t -A -f "$f" 2>&1) || { echo "$out"; status=1; continue; }
  echo "$out" | grep -E '^(not )?ok|^#' || true
  if echo "$out" | grep -qE '^not ok|Looks like'; then status=1; fi
  echo "$f: $(echo "$out" | grep -c '^ok') passed, $(echo "$out" | grep -c '^not ok') failed"
done
exit $status
