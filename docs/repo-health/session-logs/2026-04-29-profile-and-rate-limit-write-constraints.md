---
type: session-log
title: Profile and rate-limit write constraints
status: completed
created_at: "2026-04-29 03:01:42 JST +0900"
updated_at: "2026-04-29 03:01:42 JST +0900"
started_at: "2026-04-29 02:59:00 JST +0900"
ended_at: "2026-04-29 03:01:42 JST +0900"
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
  - docs/repo-health/plans/PLAN-0002-backend-write-integrity-hardening/IMPL-0002-03-profile-and-rate-limit-write-constraints.md
related_specs: []
related_adrs: []
related_todos: []
commits: []
---

# Profile And Rate-Limit Write Constraints

## Goal

Tighten profile self-update scope to the username-only settings surface and make rate-limit consumption atomic.

## Changes

- Added `supabase/migrations/202604290002_profile_rate_limit_constraints.sql`.
- Added a profile self-update trigger that rejects authenticated self-update changes outside `public_name`.
- Added `public.consume_action_rate_limit(action_name, max_events, window_seconds)`.
- Updated `consumeRateLimit` to call the RPC while preserving existing action names, limits, windows, and error copy.
- Updated generated Supabase function typing and backend/audit/plan docs.

## Concurrency Note

The rate-limit RPC uses `pg_advisory_xact_lock(hashtext(auth.uid()::text), hashtext(action_name))`, so concurrent requests for the same authenticated user/action serialize inside the database transaction before count and insert.

## Verification

- `vitest run`: passed locally.
- `eslint .`: passed locally.
- `next build`: passed locally.
- `scripts/docs-meta check`: passed locally.
- `scripts/docs-meta check-links`: passed locally.
- `scripts/docs-meta review --type audit-findings`: passed locally.
- `supabase db lint`: passed locally.

## Remaining DB Check

`supabase migration up` remains blocked in this environment by local migration-history drift. Before production rollout, apply the migration on a repaired/clean local or staging Supabase project and verify profile self-update rejection plus concurrent rate-limit behavior.
