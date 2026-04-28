---
type: implementation-brief
id: IMPL-0003-02
title: Combobox and vote control semantics
domain: repo-health
status: completed
created_at: "2026-04-29 00:29:33 JST +0900"
updated_at: "2026-04-29 03:23:30 JST +0900"
parent_plan: PLAN-0003
task_refs:
  - AUDT-0001#FINDING-012
  - AUDT-0001#FINDING-013
owner:
areas: []
depends_on: []
parallel_with:
  - IMPL-0003-01
related_specs: []
related_adrs: []
related_sessions:
  - docs/repo-health/session-logs/2026-04-29-combobox-and-vote-control-semantics.md
related_issues: []
related_prs: []
linked_paths:
  - docs/repo-health/audits/AUDT-0001-mvp-stabilization-risk-audit.md
  - src/components/forms/autocomplete-field.tsx
  - src/components/forms/autocomplete-field.test.tsx
  - src/components/comments/comment-vote-controls.tsx
  - src/components/comments/comment-vote-controls.test.tsx
  - src/components/logs/log-vote-controls.tsx
  - src/components/logs/log-vote-controls.test.tsx
repo_state:
  based_on_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
  last_reviewed_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
---

# IMPL-0003-02 - Combobox And Vote Control Semantics

## Parent Plan

- PLAN-0003

## Task Goal

Improve semantics for custom selection and voting controls without redesigning their UI.

## Scope

In scope:

- `AUDT-0001#FINDING-012`
- `AUDT-0001#FINDING-013`
- `AutocompleteField` active option IDs and `aria-activedescendant`
- comment and log vote button accessible names and state
- small keyboard/component tests if feasible

Out of scope:

- replacing the autocomplete component
- changing voting behavior or scoring
- broad navigation/header redesign

## Implementation Assumptions

- The current autocomplete remains a custom component for this slice.
- Existing keyboard selection behavior should remain recognizable.
- Vote controls should expose the action and current state without changing the visual layout.

## Preferred Approach

For `AutocompleteField`, align with the combobox/listbox pattern already implied by the component:

- input owns `role="combobox"`, `aria-expanded`, `aria-controls`, and `aria-activedescendant` when an option is active
- list owns a stable ID and `role="listbox"`
- each option owns a stable ID and `role="option"`
- active option and selected value semantics are kept distinct
- create-action rows use the same option ID/role pattern or a documented accessible equivalent
- filtered results keep `aria-activedescendant` pointing at an existing option
- `Escape` closes the popup without changing the selected value
- `Enter` selects the active option or create action according to current product behavior

For votes, ensure both comment and log vote controls expose current vote state. Comment vote buttons need accessible names and state; log vote buttons already have clearer labels but should also expose pressed/current-vote state. Do not change score calculation or submission behavior.

## Execution Steps

1. Add stable option IDs and active-descendant behavior to `AutocompleteField`.
2. Clarify active vs selected option semantics.
3. Add accessible names/state to comment vote buttons, matching the log vote control style where appropriate.
4. Add or confirm current-vote state on log vote buttons.
5. Add a small test for keyboard selection and/or vote button labels if practical.
6. Update `AUDT-0001#FINDING-012` and `AUDT-0001#FINDING-013`.

## Implementation Notes

- `AutocompleteField` now assigns stable IDs to normal options and create-action rows.
- The combobox input sets `aria-activedescendant` to the currently active row when the popup is open.
- Arrow navigation includes the create-action row, and Enter activates it when highlighted.
- Normal option `aria-selected` now reflects the committed selected value, while the visual highlight remains separate.
- Comment vote controls now expose `Upvote comment` / `Downvote comment` labels and `aria-pressed`.
- Log vote controls now expose `Upvote price log` / `Downvote price log` labels and `aria-pressed`.
- Component tests cover active-descendant behavior, create-action keyboard activation, and vote pressed states.

## Handoff Notes

- Include at least one example of generated option IDs in the notes or tests.
- Confirm IDs remain stable across render and filtering enough for `aria-activedescendant` to point at an existing element.
- Confirm upvote/downvote labels distinguish comment votes from log votes when both appear near each other.
- Confirm create-action rows are reachable and announced consistently with normal options.

## Verification

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build
```

Manual:

- use arrow keys and Enter to select an autocomplete option
- use Enter on a create-action row
- use Escape to close the list without changing the selected value
- inspect the active option relationship in the DOM
- tab to comment and log vote controls and confirm accessible names/states are meaningful

## Done Checklist

- [x] Autocomplete active option semantics improved.
- [x] Comment and log vote controls have accessible names/state.
- [x] Keyboard/component verification added or documented.
- [x] Audit findings updated.
