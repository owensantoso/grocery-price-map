---
type: plan
id: PLAN-0003
title: Contribution accessibility fixes
domain: repo-health
status: in_progress
created_at: "2026-04-29 00:29:22 JST +0900"
updated_at: "2026-04-29 03:23:30 JST +0900"
owner: 
sequence:
  roadmap: "3"
  sort_key: "003"
  lane: repo-health
  after:
    - PLAN-0001
  before: []
areas: []
related_specs: []
related_adrs: []
related_sessions:
  - docs/repo-health/session-logs/2026-04-29-keyboard-accessible-store-location-entry.md
  - docs/repo-health/session-logs/2026-04-29-combobox-and-vote-control-semantics.md
related_issues: []
related_prs: []
linked_paths:
  - docs/repo-health/audits/AUDT-0001-mvp-stabilization-risk-audit.md
  - src/components/forms/store-form.tsx
  - src/components/map/store-location-picker.tsx
  - src/components/forms/autocomplete-field.tsx
  - src/components/comments/comment-vote-controls.tsx
  - src/app/globals.css
repo_state:
  based_on_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
  last_reviewed_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
---

# PLAN-0003 - Contribution accessibility fixes

## Goal

Fix the contribution-flow accessibility gaps found in `AUDT-0001` without changing the product’s scope.

This plan routes:

- `FINDING-003`: physical store creation requires mouse/touch map pinning
- `FINDING-012`: custom autocomplete is missing robust active-option semantics
- `FINDING-013`: comment vote buttons lack accessible names/state
- `FINDING-014`: map surfaces need a manual verification path
- `FINDING-019`: custom form controls need consistent focus-visible styling

## Architecture

The current app uses custom client components for contribution flows:

- `StoreForm` plus `StoreLocationPicker` for physical store location entry
- `AutocompleteField` for item/store selection
- log/comment vote controls for lightweight community signals
- Leaflet maps for compare, directory, and store creation

Target direction:

- Keep the existing UI flows recognizable.
- Add keyboard-accessible alternatives where map interaction is currently required.
- Improve semantic labels/states for custom controls.
- Add lightweight component/manual verification instead of introducing a full browser suite immediately.

## Task Dependencies / Parallelization

Recommended order:

1. `IMPL-0003-01` first, because it covers the high-severity keyboard blocker.
2. `IMPL-0003-02` can run independently after or alongside `IMPL-0003-01` if write scopes are separated.
3. `IMPL-0003-03` should run after `IMPL-0003-01` and `IMPL-0003-02`, because it finalizes the manual verification path for the completed UI changes.

## Implementation Tasks

- [x] `IMPL-0003-01` - add keyboard-accessible physical store location entry.
- [x] `IMPL-0003-02` - improve autocomplete and comment vote semantics.
- [ ] `IMPL-0003-03` - add focus-visible styling and a lightweight map/manual verification checklist.
- [ ] Update `AUDT-0001` findings after each slice completes.

## Validation

Baseline validation:

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build
scripts/docs-meta check
scripts/docs-meta review --type audit-findings
```

Manual checks should include keyboard-only store creation, comment vote focus/labels, and map render behavior on mobile and desktop.

## Completion Criteria

- Physical store creation has a keyboard-usable location path.
- Autocomplete exposes enough combobox semantics for keyboard/screen reader verification.
- Comment vote controls have accessible names and state.
- Custom form fields have visible focus states.
- Map surfaces have a documented manual verification checklist.
