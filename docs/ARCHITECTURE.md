# Architecture

## Stack

- Next.js App Router
- React 19
- TypeScript
- Supabase Auth + Postgres + Storage
- React Leaflet / Leaflet for maps
- Zod for action validation
- Vitest for unit tests

## Rendering model

The app is not a full SPA rewrite.

Current architecture is:
- server-rendered pages for route entry
- client components for interactive UI
- shared app shell in the root layout
- selective caching for shared and read-heavy data
- client-side navigation through Next links and router transitions

This is intentionally aiming for:
- public URL stability
- refresh/direct-load safety
- SPA-like feel for common navigation

## App shell

Root layout:
- fetches shared shell data
- wraps pages in `AppShell`

Shared shell data currently includes:
- viewer
- items
- stores

The header contains:
- brand lockup
- header search
- primary nav
- account menu

This allows the shell to stay conceptually persistent while page content changes below it.

## Route structure

### Public read routes

- `/`
- `/logs`
- `/logs/[logId]`
- `/stores`
- `/stores/[storeId]`
- `/items`

### Signed-in contribution routes

- `/prices/new`
- `/logs/[logId]/edit`
- `/account`
- `/settings`

### Auth routes

- `/auth/sign-in`
- `/auth/callback`

## Data loading pattern

The app currently uses a mixed strategy:

- server-side route entry points for major pages
- cached query helpers in `src/lib/queries.ts`
- a public Supabase client for public-read queries
- a server Supabase client for auth-aware queries and mutations

Key principle:
- shared reference data is cached more aggressively
- page-specific feed/detail data is cached briefly and revalidated after writes

## Query organization

Current query layer responsibilities:

- `getViewer()`
- `getItems()`
- `getStores()`
- `getComparisonSnapshot()`
- `getPriceEntrySnapshot()`
- `getPriceLogsSnapshot()`
- `getAccountSettingsSnapshot()`
- `getEditablePriceLogSnapshot()`
- `getPriceLogDetail()`
- `getStoreDetail()`

These snapshot helpers are the main server-facing boundary between pages and Supabase.

## Interaction-heavy client components

Examples:
- compare dashboard
- compare map
- autocomplete fields
- price log form
- comment thread
- log vote controls
- account menu
- header search

These are kept client-side because they need:
- form state
- router transitions
- optimistic or pending UI
- browser APIs
- map interactivity

## Shared UI patterns

### Shared log feed

`PriceLogFeed` + `PriceLogCard` are now reused across:
- public logs
- my logs
- store page recent logs
- log detail recent item logs
- compare selected store history

This is an important architecture choice because the app repeatedly presents “lists of logs with minor variations”.

### Shared autocomplete pattern

The app uses one autocomplete component for:
- item selection
- store selection
- header search

## Mutation model

Most writes are handled through Next server actions in `src/app/actions.ts`.

These actions are responsible for:
- validation
- auth enforcement
- rate limiting
- Supabase writes
- revalidation
- redirects

## Caching and revalidation intent

Current intended cache shape:

- heavily reused reference data:
  - items
  - stores
  - viewer shell state

- more frequently changing content:
  - compare snapshot
  - logs feed
  - store detail
  - log detail

Mutations revalidate:
- broad log tags
- specific item/store/log tags where available
- key route paths after writes

## Map architecture

The app uses:
- Leaflet tiles
- client-only dynamic map loading
- compare page map
- store location picker map

Current map behavior includes:
- compare markers for store latest prices
- user-location overlay on compare page
- selectable store state tied to compare sidebar/history
- manual pin placement for store creation

## Known architectural pressure points

- map behavior is easy to regress because it mixes Leaflet lifecycle with React state
- the action layer is doing a lot: validation, file upload, redirects, rate limiting, revalidation
- the query layer is growing into a central service layer and should stay disciplined
- public-read plus auth-write plus storage/file upload means the security model needs to stay explicit
