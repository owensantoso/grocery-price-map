---
type: implementation-brief
id: IMPL-0002-02
title: Photo mutation compensation
domain: repo-health
status: draft
created_at: "2026-04-29 00:25:41 JST +0900"
updated_at: "2026-04-29 01:01:18 JST +0900"
parent_plan: PLAN-0002
task_refs:
  - AUDT-0001#FINDING-004
owner:
areas: []
depends_on:
  - IMPL-0002-01
parallel_with: []
related_specs: []
related_adrs: []
related_sessions: []
related_issues: []
related_prs: []
linked_paths:
  - docs/repo-health/audits/AUDT-0001-mvp-stabilization-risk-audit.md
  - src/app/actions.ts
  - src/lib/photos.ts
  - supabase/migrations/202603220001_comments_and_photos.sql
repo_state:
  based_on_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
  last_reviewed_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
---

# IMPL-0002-02 - Photo Mutation Compensation

## Parent Plan

- PLAN-0002

## Task Goal

Reduce orphaned-photo and missing-photo-row failure modes while preserving the current single-photo-per-log behavior.

## Scope

In scope:

- `AUDT-0001#FINDING-004`
- create-log upload then insert failure
- update-log new-photo upload and old-photo removal ordering
- delete-log photo removal and row deletion ordering
- logging and cleanup behavior when storage remove fails

Out of scope:

- multi-photo support
- derivative image pipeline
- moderation queues
- storage quota or scheduled cleanup jobs unless needed as a minimal compensation path

## Implementation Assumptions

- The app keeps the current single optional photo per price log.
- Supabase Storage and Postgres cannot be made truly atomic together in this slice.
- The goal is to minimize bad states and make the remaining bad states observable or documented.
- Photo cleanup should not block the user forever if the primary database mutation already succeeded.

## Preferred Approach

Treat each flow as a small state machine and document the selected compensation:

- create: upload new photo, write row, remove uploaded photo if row creation fails
- update with replacement: upload new photo, update row to new path, then remove old photo; if row update fails, remove the new upload
- update without replacement: leave photo behavior unchanged
- delete: delete or mark row first according to current behavior, then remove storage object; if storage remove fails, log enough path context to clean up later without leaking private user data

Prefer extracting tiny helper functions only if it makes failure-path tests possible without pulling all of `actions.ts` into a test.

Implementation contract:

- Split photo upload from old-photo removal; do not use a helper that removes the previous photo before the database row points at the new photo.
- Create flow: upload new photo, insert row, remove the new photo if row insert fails.
- Update replacement flow: upload new photo, update row, then remove old photo only after the row update succeeds; remove the new photo if row update fails.
- Delete flow: preserve current row-delete semantics, then remove the storage object; if storage removal fails, log sanitized cleanup evidence and document the accepted orphan risk.

## Execution Steps

1. Map current storage/DB ordering in create, update, and delete actions.
2. Add or extract tests around failure-path helpers if feasible.
3. Implement the upload-only, DB-write, then cleanup ordering above.
4. Keep console logging sanitized and useful.
5. Update backend docs and audit finding resolution.

## Handoff Notes

- Include a before/after table for create, update, and delete ordering.
- State which failures are compensated automatically and which remain accepted MVP risk.
- If no automated failure-path test is practical, include a manual check with mocked or forced storage/DB failure instructions.

## Verification

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build
```

Attach evidence for at least one compensated failure path and one normal create/update/delete path.

## Done Checklist

- [ ] Create/update/delete photo failure modes are explicitly handled.
- [ ] Any accepted orphan/missing-photo risk is documented.
- [ ] Tests or manual checks cover at least one failure path.
- [ ] `AUDT-0001#FINDING-004` updated.
