---
type: implementation-brief
id: IMPL-0003-03
title: Form focus styling and map verification
domain: repo-health
status: draft
created_at: "2026-04-29 00:29:33 JST +0900"
updated_at: "2026-04-29 01:01:18 JST +0900"
parent_plan: PLAN-0003
task_refs:
  - AUDT-0001#FINDING-014
  - AUDT-0001#FINDING-019
owner:
areas: []
depends_on:
  - IMPL-0003-01
  - IMPL-0003-02
parallel_with: []
related_specs: []
related_adrs: []
related_sessions: []
related_issues: []
related_prs: []
linked_paths:
  - docs/repo-health/audits/AUDT-0001-mvp-stabilization-risk-audit.md
  - src/app/globals.css
  - src/components/compare/comparison-map.tsx
  - src/components/map/store-location-picker.tsx
  - src/components/stores/store-directory-map.tsx
repo_state:
  based_on_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
  last_reviewed_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
---

# IMPL-0003-03 - Form Focus Styling And Map Verification

## Parent Plan

- PLAN-0003

## Task Goal

Make focus visibility and map verification explicit enough that future UI work can be checked consistently.

## Scope

In scope:

- `AUDT-0001#FINDING-014`
- `AUDT-0001#FINDING-019`
- focus-visible styling for `.input`, `.select`, and `.textarea`
- manual map verification checklist for compare map, store directory map, and store picker map

Out of scope:

- full Playwright/axe suite
- replacing Leaflet
- broad visual redesign

## Implementation Assumptions

- This slice should stay small: focus styling plus durable verification notes.
- The project is not ready to require full browser automation for every map path.
- Manual checks are acceptable if they are explicit, repeatable, and linked from the audit finding.

## Preferred Approach

Use the existing visual language for button/link focus as the reference. Add focus-visible styling to the shared form classes rather than one-off component rules where possible.

Create the map checklist at `docs/repo-health/debugging/map-manual-verification.md` unless a more specific verification folder exists by then. The checklist should be short enough to run before releases or map-touching changes.

Required checklist coverage:

- `/` compare map at desktop `1280x800` and mobile `390x844`, with an item selected so markers render.
- `/stores` directory map at desktop and mobile sizes with at least one physical store.
- `/stores/new` or the active store creation route with physical-store mode enabled.
- Initial render, marker display, marker selection/popup behavior, resize/orientation behavior, and geolocation denial if prompted.
- Keyboard tab order around map surfaces and confirmation that focus does not become trapped.
- Whether `?debug=1` exists and should be used; if it does not exist, say so rather than inventing it.

## Execution Steps

1. Add minimal focus-visible styling consistent with existing buttons/links.
2. Create or update `docs/repo-health/debugging/map-manual-verification.md` for map surfaces.
3. Include mobile/desktop, resize/orientation, marker selection, geolocation denial, and keyboard alternatives.
4. Update audit findings.

## Handoff Notes

- Do not introduce a new color system just for focus states.
- Include exact surfaces in the checklist: compare map, store directory map, and store picker map.
- Link the checklist from `AUDT-0001` when resolving or deferring the map verification finding.
- Include required route/data setup so the checklist can be repeated by another agent.

## Verification

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build
```

Manual:

- keyboard tab through forms and verify focus visibility
- check compare/store-directory/store-picker map render at mobile and desktop sizes
- deny geolocation where prompted and confirm the UI still works

## Done Checklist

- [ ] Form focus-visible styling added.
- [ ] Map verification checklist exists.
- [ ] Manual checks documented.
- [ ] `AUDT-0001#FINDING-014` and `AUDT-0001#FINDING-019` updated.
