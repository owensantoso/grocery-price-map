---
type: session-log
title: Align price normalization with decimal storage
status: completed
created_at: "2026-10-04 04:56:47 JST +0900"
updated_at: "2026-10-04 04:56:47 JST +0900"
started_at: unknown
ended_at: "2026-10-04 04:56:47 JST +0900"
timezone: Asia/Tokyo
participants:
  - Codex
  - GPT-6 Astra reviewer
areas:
  - backend
  - price-normalization
related_plans:
  - docs/repo-health/plans/PLAN-0002-backend-write-integrity-hardening/PLAN-0002-backend-write-integrity-hardening.md
related_briefs:
  - docs/repo-health/plans/PLAN-0002-backend-write-integrity-hardening/IMPL-0002-01-price-log-write-integrity-boundary.md
related_specs: []
related_adrs: []
related_todos: []
commits: []
---

# Align Price Normalization With Decimal Storage

## Session Metadata

Isolated Windows worktree based on published main `5d4b59ed8120e18d0c49d8cd0c17de685f7d5189`. The user authorized a project review and continuation sweep; this slice repairs an existing integrity mismatch without deciding the pending redesign or taxonomy questions.

## Goal

Make the application's normalized price agree with the existing PostgreSQL integrity trigger: 201 yen for 800g must normalize to 25.13 yen per 100g, rather than the binary floating-point result of 25.12.

## Timeline

- Reproduced five failing decimal cases before the first fix.
- Confirmed the mismatch with PostgreSQL 16 and the existing integrity migration.
- Astra identified rounding after unit conversion as a regression; two added tests failed before its correction.
- Final unit suite, lint, production build, decimal oracle, and Astra review passed.

## Context Read

- Root `AGENTS.md`, current state, product decisions, open questions and deferred scope.
- Measurement helper and tests, create/update actions, validation and schema types.
- `supabase/migrations/202604290001_price_log_integrity.sql` and the linked backend-integrity plan/brief.

## Changes

- Convert original positive price, amount and comparison-basis inputs to exact decimal hundredths, matching numeric(10,2) input coercion.
- Round the resulting positive ratio using integer arithmetic instead of binary floating-point `toFixed`.
- Apply compatible unit factors within the ratio so conversions do not lose precision.
- Add nine regression cases covering decimal halfway values, storage coercion, cancellation and both directions of unit conversion.

## Decisions

Retain the current two-decimal storage model, supported units and tax calculation. Inputs that become zero at storage precision fail explicitly. No schema migration, product redesign or dependency update belongs in this patch.

## Verification

- `npm test`: 16 files / 57 tests passed (baseline: 48 tests).
- `npm run lint`: passed.
- `npm run build`: passed with the CI placeholder Supabase environment; 13 routes generated.
- Production build without Supabase configuration: failed with the expected configuration guard message.
- Disposable PostgreSQL 16 oracle: 257 deterministic/special decimal cases matched the final helper.
- Existing integrity migration in a minimal disposable fixture: old insert 25.12 and update 2.67 rejected; repaired insert 25.13 and update 2.68 accepted. The fixture used an auth stub; this is not full Supabase/RLS or staging verification.
- Astra's final read-only review: no remaining blockers; 23 focused tests and diff whitespace checks passed independently.
- `scripts/docs-meta check`, `scripts/docs-meta check-links`, and `git diff --check`: passed.
- Standalone `npx tsc --noEmit`: reports existing duplicate `id` and `store_id` properties in `src/lib/queries.test.ts:51,62`; that file is unchanged. Production build passed separately; no cause is asserted for the difference.
- `npm audit --omit=dev`: still fails with six advisories (one critical, four high, one moderate) in the unchanged baseline dependencies.

## Follow-ups

Validate complete create/edit flows against a clean staging Supabase instance, including RLS. Repair the baseline test-fixture type errors and dependency audit separately. Verify store-ID roundtrip for same-name stores as a separate narrow slice. Pending visual and taxonomy decisions remain with the human.
