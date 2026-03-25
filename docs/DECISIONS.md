# Decisions

This file records decisions that already appear intentional in the codebase and product behavior.

## Product decisions

### Public read, authenticated write

Decision:
- anyone can browse
- sign-in is required to contribute

Why it matters:
- matches Reddit/Ozbargain-style browsing
- lowers friction for compare and discovery
- keeps write actions attributable

### Stores are first-class pages

Decision:
- stores are not just metadata on logs
- each store has its own page, logs, and gallery
- exact store pages remain the primary surface for now
- chain-level aggregation is a future expansion, not the current main view

Why it matters:
- store identity is central to the product
- users care about exact locations and recurring stock context

### Items are canonical

Decision:
- items are shared canonical objects with explicit normalization basis
- the current flat canonical-item model is acceptable for now
- some richer hierarchy is expected later, likely closer to:
  - category -> family -> item
  - for example `Protein -> Chicken -> Chicken Breast`

Why it matters:
- compare logic depends on one common basis per item
- avoids arbitrary free-text comparisons

### Log history is preserved

Decision:
- logs are append history, not overwriting “current price”

Why it matters:
- compare needs latest log per store
- store/log pages need historical browsing

### Photos are attached to logs, not standalone gallery uploads

Decision:
- photos belong to a price log
- photos are expected to become more central to product trust over time
- a more photo-centric experience is desirable later, even if the app keeps logs as the primary object
- requiring photos for some or all submissions is a realistic future direction, even though it is not enforced yet

Why it matters:
- every image remains anchored to an observation
- galleries are derived views, not separate content

### Store and item governance should move toward admin-only correction

Decision:
- any signed-in user may still create stores and items
- direct editing/deletion of stores and items should eventually be restricted to admin-only controls
- the likely first admin check is a specific allowed email rather than a full role system

Why it matters:
- community contribution still needs to stay easy
- destructive or canonical-identity changes need tighter control than raw creation

### Comment and vote systems are built around logs

Decision:
- the log is the main discussion object

Why it matters:
- comments are contextual to one observation
- votes help surface quality/relevance but do not currently imply trust weighting

### Reporting and lightweight moderation are expected

Decision:
- lightweight reporting/moderation is considered a necessary future addition, not just an optional nice-to-have
- the first target is likely bad actors, troll submissions, obviously wrong prices, and inappropriate photos

Why it matters:
- public-read community content needs some abuse-management path
- photo-centric trust only works if clearly bad content can be reported and reviewed

## Technical decisions

### Next App Router, not SPA rewrite

Decision:
- keep server-rendered route entry with client interactivity

Why it matters:
- refresh and direct URL loads stay natural
- app can still feel SPA-like through client navigation and caching

### Shared log feed component

Decision:
- repeated log lists should reuse one shared feed/card pattern

Why it matters:
- the product shows many filtered log lists
- keeping them aligned reduces drift and duplicated UI logic

### Cached shell/reference data

Decision:
- items, stores, and viewer shell data are reused and cached more aggressively

Why it matters:
- improves navigation feel
- reduces repeated backend work for common transitions

### Server actions for writes

Decision:
- mutations go through server actions, not ad hoc client-only writes

Why it matters:
- centralizes validation, auth, redirects, rate limiting, and cache invalidation

### Client-side image compression first

Decision:
- compress/resize images before upload in the browser
- use browser-dependent format fallback rather than requiring one format from every client

Why it matters:
- reduces upload size and storage cost
- avoids shipping original phone photos to the backend

### Public profile names over public emails

Decision:
- public identity should use `public_name`

Why it matters:
- public comment/feed surfaces should not expose email addresses

## UI decisions

### Compare is still the main landing page

Decision:
- homepage remains compare-first

Why it matters:
- the app is primarily about “where is the cheapest current price”

### Header search is global across stores and items

Decision:
- search is not limited to one entity type

Why it matters:
- navigation should work from either user intent:
  - “find this store”
  - “find this item”

### Internal navigation should prefer internal pages over external links

Decision:
- store names in app contexts should generally route to internal store pages

Why it matters:
- the product’s own drilldown pages are now richer than a raw external store link
