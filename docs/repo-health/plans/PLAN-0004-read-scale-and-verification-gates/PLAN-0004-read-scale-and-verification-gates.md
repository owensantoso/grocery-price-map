---
type: plan
id: PLAN-0004
title: Read scale diagnostics
domain: repo-health
status: completed
created_at: "2026-04-29 00:32:25 JST +0900"
updated_at: "2026-04-29 03:43:51 JST +0900"
owner: 
sequence:
  roadmap: "4"
  sort_key: "004"
  lane: repo-health
  after: []
  before: []
areas: []
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
  - package.json
  - vitest.config.ts
repo_state:
  based_on_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
  last_reviewed_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
---

# PLAN-0004 - Read scale diagnostics

## Goal

Turn the remaining read-scale audit findings into bounded diagnostic follow-up work.

This plan routes:

- `FINDING-007`: unbounded all-log reads for public logs/account pages
- `FINDING-008`: possible missing store-leading index for store detail
- `FINDING-016`: repeated log-detail item work that should be considered during query cleanup

## Architecture

The read path is currently server-rendered route entry points backed by `src/lib/queries.ts`. This plan should preserve current product behavior while deciding what needs evidence before scaling or refactor changes.

Target direction:

- Use diagnostics/evidence for query/index concerns before migrations.
- Keep query optimization work downstream of `IMPL-0001-03` characterization coverage.

## Task Dependencies / Parallelization

`IMPL-0004-01` should complete before `IMPL-0005-01` performs broad query/action splitting. Avoid changing `src/lib/queries.ts` until `IMPL-0001-03` has added read-side coverage, except for documentary evidence collection.

## Implementation Tasks

- [x] `IMPL-0004-01` - diagnose feed scaling, store index needs, and log-detail duplicate work.
- [x] Update `AUDT-0001` finding statuses after the evidence/decision is captured.

## Validation

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build
scripts/docs-meta check
scripts/docs-meta review --type audit-findings
```

## Completion Criteria

- Feed/account read-scale risk is accepted, deferred, or routed to a concrete implementation plan.
- Store detail index question has `EXPLAIN` evidence or a documented reason it cannot be checked yet.
- `AUDT-0001` findings `FINDING-007`, `FINDING-008`, and `FINDING-016` are updated.
