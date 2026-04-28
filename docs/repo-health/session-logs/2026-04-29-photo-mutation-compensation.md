---
type: session-log
title: Photo mutation compensation
status: completed
created_at: "2026-04-29 02:51:58 JST +0900"
updated_at: "2026-04-29 02:51:58 JST +0900"
started_at: "2026-04-29 02:48:00 JST +0900"
ended_at: "2026-04-29 02:51:58 JST +0900"
timezone: Asia/Tokyo
participants:
  - Codex
areas:
  - repo-health
  - backend
  - photos
related_plans:
  - docs/repo-health/plans/PLAN-0002-backend-write-integrity-hardening/PLAN-0002-backend-write-integrity-hardening.md
related_briefs:
  - docs/repo-health/plans/PLAN-0002-backend-write-integrity-hardening/IMPL-0002-02-photo-mutation-compensation.md
related_specs: []
related_adrs: []
related_todos: []
commits: []
---

# Photo Mutation Compensation

## Goal

Reduce orphaned-photo and missing-photo-row failure modes while preserving current single-photo-per-log behavior.

## Changes

- Made `uploadPhotoIfPresent` upload-only so replacing a photo no longer removes the old object before the database row updates.
- Added best-effort cleanup for newly uploaded photos when create insert or update fails.
- Changed replacement updates to remove the old photo only after the row points at the new photo.
- Changed delete to remove the database row first, then attempt storage cleanup.
- Added `src/lib/photo-mutation-compensation.ts` and tests for cleanup success, cleanup failure logging without throwing, and no-op cleanup without a path.
- Updated `AUDT-0001#FINDING-004`, `PLAN-0002`, and `IMPL-0002-02`.

## Remaining Risk

Supabase Storage and Postgres are still not atomic together. If a best-effort cleanup remove fails, the app logs bucket/path/reason/log id where available so the orphan can be cleaned manually.

## Evidence

- Compensated failure path: unit coverage verifies newly uploaded paths are removed for `create_insert_failed`.
- Cleanup failure path: unit coverage verifies both returned Supabase errors and thrown/rejected cleanup calls are logged without throwing.
- Normal no-photo path: unit coverage verifies no storage remove runs when the path is null.
- Normal app path: `next build` verifies the create/update/delete server actions compile after the ordering change.

## Verification

- `vitest run`: 7 files / 22 tests passed locally.
- `eslint .`: passed locally.
- `next build`: passed locally.
- `scripts/docs-meta check`: passed locally.
- `scripts/docs-meta check-links`: passed locally.
- `scripts/docs-meta review --type audit-findings`: passed locally.
