---
type: session-log
title: Action and query module split
status: completed
created_at: "2026-04-29 03:58:20 JST +0900"
updated_at: "2026-04-29 03:58:20 JST +0900"
started_at: "2026-04-29 03:49:00 JST +0900"
ended_at: "2026-04-29 03:58:20 JST +0900"
timezone: Asia/Tokyo
participants:
  - Codex
areas:
  - repo-health
  - architecture
  - server-actions
  - queries
related_plans:
  - docs/repo-health/plans/PLAN-0005-architecture-cleanup/PLAN-0005-architecture-cleanup.md
related_briefs:
  - docs/repo-health/plans/PLAN-0005-architecture-cleanup/IMPL-0005-01-action-and-query-module-split.md
related_specs: []
related_adrs: []
related_todos: []
commits: []
---

# Action And Query Module Split

## Goal

Complete `IMPL-0005-01` by reducing the action/query gravity wells without changing route/component imports or product behavior.

## Changes

- Kept `@/app/actions` as the stable server-action entry point.
- Moved shared action state, auth, rate limiting, redirect-error, and cache invalidation helpers to `src/lib/action-helpers.ts`.
- Moved price-log photo upload/removal helpers to `src/lib/price-log-photo-actions.ts`.
- Kept `@/lib/queries` as the stable read snapshot facade.
- Moved pure read-model assembly helpers to `src/lib/query-read-models.ts` and re-exported them from `src/lib/queries.ts` for compatibility.
- Reused already-loaded item logs and vote summaries for log-detail `latestAcrossStores`, resolving the duplicate item-log assembly path.

## Verification

- `vitest run`: 10 files / 30 tests passed locally.
- `eslint .`: passed locally.
- `next build`: passed locally with 13 app routes generated.

## Follow-Ups

- Further domain splitting of exported server actions should happen only if needed and should prove Next server-action behavior with `next build`.
- Further query snapshot splitting can happen later if `src/lib/queries.ts` grows again, with `src/lib/query-read-models.ts` kept as the pure helper layer.
