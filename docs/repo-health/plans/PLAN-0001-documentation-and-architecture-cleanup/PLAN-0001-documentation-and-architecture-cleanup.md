---
type: plan
id: PLAN-0001
title: Documentation and architecture cleanup
domain: repo-health
status: in_progress
created_at: "2026-04-28 22:50:49 JST +0900"
updated_at: "2026-04-28 23:11:14 JST +0900"
owner: 
sequence:
  roadmap: "1"
  sort_key: "001"
  lane: repo-health
  after: []
  before: []
areas: []
related_specs: []
related_adrs: []
related_sessions:
  - docs/repo-health/session-logs/2026-04-28-docs-consolidation-audit.md
related_issues: []
related_prs: []
linked_paths:
  - docs/orientation/CURRENT_STATE.md
  - docs/orientation/ARCHITECTURE.md
  - docs/orientation/ROADMAP.md
  - docs/AUDIT_GAPS.md
  - src/app/actions.ts
  - src/lib/queries.ts
repo_state:
  based_on_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
  last_reviewed_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
---

# PLAN-0001 - Documentation and architecture cleanup

## Goal

Turn Grocery Price Map from a fast-built MVP into a documented, reviewable, steadily improvable codebase without restarting from scratch.

This plan covers the first cleanup track:

- make docs/navigation reliable enough for future sessions
- identify code hotspots with evidence
- add focused tests before refactoring risky areas
- split the largest action/query modules once behavior is protected
- leave product expansion decisions unresolved until the user chooses them

## Architecture

Current architecture is coherent enough to preserve:

- Next App Router route entry points under `src/app`
- server actions for writes in `src/app/actions.ts`
- query snapshots/read assembly in `src/lib/queries.ts`
- shared domain helpers in `src/lib`
- shared UI components under `src/components`
- Supabase migrations as backend source of truth

The cleanup should improve module boundaries without changing product behavior. If a task discovers a product ambiguity, record it in docs and pause that direction instead of hiding the decision inside refactor work.

## Task Dependencies / Parallelization

Sequential dependencies:

1. `IMPL-0001-01` docs consolidation should happen first so future work has a clean read path.
2. `IMPL-0001-02` risk coverage should happen before major module splitting.
3. `IMPL-0001-03` action/query splitting should use the tests and audit notes from the first two briefs.

Potential parallel work after `IMPL-0001-01`:

- one person/agent can audit `src/app/actions.ts`
- another can audit `src/lib/queries.ts`
- another can inspect UI/component repetition

Do not make overlapping edits to `actions.ts` and `queries.ts` in parallel unless the write scopes are explicitly disjoint.

## Implementation Tasks

- [x] `IMPL-0001-01` - consolidate AGENT-DOCS navigation, remove placeholders, and reconcile old docs with the new orientation path.
- [ ] `IMPL-0001-02` - add or improve focused tests around the flows most likely to regress during cleanup.
- [ ] `IMPL-0001-03` - split action/query gravity wells into smaller modules while preserving behavior.
- [ ] Record a session log when each brief completes.
- [ ] Update `docs/orientation/CURRENT_STATE.md` after the plan materially changes the repo.

## Validation

Baseline validation for each implementation brief:

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build
scripts/docs-meta check
scripts/docs-meta check-links
```

## Completion Criteria

- Root `AGENTS.md` and `docs/README.md` give a clear first-read path.
- New orientation docs are truthful and free of scaffold placeholders.
- Existing docs are either linked from the new structure or intentionally superseded.
- Risky user flows have focused test coverage before large refactors.
- `actions.ts` and `queries.ts` are smaller or have an explicit follow-up plan if splitting is deferred.
- Verification commands pass or failures are documented with a reason and next action.
