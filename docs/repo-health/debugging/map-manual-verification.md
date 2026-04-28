---
type: testing-guide
title: Map Manual Verification
domain: repo-health
status: active
created_at: "2026-04-29 03:31:10 JST +0900"
updated_at: "2026-04-29 03:31:10 JST +0900"
owner:
areas:
  - maps
  - accessibility
related_plans:
  - docs/repo-health/plans/PLAN-0003-contribution-accessibility-fixes/PLAN-0003-contribution-accessibility-fixes.md
related_sessions:
  - docs/repo-health/session-logs/2026-04-29-form-focus-styling-and-map-verification.md
---

# Map Manual Verification

Use this checklist before releases or changes touching Leaflet, map sizing, store coordinates, item selection, or geolocation.

## Setup

- Run the app locally with demo data or a database that has at least one physical store with latitude and longitude.
- Test desktop at `1280x800`.
- Test mobile at `390x844`.
- For `/`, select an item that has at least one latest price log at a physical store so compare markers render.
- For `/stores`, confirm at least one physical store is present so the directory map renders instead of the empty state.
- For store creation, use `/stores` while signed in; this app does not currently define a `/stores/new` route. Enable physical-store mode. A marker only appears after latitude/longitude are entered or the map is clicked.

## Debug Flag

Code check on 2026-04-29:

- `?debug=1` is supported by `src/components/debug/use-debug-flag.ts`.
- `src/components/compare/comparison-map.tsx` uses `useDebugFlag()` and shows map debug output with entry counts, selected store ID, container size, tile loads, tile errors, and a load note.
- `src/components/stores/store-directory-map.tsx` does not use `useDebugFlag()`.
- `src/components/map/store-location-picker.tsx` does not use `useDebugFlag()`.

Use `/?debug=1` for the compare map when diagnosing sizing, tile loading, or selected-store state. Do not expect debug panels on `/stores`.

## Compare Map: `/`

Run at `1280x800` and `390x844`.

- Initial render: the map surface appears without a blank gray/white canvas after tiles load.
- Marker display: one marker appears for each selected-item entry whose store has coordinates.
- Marker selection: selecting a store from the result list changes the selected map marker styling.
- Marker popup: activating a marker opens a popup with store name and normalized price.
- Resize/orientation: resize from desktop to mobile, then back; on mobile, rotate or simulate orientation change. The map remains visible and markers stay inside the usable viewport.
- Geolocation denial: choose `Show my location`, deny permission if prompted, and confirm the inline error appears while markers remain usable.
- Keyboard order: tab into controls before and after the map, including `Show my location`; continue tabbing past the map and confirm focus is not trapped.
- Debug: repeat once with `/?debug=1` and confirm the debug panel updates container size and tile counts without covering required controls.

## Store Directory Map: `/stores`

Run at `1280x800` and `390x844`.

- Initial render: the map appears when at least one physical store exists.
- Marker display: each physical store with coordinates gets a visible circle marker.
- Marker popup: activating a marker opens a popup with store name and store link.
- Resize/orientation: resize from desktop to mobile, then back; on mobile, rotate or simulate orientation change. The map remains visible and markers stay inside the usable viewport.
- Geolocation denial: no geolocation prompt is expected on this route.
- Keyboard order: tab through the page content before and after the map and confirm focus is not trapped.
- Debug: `?debug=1` is not expected to add map debug output on this route.

## Store Picker Map: `/stores`

Run at `1280x800` and `390x844` while signed in, with the store creation form visible and physical-store mode enabled.

- Initial render: the map appears centered near the default Tokyo center when no coordinates are set.
- Marker display: enter valid latitude and longitude, or click the map; a marker appears at the selected position.
- Marker update: edit latitude/longitude fields and confirm the marker recenters; drag the marker and confirm the coordinate fields update.
- Resize/orientation: resize from desktop to mobile, then back; on mobile, rotate or simulate orientation change. The map remains visible and the marker stays reachable.
- Geolocation denial: no geolocation prompt is expected on this route.
- Keyboard order: tab from store type controls to latitude/longitude inputs, then through controls after the map. Confirm keyboard users can set coordinates with the inputs and focus is not trapped by the map.
- Debug: `?debug=1` is not expected to add map debug output on this route.
