---
type: session-log
title: Combobox and vote control semantics
status: completed
created_at: "2026-04-29 03:23:30 JST +0900"
updated_at: "2026-04-29 03:23:30 JST +0900"
started_at: "2026-04-29 03:19:00 JST +0900"
ended_at: "2026-04-29 03:23:30 JST +0900"
timezone: Asia/Tokyo
participants:
  - Codex
areas:
  - repo-health
  - accessibility
  - forms
related_plans:
  - docs/repo-health/plans/PLAN-0003-contribution-accessibility-fixes/PLAN-0003-contribution-accessibility-fixes.md
related_briefs:
  - docs/repo-health/plans/PLAN-0003-contribution-accessibility-fixes/IMPL-0003-02-combobox-and-vote-control-semantics.md
related_specs: []
related_adrs: []
related_todos: []
commits: []
---

# Combobox And Vote Control Semantics

## Goal

Improve semantics for custom autocomplete and vote controls without changing behavior or layout.

## Changes

- Added stable option IDs and create-row IDs to `AutocompleteField`.
- Added `aria-activedescendant` to point from the combobox input to the active row.
- Included create-action rows in arrow/Enter keyboard behavior.
- Separated committed selection semantics from active-row visual highlight.
- Added accessible names and `aria-pressed` to comment vote buttons.
- Added clearer accessible names and `aria-pressed` to log vote buttons.
- Added component tests for autocomplete active descendants, create-action keyboard activation, and vote pressed states.

## Verification

- Focused component tests: passed locally.
- `vitest run`: 10 files / 30 tests passed locally.
- `eslint .`: passed locally.
- `next build`: passed locally.
- `scripts/docs-meta check`: passed locally.
- `scripts/docs-meta check-links`: passed locally.
- `scripts/docs-meta review --type audit-findings`: passed locally.
