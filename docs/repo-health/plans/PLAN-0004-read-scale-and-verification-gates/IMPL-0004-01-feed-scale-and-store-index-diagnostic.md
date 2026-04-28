---
type: implementation-brief
id: IMPL-0004-01
title: Feed scale and store index diagnostic
domain: repo-health
status: draft
created_at: "2026-04-29 00:32:25 JST +0900"
updated_at: "2026-04-29 01:01:18 JST +0900"
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
related_sessions: []
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

1. Document current query shapes and expected growth pressure.
2. If a local Supabase dataset is available, run `EXPLAIN` for store-detail reads.
3. Decide whether pagination/account-specific reads should be planned now or deferred.
4. Decide whether log-detail duplicate assembly belongs in `IMPL-0005-01`; if yes, update that brief's scope or task refs in the same change.
5. Update audit findings with evidence and routes.

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

- [ ] Store index question has evidence or a documented blocker.
- [ ] Feed/account read-scale risk has a route or accepted-risk rationale.
- [ ] Log-detail duplicate work is routed or accepted.
- [ ] Audit findings updated.
