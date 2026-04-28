---
type: session-log
title: Price log write integrity boundary
status: completed
created_at: "2026-04-29 02:39:08 JST +0900"
updated_at: "2026-04-29 02:39:08 JST +0900"
started_at: "2026-04-29 02:35:00 JST +0900"
ended_at: "2026-04-29 02:39:08 JST +0900"
timezone: Asia/Tokyo
participants:
  - Codex
areas:
  - repo-health
  - backend
  - supabase
related_plans:
  - docs/repo-health/plans/PLAN-0002-backend-write-integrity-hardening/PLAN-0002-backend-write-integrity-hardening.md
related_briefs:
  - docs/repo-health/plans/PLAN-0002-backend-write-integrity-hardening/IMPL-0002-01-price-log-write-integrity-boundary.md
related_specs: []
related_adrs: []
related_todos: []
commits: []
---

# Price Log Write Integrity Boundary

## Goal

Prevent direct authenticated Supabase clients from bypassing the trusted `price_logs` fields used by compare, feed, detail, and photo surfaces.

## Changes

- Added `supabase/migrations/202604290001_price_log_integrity.sql`.
- The migration adds a `before insert or update` trigger on `public.price_logs`.
- The trigger rejects mismatched authenticated ownership, ownership changes, mismatched item/package units, incorrect normalized prices, incorrect tax-excluded prices, and cross-user photo paths.
- Updated create/update server actions to derive `price_tax_excluded_yen` from `total_price_yen` with the shared pricing helper instead of trusting the hidden form field.
- Updated `docs/BACKEND_SCHEMA.md`, `AUDT-0001#FINDING-001`, and `IMPL-0002-01`.

## Boundary

Server actions remain the app write API. Direct authenticated table writes still exist, but the database now rejects writes that violate trusted-field invariants.

## Verification

- `vitest run`: passed locally.
- `eslint .`: passed locally.
- `next build`: passed locally.
- `scripts/docs-meta check`: passed locally.
- `scripts/docs-meta check-links`: passed locally.
- `scripts/docs-meta review --type audit-findings`: passed locally.
- `/opt/homebrew/bin/supabase db lint`: passed locally with no schema errors.
- `/opt/homebrew/bin/supabase migration up`: blocked because the local database has remote migration versions that are not present in this repo.

## Remaining DB Check

Before production rollout, repair/reset local migration history or use a clean staging Supabase project, apply the migration, and run positive server-action create/update checks plus negative direct-write bypass checks for `submitted_by`, `package_unit`, `normalized_price_yen`, `price_tax_excluded_yen`, and `photo_path`.
