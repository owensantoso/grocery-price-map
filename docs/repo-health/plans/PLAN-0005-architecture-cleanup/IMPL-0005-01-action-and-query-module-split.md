---
type: implementation-brief
id: IMPL-0005-01
title: Action and query module split
domain: repo-health
status: completed
created_at: "2026-04-28 22:51:03 JST +0900"
updated_at: "2026-04-29 03:58:20 JST +0900"
parent_plan: PLAN-0005
task_refs:
  - AUDT-0001#FINDING-016
  - AUDT-0001#FINDING-017
owner: 
areas: []
depends_on:
  - IMPL-0001-03
  - IMPL-0002-01
  - IMPL-0004-01
parallel_with: []
related_specs: []
related_adrs: []
related_sessions:
  - docs/repo-health/session-logs/2026-04-29-feed-scale-and-store-index-diagnostic.md
  - docs/repo-health/session-logs/2026-04-29-action-query-module-split.md
related_issues: []
related_prs: []
linked_paths:
  - src/app/actions.ts
  - src/lib/queries.ts
  - src/lib/action-helpers.ts
  - src/lib/price-log-photo-actions.ts
  - src/lib/query-read-models.ts
  - src/lib/models.ts
  - src/lib/supabase/server.ts
  - src/lib/supabase/public.ts
repo_state:
  based_on_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
  last_reviewed_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
---

# IMPL-0005-01 - Action and query module split

## Parent Plan

- PLAN-0005

## Task Goal

Reduce the two largest code gravity wells without changing product behavior.

## Scope

In scope:

- split `src/app/actions.ts` into domain-oriented action modules if Next server action constraints allow it cleanly
- split `src/lib/queries.ts` into smaller read/snapshot modules
- extract repeated row mapping or vote summary helpers when it reduces real duplication
- address or explicitly preserve the log-detail duplicate item-log assembly path from `AUDT-0001#FINDING-016`
- preserve existing route imports or update them surgically

Out of scope:

- changing Supabase schema
- changing route UX
- adding admin/moderation/product expansion
- replacing server actions with a different mutation architecture
- starting before the backend write-integrity boundary and verification gate decisions are recorded

## Execution Steps

1. Read tests and docs from `IMPL-0001-03`, backend-boundary notes from `IMPL-0002-01`, and read-scale decisions from `IMPL-0004-01`.
2. Map current exported functions and route/component imports.
3. Choose the smallest split that lowers cognitive load.
4. Move one domain at a time and run tests after each meaningful move.
5. Update architecture docs only if module boundaries actually changed.

## Handoff From IMPL-0004-01

`AUDT-0001#FINDING-016` remains in this brief. `getPriceLogDetail()` currently loads item logs and vote summaries for recent item logs and same-store history, then calls `getComparisonSnapshot(log.item_id)`, which repeats the same item-log and vote-summary work to build `latestAcrossStores`.

During the query split, prefer extracting a detail/read-model helper that can reuse the already-loaded item logs and vote summaries for `latestAcrossStores`. If cache behavior or readability makes reuse larger than the problem, explicitly preserve the duplicate call and document that choice in this brief or the session log.

## Implementation Notes

- Kept `src/app/actions.ts` as the stable server-action entry point to avoid higher-risk Next server-action barrel changes.
- Extracted shared action state, auth, rate-limit, redirect-error, and cache invalidation helpers into `src/lib/action-helpers.ts`.
- Extracted price-log photo upload/removal helpers into `src/lib/price-log-photo-actions.ts`.
- Kept `src/lib/queries.ts` as the stable snapshot/Supabase access facade and re-exported pure helper APIs for existing tests/imports.
- Extracted pure vote, comment, feed, compare, and relation-stripping read-model helpers into `src/lib/query-read-models.ts`.
- Resolved `AUDT-0001#FINDING-016` by building log-detail `latestAcrossStores` from the already-loaded item logs and vote summaries instead of calling `getComparisonSnapshot(log.item_id)`.

## Verification

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build
```

## Done Checklist

- [x] Large modules are smaller or a blocked reason is documented.
- [x] Public route behavior is preserved.
- [x] Imports remain understandable.
- [x] Verification complete.
