# Current Product

## What the app is

Grocery Price Map is a public-read grocery price tracking app focused on:
- exact store locations, not just chain-level prices
- manual price logging
- preserving full price history
- comparing the latest normalized price across stores for one item at a time

The product currently behaves more like:
- a community-maintained grocery logbook
- plus a compare view and map
- plus store-level and log-level drilldown pages

It is not an OCR scanner, barcode system, or automated grocery data crawler.

The product is also not geographically finalized yet.
- the current UI presentation leans Tokyo/Japan in several places
- the docs should not treat that as a settled long-term geographic boundary
- broader geography is possible later, but would increase map, filtering, and localization scope

## Current user model

Public visitors can:
- browse compare results
- browse logs
- open individual log pages
- open store pages
- view photos and comments

Signed-in users can additionally:
- add stores
- add items
- add price logs
- upload log photos
- comment on logs
- vote on logs and comments
- edit their own logs
- delete their own logs in the product flow
- update their username in settings

## Core entities in the product

- Item
  A canonical grocery item with a normalization basis, currently restricted in product flows to `count`, `g`, or `ml`.

- Store
  A specific physical or online store with its own link, descriptor, and optional map location.

- Price log
  One observation of one item at one store on a date, with package size, price, optional notes, optional listing URL, and optional photo.

- Comment
  A discussion entry attached to one price log.

## Main routes and their roles

- `/`
  Compare page. Main public landing page.

- `/logs`
  Shared public log feed with sorting.

- `/logs/[logId]`
  Individual log page with voting, comments, item history, same-store history, and related compare data.

- `/logs/[logId]/edit`
  Owner-only log edit page.

- `/stores`
  Store directory and add-store form.

- `/stores/[storeId]`
  Store page with recent logs and a photo gallery for that store.

- `/items`
  Item catalog and add-item form.

- `/prices/new`
  Add-price-log form.

- `/account`
  Signed-in user’s own logs.

- `/settings`
  Signed-in user settings, currently centered on username management.

- `/auth/sign-in`
  Sign-in entry point.

## Current primary flows

### 1. Compare a single item

User can:
- search/select one canonical item
- see the best current result
- see latest prices by store
- inspect the map
- inspect selected store history
- open specific logs

### 2. Add a price log

Current form supports:
- store autocomplete
- item autocomplete
- package amount
- one entered price with tax-included toggle
- auto-derived tax-adjusted value using 8% assumption
- photo upload
- optional listing URL
- observed date
- notes

The form also supports:
- create-new-store shortcut from the store autocomplete
- create-new-item shortcut from the item autocomplete
- returning from store/item creation back into add-log flow with prefilled value

### 3. Browse logs

Shared log feeds appear in several places:
- All Logs page
- My Logs page
- Recent logs for an item
- Recent logs for a store
- Store-specific item history inside compare/log pages

These views now intentionally reuse the same shared feed/card pattern.

### 4. Browse a store page

A store page currently shows:
- store title and metadata
- external store link
- photo gallery across all logs from that store
- recent logs for that store

### 5. Discuss and vote on a log

Individual log pages support:
- log upvote/downvote
- comment posting
- comment vote controls
- related item/store history

## Current product strengths

- clear item/store/log separation
- public browsing without auth friction
- internal drilldowns between compare, logs, and stores
- photo support already integrated
- comments and voting already integrated
- store pages and galleries already exist
- exact-store pages already provide a solid home for future moderation, trust, and chain expansion

## Current product constraints

- no moderation/admin tooling yet
- no true dedupe workflow for stores/items
- no barcode/OCR/image extraction
- no chain-level aggregate compare
- no distance/radius compare logic
- no area-based geo filtering
- no trust/reputation system beyond raw votes
- no notifications or alerting
- no formal role model beyond signed-in user ownership

## Current direction that now looks intentional

- store and item creation can stay community-driven, but corrective editing/deletion is likely to become admin-only
- moderation/reporting is expected to arrive later, especially for obviously wrong logs, troll behavior, and inappropriate photos
- chain-level views are a likely future layer, but exact store pages remain the primary current surface
- item modeling will probably become richer than the current flat list, likely with hierarchy, tags, or both
- photos are likely to become more central to trust and may eventually become required for some or all submissions
- wider geography is possible, but should not be assumed to imply full localization or advanced distance-aware compare behavior yet
