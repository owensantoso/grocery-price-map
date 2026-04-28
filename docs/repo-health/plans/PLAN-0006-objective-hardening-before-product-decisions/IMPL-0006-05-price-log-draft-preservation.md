---
type: implementation-brief
id: IMPL-0006-05
title: Price log draft preservation
domain: repo-health
status: completed
created_at: "2026-04-29 05:25:00 JST +0900"
updated_at: "2026-04-29 08:47:30 JST +0900"
parent_plan: PLAN-0006
task_refs:
  - AUDT-0002#FINDING-018
owner:
areas:
  - forms
  - workflow-resilience
depends_on: []
parallel_with:
  - IMPL-0006-04
related_specs: []
related_adrs: []
related_sessions: []
related_issues: []
related_prs: []
linked_paths:
  - src/components/forms/price-log-form.tsx
  - src/lib/price-log-draft.ts
  - src/lib/price-log-draft.test.ts
  - src/app/actions.ts
  - src/app/prices/new/page.tsx
repo_state:
  based_on_commit: 81ec608aea076e5ca7bde8eae8466d838c68033f
  last_reviewed_commit: 81ec608aea076e5ca7bde8eae8466d838c68033f
---

# IMPL-0006-05 - Price Log Draft Preservation

## Parent Plan

- PLAN-0006

## Task Goal

Prevent users from losing entered price-log form data when they create a missing item or store from the price-log flow.

## Scope

In scope:

- preserve price-log draft fields across the existing create-missing-item and create-missing-store roundtrip
- restore draft fields after returning to `/prices/new`
- clear the preserved draft after a successful price-log submission
- avoid persisting uploaded file blobs unless the existing browser APIs make that safe and simple
- add focused tests for any pure draft serialization helpers

Out of scope:

- redesigning item/store creation as inline modals
- changing the create item/store product flow
- preserving photo file inputs across navigation if that requires a large upload/session architecture
- adding account-level saved drafts

## Execution Steps

1. Map the current price-log form state and redirect parameters for missing item/store creation.
2. Choose the smallest browser-local preservation mechanism, preferably `sessionStorage`, for non-file draft fields.
3. Serialize only safe scalar fields: item/store selection, price, date, tax flag, package info, notes, and location context where applicable.
4. Restore the draft when the form remounts after entity creation.
5. Clear the draft on successful price-log creation and when the user intentionally resets/leaves the flow if such a control exists.
6. Add tests for serialization/restore helpers and document any file-input limitation in the UI only if necessary.

## Implementation Notes

- New price-log forms use `sessionStorage` to preserve a versioned scalar-only draft before navigating to create a missing item or store.
- Restoring a draft prefers the just-created item/store from `/prices/new?prefillItem=...` or `prefillStore=...`, then fills the opposite selected entity from the saved draft when the ID still exists.
- Photo data URLs and file inputs are intentionally excluded from the draft payload. When a draft is restored, the form warns that any photo must be added again.
- Edit forms with `initialLog` do not read or write the new-log draft.
- On submit, the stored draft is cleared before navigation; if the server action returns an error instead of redirecting, the draft is restored from an in-memory pending copy.

## Verification

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build
scripts/docs-meta check
```

Manual verification:

- Enter a partial price log, create a missing item, return, and confirm the draft survives.
- Enter a partial price log, create a missing store, return, and confirm the draft survives.
- Submit a valid price log and confirm the saved draft is cleared.

## Done Checklist

- [x] Draft state survives missing item creation.
- [x] Draft state survives missing store creation.
- [x] Draft is cleared after successful price-log submission.
- [x] File-input limitations are handled deliberately.
- [x] `AUDT-0002#FINDING-018` is updated.
