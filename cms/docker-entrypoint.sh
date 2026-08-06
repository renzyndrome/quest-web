#!/bin/sh
# CMS container boot sequence.
#
#   1. apply pending database migrations  (always — schema must match the code)
#   2. seed the starting content          (only when SEED_ON_BOOT=true)
#   3. serve
#
# Migration failure is fatal on purpose: serving against a stale schema causes
# far more damage than a container that refuses to start. Seed failure is NOT
# fatal — the site can run without the starter content, and the seed is
# additive so it can simply be re-run.

set -e

echo "[cms] applying migrations…"
npx payload migrate

if [ "$SEED_ON_BOOT" = "true" ]; then
  echo "[cms] seeding initial content…"
  # Additive and idempotent: existing media/slugs are left untouched, so this
  # is safe on every restart and never overwrites an editor's changes.
  npx payload run scripts/seed-initial.ts || echo "[cms] WARNING: seed failed, continuing"
fi

echo "[cms] starting server…"
exec node server.js
