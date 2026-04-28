---
type: session-log
title: Keyboard accessible store location entry
status: completed
created_at: "2026-04-29 03:09:48 JST +0900"
updated_at: "2026-04-29 03:09:48 JST +0900"
started_at: "2026-04-29 03:06:00 JST +0900"
ended_at: "2026-04-29 03:09:48 JST +0900"
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
  - docs/repo-health/plans/PLAN-0003-contribution-accessibility-fixes/IMPL-0003-01-keyboard-accessible-store-location-entry.md
related_specs: []
related_adrs: []
related_todos: []
commits: []
---

# Keyboard Accessible Store Location Entry

## Goal

Make physical store creation usable without mouse/touch map pinning.

## Changes

- Added physical-store latitude and longitude number inputs with visible labels.
- Synced numeric inputs with the Leaflet picker state.
- Synced the Leaflet map center when coordinates are typed manually.
- Cleared coordinate inputs when switching to online store mode.
- Updated `storeSchema` to enforce latitude and longitude ranges.
- Added StoreForm component tests and schema validation coverage.
- Updated `AUDT-0001#FINDING-003` and `IMPL-0003-01`.

## Verification

- Focused tests for `StoreForm` and `storeSchema`: passed locally.
- `vitest run`: 8 files / 26 tests passed locally.
- `eslint .`: passed locally.
- `next build`: passed locally.
- `scripts/docs-meta check`: passed locally.
- `scripts/docs-meta check-links`: passed locally.
- `scripts/docs-meta review --type audit-findings`: passed locally.

## Manual Check

Keyboard-only users can now tab to latitude/longitude inputs and submit a physical store without interacting with the map. Pointer users can still click or drag the map marker and see the numeric fields update.
