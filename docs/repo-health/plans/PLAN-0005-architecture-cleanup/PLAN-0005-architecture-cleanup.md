---
type: plan
id: PLAN-0005
title: Architecture cleanup
domain: repo-health
status: completed
created_at: "2026-04-29 01:40:51 JST +0900"
updated_at: "2026-04-29 03:58:20 JST +0900"
owner: 
sequence:
  roadmap: "5"
  sort_key: "005"
  lane: repo-health
  after:
    - PLAN-0001
    - PLAN-0002
    - PLAN-0004
  before: []
areas: []
related_specs: []
related_adrs: []
related_sessions:
  - docs/repo-health/session-logs/2026-04-29-action-query-module-split.md
related_issues: []
related_prs: []
linked_paths:
  - docs/repo-health/audits/AUDT-0001-mvp-stabilization-risk-audit.md
  - src/app/actions.ts
  - src/lib/queries.ts
  - src/lib/action-helpers.ts
  - src/lib/price-log-photo-actions.ts
  - src/lib/query-read-models.ts
  - src/lib/models.ts
  - src/lib/supabase/server.ts
  - src/lib/supabase/public.ts
repo_state:
  based_on_commit: a9d2b24a102241dda4fbec22eff3bbeecb041c1b
  last_reviewed_commit: a9d2b24a102241dda4fbec22eff3bbeecb041c1b
---

# PLAN-0005 - Architecture cleanup

## Goal

Split the largest action/query modules only after verification, characterization coverage, backend write-integrity, and read-scale diagnostics have been addressed.

This plan intentionally sits after the stabilization plans. It exists so implementation numbering matches expected execution order: protective work first, broad cleanup last.

## Architecture

Current architecture is coherent enough to preserve:

- Next App Router route entry points under `src/app`
- server actions for writes in `src/app/actions.ts`
- query snapshots/read assembly in `src/lib/queries.ts`
- shared domain helpers in `src/lib`
- shared UI components under `src/components`
- Supabase migrations as backend source of truth

The cleanup should improve module boundaries without changing product behavior.

## Task Dependencies / Parallelization

Run this plan after:

1. `IMPL-0001-02` records the verification gate.
2. `IMPL-0001-03` adds focused characterization coverage.
3. `IMPL-0002-01` records the backend write-integrity boundary.
4. `IMPL-0004-01` records read-scale and log-detail duplication evidence.

Do not make overlapping edits to `actions.ts` and `queries.ts` in parallel unless the write scopes are explicitly disjoint.

## Implementation Tasks

- [x] `IMPL-0005-01` - split action/query gravity wells into smaller modules while preserving behavior.
- [x] Update architecture docs only if module boundaries actually change.
- [x] Update `AUDT-0001` findings after implementation.
- [x] Record a session log when the brief completes.

## Validation

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build
scripts/docs-meta check
scripts/docs-meta review --type audit-findings
```

## Completion Criteria

- `actions.ts` and `queries.ts` are smaller or a blocked reason is documented.
- Public route behavior is preserved.
- Imports remain understandable.
- Architecture docs match any actual module-boundary changes.
- Verification commands pass or failures are documented with a reason and next action.
