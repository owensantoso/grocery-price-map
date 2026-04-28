---
type: implementation-brief
id: IMPL-0006-04
title: Public photo warning and UI resilience
domain: repo-health
status: draft
created_at: "2026-04-29 05:25:00 JST +0900"
updated_at: "2026-04-29 05:25:00 JST +0900"
parent_plan: PLAN-0006
task_refs:
  - AUDT-0002#FINDING-009
  - AUDT-0002#FINDING-017
  - AUDT-0002#FINDING-019
owner:
areas:
  - ui-resilience
  - privacy
depends_on: []
parallel_with:
  - IMPL-0006-05
related_specs: []
related_adrs: []
related_sessions: []
related_issues: []
related_prs: []
linked_paths:
  - src/components/forms/price-log-form.tsx
  - src/components/compare/comparison-map.tsx
  - src/components/stores/store-directory-map.tsx
  - src/components/map/store-location-picker.tsx
  - src/components/navigation/header-search.tsx
  - docs/repo-health/debugging/map-manual-verification.md
repo_state:
  based_on_commit: 81ec608aea076e5ca7bde8eae8466d838c68033f
  last_reviewed_commit: 81ec608aea076e5ca7bde8eae8466d838c68033f
---

# IMPL-0006-04 - Public Photo Warning and UI Resilience

## Parent Plan

- PLAN-0006

## Task Goal

Fix small user-safety and browser-resilience gaps that are clear from the audit and do not require adding moderation or product policy.

## Scope

In scope:

- add an upload-time warning that price-log photos are public
- reuse or extract map resize/orientation invalidation behavior for non-compare map surfaces
- add Escape/keyboard close handling to the mobile header search overlay
- update the map manual verification notes if behavior changes

Out of scope:

- photo reporting, takedown, moderation, or admin review
- page-level browser automation coverage
- changing map provider or map clustering behavior
- redesigning the global header

## Execution Steps

1. Inspect `comparison-map`, `store-directory-map`, and `store-location-picker` for resize/orientation handling differences.
2. Extract the smallest shared map lifecycle helper or duplicate the established behavior only where extraction would be heavier.
3. Add a concise public-photo warning near the upload control in `price-log-form`.
4. Add Escape handling and keyboard-close behavior to `header-search`, matching the account menu pattern where possible.
5. Update manual map verification docs if new shared behavior changes the checklist.

## Verification

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build
scripts/docs-meta check
```

Manual verification:

- Confirm the photo warning is visible before upload submission.
- Confirm store directory and location picker maps recover after resize/orientation changes.
- Confirm mobile search opens, accepts typing, closes with Escape, and returns focus sensibly.

## Done Checklist

- [ ] Public photo upload warning exists.
- [ ] Non-compare map surfaces have resize/orientation hardening or a documented reason.
- [ ] Mobile search closes from keyboard.
- [ ] `AUDT-0002#FINDING-009`, `AUDT-0002#FINDING-017`, and `AUDT-0002#FINDING-019` are updated.
