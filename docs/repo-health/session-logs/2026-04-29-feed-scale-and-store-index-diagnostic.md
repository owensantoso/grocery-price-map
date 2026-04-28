---
type: session-log
title: Feed scale and store index diagnostic
status: completed
created_at: "2026-04-29 03:43:51 JST +0900"
updated_at: "2026-04-29 03:43:51 JST +0900"
started_at: "2026-04-29 03:40:00 JST +0900"
ended_at: "2026-04-29 03:43:51 JST +0900"
timezone: Asia/Tokyo
participants:
  - Codex
areas:
  - repo-health
  - docs
  - supabase
related_plans:
  - docs/repo-health/plans/PLAN-0004-read-scale-and-verification-gates/PLAN-0004-read-scale-and-verification-gates.md
  - docs/repo-health/plans/PLAN-0005-architecture-cleanup/PLAN-0005-architecture-cleanup.md
related_briefs:
  - docs/repo-health/plans/PLAN-0004-read-scale-and-verification-gates/IMPL-0004-01-feed-scale-and-store-index-diagnostic.md
  - docs/repo-health/plans/PLAN-0005-architecture-cleanup/IMPL-0005-01-action-and-query-module-split.md
related_specs: []
related_adrs: []
related_todos: []
commits: []
---

# Feed Scale And Store Index Diagnostic

## Goal

Resolve `IMPL-0004-01` as an evidence-first audit/documentation pass for `AUDT-0001#FINDING-007`, `FINDING-008`, and `FINDING-016`.

## Evidence Captured

- `FINDING-007`: `getCachedAllPriceLogs()` has no app-level `.limit()`, `.range()`, or database `.order()`. `getPriceLogsSnapshot()` builds all feed entries, sorts in memory, and filters owner logs from the same full feed.
- `FINDING-008`: store detail uses `.from("price_logs").select(PRICE_LOG_SELECT).eq("store_id", storeId)`. Migrations define only item-leading `price_logs` indexes: `(item_id, store_id, observed_at desc, created_at desc)` and `(item_id, normalized_price_yen asc)`.
- `FINDING-016`: `getPriceLogDetail()` loads item logs and vote summaries, then calls `getComparisonSnapshot(log.item_id)`, which repeats item-log and vote-summary assembly for `latestAcrossStores`.

## Decisions

- Accepted `FINDING-007` as MVP risk with concrete triggers for pagination/account-specific reads.
- Deferred `FINDING-008` until an `EXPLAIN (analyze, buffers)` can run against local, staging, or production-like data.
- Routed `FINDING-016` to `IMPL-0005-01`, where the query split can reuse detail read-model inputs or explicitly preserve the duplicate cached path.

## Blockers

No direct DB connection string was present in `.env.local`. `psql` and the Supabase CLI are installed, but `supabase status` reported no running local database container for this project, so this pass could not collect real `EXPLAIN` output.

## Verification

- `scripts/docs-meta check`: passed locally.
- `scripts/docs-meta review --type audit-findings`: passed locally.
- `scripts/docs-meta check-links`: passed locally; reported no links found.
- `vitest run`: 10 files / 30 tests passed locally.
- `eslint .`: passed locally.
- `next build`: passed locally with 13 app routes generated.
