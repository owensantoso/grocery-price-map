---
type: implementation-brief
id: IMPL-0003-01
title: Keyboard accessible store location entry
domain: repo-health
status: completed
created_at: "2026-04-29 00:29:33 JST +0900"
updated_at: "2026-04-29 03:09:48 JST +0900"
parent_plan: PLAN-0003
task_refs:
  - AUDT-0001#FINDING-003
owner:
areas: []
depends_on: []
parallel_with: []
related_specs: []
related_adrs: []
related_sessions:
  - docs/repo-health/session-logs/2026-04-29-keyboard-accessible-store-location-entry.md
related_issues: []
related_prs: []
linked_paths:
  - docs/repo-health/audits/AUDT-0001-mvp-stabilization-risk-audit.md
  - src/components/forms/store-form.tsx
  - src/components/forms/store-form.test.tsx
  - src/components/map/store-location-picker.tsx
  - src/app/actions.ts
  - src/lib/action-validation.ts
  - src/lib/action-validation.test.ts
repo_state:
  based_on_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
  last_reviewed_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
---

# IMPL-0003-01 - Keyboard Accessible Store Location Entry

## Parent Plan

- PLAN-0003

## Task Goal

Make physical store creation usable without mouse/touch map pinning.

## Scope

In scope:

- `AUDT-0001#FINDING-003`
- physical-store coordinate entry or keyboard pin controls
- preserving current map picker behavior for pointer users
- manual keyboard-only verification

Out of scope:

- geocoding/address search
- changing store model geography assumptions
- replacing Leaflet

## Implementation Assumptions

- Physical stores still require valid coordinates.
- Online stores should continue to skip coordinate requirements.
- The pointer map picker remains useful and should stay available.
- The keyboard-accessible path can be plain numeric latitude/longitude entry if that is the smallest reliable fix.

## Preferred Approach

Use explicit latitude/longitude numeric inputs as the keyboard-accessible path. Numeric inputs are easier to validate, test, and explain to assistive tech than keyboard-nudging the map pin. The map picker should stay in sync with these fields, but the map is no longer the only way to provide coordinates.

Acceptance details:

- Latitude input accepts numeric values in `[-90, 90]`.
- Longitude input accepts numeric values in `[-180, 180]`.
- Inputs have visible labels, reachable validation errors, and `aria-describedby`/error association when invalid.
- Updating the numeric inputs updates submitted coordinate values and the map marker.
- Clicking or dragging the map marker updates the numeric inputs.
- Switching to online-store mode clears or ignores coordinate requirements as current server validation expects.

Do not add geocoding or address search in this slice; that is a separate product feature.

## Execution Steps

1. Confirm the current physical-store validation requirements in `createStoreAction`.
2. Add explicit latitude/longitude inputs for physical stores.
3. Keep hidden form fields and server validation consistent.
4. Add focused tests if practical; otherwise document manual keyboard verification.
5. Update `AUDT-0001#FINDING-003`.

## Implementation Notes

- Physical store mode now exposes labeled latitude and longitude number inputs before the map picker.
- Latitude is constrained to `[-90, 90]`; longitude is constrained to `[-180, 180]`.
- Numeric input changes update the submitted coordinate state and the map marker.
- Pointer map clicks and marker drags still update the same coordinate state, so the visible inputs and submitted values stay in sync.
- Online store mode clears coordinates and submits empty hidden coordinate fields.
- Server validation now enforces coordinate ranges in `storeSchema`.
- Component tests cover keyboard coordinate entry, map-picker synchronization, and online-mode coordinate clearing.
- Schema tests cover physical coordinate range validation.

## Handoff Notes

- Document the chosen coordinate input UX in the session log.
- Verify keyboard users can switch store type, enter required store fields, provide coordinates, submit, and recover from validation errors.
- Ensure map marker state, visible numeric fields, and submitted values do not diverge.

## Verification

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build
```

Manual:

- create a physical store using keyboard only
- verify online-store creation still does not require coordinates
- verify invalid latitude/longitude values produce reachable validation feedback

## Done Checklist

- [x] Physical store location can be supplied without pointer input.
- [x] Existing map picker still works.
- [x] Server validation remains consistent.
- [x] `AUDT-0001#FINDING-003` updated.
