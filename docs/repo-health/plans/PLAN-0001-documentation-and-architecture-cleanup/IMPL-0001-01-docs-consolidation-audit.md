---
type: implementation-brief
id: IMPL-0001-01
title: Docs consolidation audit
domain: repo-health
status: completed
created_at: "2026-04-28 22:51:03 JST +0900"
updated_at: "2026-04-28 23:18:00 JST +0900"
parent_plan: PLAN-0001
task_refs: []
owner: 
areas: []
depends_on: []
parallel_with: []
related_specs: []
related_adrs: []
related_sessions:
  - docs/repo-health/session-logs/2026-04-28-docs-consolidation-audit.md
related_issues: []
related_prs: []
linked_paths:
  - AGENTS.md
  - docs/README.md
  - docs/orientation/CURRENT_STATE.md
  - docs/orientation/ARCHITECTURE.md
  - docs/orientation/ROADMAP.md
repo_state:
  based_on_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
  last_reviewed_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
---

# IMPL-0001-01 - Docs consolidation audit

## Parent Plan

- PLAN-0001

## Task Goal

Make the documentation system coherent enough that a future agent can understand the repo without chat history.

## Scope

In scope:

- root `AGENTS.md`
- `docs/README.md`
- `docs/orientation/*`
- links to existing product, architecture, backend, audit, decision, open-question, and deferred docs
- docs-meta checks and link checks

Out of scope:

- code refactors
- resolving product questions
- deleting historical docs unless they are clearly obsolete and replaced

## Execution Steps

1. Read root `AGENTS.md`, `docs/README.md`, and all orientation docs.
2. Search for scaffold placeholders such as `<`, `YYYY-MM-DD`, and `PLAN-<id>`.
3. Verify every old source doc is reachable from either `AGENTS.md`, `docs/README.md`, or an orientation doc.
4. Run docs-meta checks and fix broken repo-local links where practical.
5. Add a dated session log summarizing what changed and what remains.

## Verification

```bash
scripts/docs-meta check
scripts/docs-meta check-links
rg -n "<[^>]+>|YYYY-MM-DD|PLAN-<id>|<repo" AGENTS.md docs
```

## Done Checklist

- [x] First-read path is clear.
- [x] No important existing doc is orphaned from the new docs map.
- [x] Scaffold placeholders are removed or intentionally confined to examples.
- [x] Verification complete.
