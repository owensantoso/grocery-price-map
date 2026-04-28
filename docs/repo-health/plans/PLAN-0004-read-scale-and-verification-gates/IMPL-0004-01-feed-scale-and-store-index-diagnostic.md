---
type: implementation-brief
id: IMPL-0004-01
title: Feed scale and store index diagnostic
domain: repo-health
status: completed
created_at: "2026-04-29 00:32:25 JST +0900"
updated_at: "2026-04-29 03:43:51 JST +0900"
parent_plan: PLAN-0004
task_refs:
  - AUDT-0001#FINDING-007
  - AUDT-0001#FINDING-008
  - AUDT-0001#FINDING-016
owner:
areas: []
depends_on: []
parallel_with: []
related_specs: []
related_adrs: []
related_sessions:
  - docs/repo-health/session-logs/2026-04-29-feed-scale-and-store-index-diagnostic.md
related_issues: []
related_prs: []
linked_paths:
  - docs/repo-health/audits/AUDT-0001-mvp-stabilization-risk-audit.md
  - src/lib/queries.ts
  - src/app/logs/page.tsx
  - src/app/account/page.tsx
  - src/app/stores/[storeId]/page.tsx
  - supabase/migrations/
repo_state:
  based_on_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
  last_reviewed_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
---

# IMPL-0004-01 - Feed Scale And Store Index Diagnostic

## Parent Plan

- PLAN-0004

## Task Goal

Gather enough evidence to decide whether read-scale concerns need immediate implementation, a migration, or accepted MVP risk.

## Scope

In scope:

- `AUDT-0001#FINDING-007`
- `AUDT-0001#FINDING-008`
- `AUDT-0001#FINDING-016`
- feed/account all-log reads
- store detail index shape
- repeated item-log work on log detail

Out of scope:

- implementing pagination before evidence
- changing route UX
- adding migrations without an `EXPLAIN` or equivalent rationale

## Implementation Assumptions

- This is an evidence-gathering brief first, not an optimization brief.
- Query behavior should not change until characterization coverage from `IMPL-0001-03` exists or the change is purely documentary.
- A documented blocker is acceptable if local Supabase data or credentials are unavailable.

## Preferred Approach

Capture current query shapes in a short diagnostic note before changing code. Use `EXPLAIN` or Supabase dashboard evidence for index questions when possible. If evidence is unavailable, record exactly what is missing and route the work to a future implementation brief instead of guessing.

For feed/account all-log reads, prefer a decision table:

- current expected data size
- user-facing risk if left as-is
- simplest future fix
- trigger for implementing pagination or account-specific reads

Evidence bar:

- Record the diagnostic artifact in `docs/repo-health/debugging/` using `DIAG-*` if real query timings, `EXPLAIN`, or run logs are captured; otherwise update this brief or the audit with a short evidence note.
- For `FINDING-007`, state the current row limit behavior, representative row-count assumption, and the trigger for pagination/account-specific reads.
- For `FINDING-008`, include the exact store-detail query shape and either `EXPLAIN` output, Supabase dashboard evidence, or the blocker preventing it.
- For `FINDING-016`, explicitly update `IMPL-0005-01` or `AUDT-0001` if duplicate log-detail assembly should be handled during the query split.

## Execution Steps

1. [x] Document current query shapes and expected growth pressure.
2. [x] Check whether local Supabase `EXPLAIN` evidence is available.
3. [x] Decide whether pagination/account-specific reads should be planned now or deferred.
4. [x] Decide whether log-detail duplicate assembly belongs in `IMPL-0005-01`.
5. [x] Update audit findings with evidence and routes.

## Diagnostic Result

No app behavior or schema change was made. The current evidence supports audit routing/documentation only.

### FINDING-007 - Feed/account all-log read

Current shape:

```ts
supabase.from("price_logs").select(PRICE_LOG_SELECT)
```

`PRICE_LOG_SELECT` includes price log fields plus embedded `items` and `stores`. There is no `.limit()`, `.range()`, or database `.order()` on the live all-log query. `getPriceLogsSnapshot()` then loads votes for every returned log, builds feed entries, sorts in application code, and derives account logs with `allLogs.filter((entry) => entry.log.submitted_by === viewer.id)`.

Decision table:

| Question | Current answer |
|---|---|
| Current row limit behavior | Unbounded from app code. Supabase/PostgREST may enforce project/API defaults, but the repo does not request a bounded page. |
| Representative row-count assumption | Acceptable for MVP while total `price_logs` is in the low thousands and public/account pages remain internal or lightly used. |
| User-facing risk | Public logs and account pages can become slow or incomplete as `price_logs` grows because one route reads every log, joins relations, reads votes for every log, sorts in memory, and filters owner logs after the fact. |
| Simplest future fix | Add a bounded feed query with database ordering/range and a separate owner-specific account query filtered by `submitted_by`. Keep sort modes explicit; start with recent/oldest pagination before attempting global cheapest/upvoted pagination semantics. |
| Trigger for pagination/account-specific reads | Implement before public launch or when `price_logs` reaches 5,000 rows, page server time exceeds about 1 second in production/staging, response payloads become visibly large, or account pages need reliable owner-only history. |

Decision: accepted MVP risk, not an immediate implementation. The concrete trigger above should reopen this before launch or at the first growth signal.

### FINDING-008 - Store-detail index shape

Current store-detail live query path:

```ts
supabase
  .from("price_logs")
  .select(PRICE_LOG_SELECT)
  .eq("store_id", storeId)
```

`getStoreDetail()` calls that store-filtered query, then loads votes for all returned store logs, builds feed entries, and derives a photo gallery from those entries.

Indexes found in migrations:

```sql
create index if not exists price_logs_item_store_observed_idx
  on public.price_logs (item_id, store_id, observed_at desc, created_at desc);

create index if not exists price_logs_item_normalized_idx
  on public.price_logs (item_id, normalized_price_yen asc);
```

No migration currently defines a `price_logs` index with `store_id` as the leading column. That means the current store-only predicate cannot use the existing item-leading composite index as a selective leading-key lookup.

`EXPLAIN` blocker: this workspace has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, but no direct database connection string. `psql` and the Supabase CLI are installed, but `supabase status` reports no running local database container for this project. Without local DB access or a staging/prod DB URL, this pass cannot collect a real query plan.

Run later with a realistic dataset:

```sql
explain (analyze, buffers)
select
  id,
  store_id,
  item_id,
  submitted_by,
  package_amount,
  package_unit,
  total_price_yen,
  price_tax_excluded_yen,
  normalized_price_yen,
  observed_at,
  notes,
  listing_url,
  photo_path,
  created_at
from public.price_logs
where store_id = '<store-id-with-representative-log-count>'::uuid;
```

If that plan shows a sequential scan or high buffer reads at realistic row counts, the smallest migration is likely:

```sql
create index concurrently if not exists price_logs_store_observed_idx
  on public.price_logs (store_id, observed_at desc, created_at desc);
```

Decision: deferred until `EXPLAIN` can be run against local, staging, or production-like data. Do not add the migration from speculation alone.

### FINDING-016 - Log-detail duplicate item-log assembly

Current shape:

- `getPriceLogDetail(logId)` loads one log by ID.
- It then calls `getCachedPriceLogsByItem(log.item_id)` to build `recentItemLogs`, `sameStoreHistory`, and vote summaries.
- It also calls `getComparisonSnapshot(log.item_id)` for `latestAcrossStores`; that path calls `getCachedPriceLogsByItem(selectedItem.id)` and loads the same item's vote rows again.

Because this is duplicate read-model assembly inside `src/lib/queries.ts`, it fits the query-boundary split better than this evidence pass. `IMPL-0005-01` already includes `AUDT-0001#FINDING-016`; this pass confirms that routing and adds a handoff note there.

Decision: routed to `IMPL-0005-01`. During the split, either reuse the already-loaded item logs/vote summaries for `latestAcrossStores` or explicitly preserve the duplicate call if cache behavior is intentionally preferred.

## Handoff Notes

- Keep this brief separate from implementation unless the evidence reveals a tiny, obvious migration.
- If adding an index, include the query shape and evidence that justifies it.
- If deferring pagination, include a concrete revisit trigger such as row count, launch milestone, or observed page latency.

## Verification

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
scripts/docs-meta review --type audit-findings
```

Attach evidence for each finding: `FINDING-007`, `FINDING-008`, and `FINDING-016`.

## Done Checklist

- [x] Store index question has evidence or a documented blocker.
- [x] Feed/account read-scale risk has a route or accepted-risk rationale.
- [x] Log-detail duplicate work is routed or accepted.
- [x] Audit findings updated.
