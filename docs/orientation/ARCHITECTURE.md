---
type: architecture-overview
title: Architecture
domain: architecture
status: active
created_at: "2026-04-28 22:48:08 JST +0900"
updated_at: "2026-04-29 03:58:20 JST +0900"
owner:
areas: []
related_specs: []
related_plans: []
related_adrs: []
related_sessions: []
repo_state:
  based_on_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
  last_reviewed_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
---

# Architecture

Architecture overview for Grocery Price Map. For the short current truth page, see `docs/orientation/CURRENT_STATE.md`. For the earlier detailed audit notes, see `docs/ARCHITECTURE.md` and `docs/ARCHITECTURE_NOTES.md`.

## Product

Grocery Price Map is a public-read, authenticated-write grocery price tracking app. It centers exact stores, canonical items, append-only price logs, normalized compare results, and log-level evidence through photos, comments, and votes.

## Reality Check

- The app is not a full SPA rewrite. It uses Next App Router route entry points with client components for interactive surfaces.
- The app is not a crawler, OCR system, barcode scanner, or chain analytics product today.
- The current UI leans Tokyo/Japan, but geography is still an open product question.
- If this file and `docs/orientation/CURRENT_STATE.md` disagree, treat `CURRENT_STATE.md` as truth for what exists now.

## Tech Stack

| Layer | Tech |
|---|---|
| App | Next.js App Router, React 19, TypeScript |
| Backend | Supabase Auth, Postgres, Storage, RLS |
| Maps | React Leaflet / Leaflet |
| Validation | Zod |
| Testing | Vitest, ESLint, Next build |

## System Boundaries

- Route entry points live under `src/app`.
- Server actions in `src/app/actions.ts` remain the stable action entry point. Shared action state, auth, rate limiting, and cache invalidation helpers live in `src/lib/action-helpers.ts`; price-log photo upload/removal helpers live in `src/lib/price-log-photo-actions.ts`.
- Query helpers in `src/lib/queries.ts` own read snapshots and Supabase access. Pure row-to-view-model assembly lives in `src/lib/query-read-models.ts`.
- Shared domain/model helpers live under `src/lib`.
- Reusable UI components live under `src/components`.
- Database shape and RLS behavior live under `supabase/migrations`.

## Critical Flows

### Read Path

1. Route component loads a snapshot through `src/lib/queries.ts`.
2. Query helper uses public or server Supabase client depending on auth needs.
3. Rows are mapped into model/view records from `src/lib/models.ts`.
4. Route passes data into client components for interaction-heavy views.

### Write Path

1. Client form or control invokes a server action from `src/app/actions.ts`.
2. Action validates input with Zod and checks authenticated viewer state.
3. Action writes to Supabase, uploads/removes storage objects when needed, and records rate-limit events where applicable.
4. Action revalidates tags/paths and redirects or returns action state.

## Current Pressure Points

- `src/app/actions.ts` still contains the exported server actions, but shared helper logic has been moved out so domain action splitting can happen later if Next server-action constraints make it worthwhile.
- `src/lib/queries.ts` still contains snapshot and Supabase access functions, but pure read-model assembly has been moved out; feed/detail/compare/store snapshot modules may still deserve a later split if they keep growing.
- Map behavior can regress because it combines Leaflet lifecycle, browser APIs, responsive sizing, and React state.
- Public-read plus authenticated-write plus photo storage means security assumptions need explicit docs and tests.

## Replaceability Targets

Layers most likely to change during cleanup:

- Server action organization.
- Query/snapshot module organization.
- View-model mapping helpers.
- Tests around write permissions and compare/feed ordering.

Layers that should change least:

- Product entities: item, store, price log, comment, vote.
- Public-read / authenticated-write model.
- Route-level user journeys unless a product plan changes them.

## Module Layout

```text
src/app/                 Next route entry points, server actions, auth callback
src/components/          Client and shared UI components
src/lib/                 Models, query helpers, pricing, measurement, Supabase helpers
supabase/migrations/     Database schema, policies, storage, rate limits
docs/                    Product, architecture, backend, planning, and repo-health docs
scripts/docs-meta        AGENT-DOCS metadata and generated-view helper
tests/                   Repository tooling smoke tests
```

## Working Rules

- Do not resolve product questions by architecture cleanup.
- Add or strengthen verification before splitting high-gravity modules.
- Keep route components relatively small and data-loading boundaries explicit.
- Prefer extracting existing repeated behavior over inventing broad new abstractions.
