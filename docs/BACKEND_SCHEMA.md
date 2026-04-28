# Backend Schema

## Backend stack

The app currently uses:
- Supabase Postgres
- Supabase Auth
- Supabase Storage
- Row Level Security policies

## Core tables

### `profiles`

Purpose:
- mirror authenticated users
- store public profile identity

Important current fields:
- `id`
- `email`
- `display_name`
- `public_name`
- `created_at`

Notes:
- public username now matters to the product
- public surfaces should use `public_name`, not email

### `stores`

Purpose:
- exact store records for physical or online stores

Important current fields:
- `id`
- `name`
- `chain_name`
- `store_kind`
- `store_url`
- `address_text`
- `latitude`
- `longitude`
- `notes`
- `created_by`
- `created_at`

Behavioral meaning:
- store pages are first-class now
- a store is a distinct entity, not just a string on a price log

### `items`

Purpose:
- canonical grocery items

Important current fields:
- `id`
- `name`
- `category`
- `comparison_unit`
- `comparison_basis_amount`
- `created_by`
- `created_at`

Current supported normalization units:
- `count`
- `g`
- `ml`

Important scope note:
- this is the current product-supported canonical item set
- the underlying schema still contains some broader legacy enum values from earlier iterations

### `price_logs`

Purpose:
- one observed price for one item at one store on one date

Important current fields:
- `id`
- `store_id`
- `item_id`
- `submitted_by`
- `package_amount`
- `package_unit`
- `total_price_yen`
- `price_tax_excluded_yen`
- `normalized_price_yen`
- `observed_at`
- `notes`
- `listing_url`
- `photo_path`
- `created_at`

Notes:
- the UI now captures one entered price plus a tax-included toggle
- backend still stores both total and tax-excluded values
- normalized price is stored for compare/sorting

### `price_log_votes`

Purpose:
- one user’s vote on one price log

Important current fields:
- `log_id`
- `user_id`
- `value`
- `created_at`

Key shape note:
- this table currently uses a composite key on (`log_id`, `user_id`), not a separate `id`

### `price_log_comments`

Purpose:
- comments on one price log

Important current fields:
- `id`
- `log_id`
- `author_id`
- `body`
- `created_at`

### `price_log_comment_votes`

Purpose:
- votes on comments

Important current fields:
- `comment_id`
- `user_id`
- `value`
- `created_at`

Key shape note:
- this table currently uses a composite key on (`comment_id`, `user_id`), not a separate `id`

### `action_events`

Purpose:
- lightweight DB-backed rate limiting

Important current fields:
- `id`
- `user_id`
- `action`
- `created_at`

## Views

### `public_profiles`

Purpose:
- safe public identity exposure

Used so the app can show public author labels without exposing private profile fields.

## Storage

### Price log photo bucket

Purpose:
- store uploaded log photos

Current behavior:
- public viewing enabled
- authenticated users can upload/update/delete their own files

Current application-side image handling:
- resize before upload
- compress before upload
- browser-dependent WebP with JPEG fallback

## RLS model

### Public read

Anonymous users can currently read:
- stores
- items
- price logs
- price log votes
- price log comments
- price log comment votes

This supports the public-browse model.

### Authenticated write

Authenticated users can:
- insert stores
- insert items
- insert price logs
- insert comments
- vote on logs/comments
- update their own logs
- delete their own logs
- update their own profile

### Ownership behavior

Current ownership rules are mostly:
- log owner can edit their own log
- vote owner can mutate their own vote
- profile owner can update their own profile

Stores and items remain effectively append-first objects rather than fully user-managed resources.

## Migrations currently present

- `202603210001_init.sql`
- `202603210002_feedback_iteration.sql`
- `202603210003_logs_and_votes.sql`
- `202603220001_comments_and_photos.sql`
- `202603220002_public_read_access.sql`
- `202603220003_action_rate_limits.sql`
- `202603230001_profile_usernames.sql`
- `202603230002_profiles_self_update.sql`
- `202603250001_price_log_owner_delete.sql`

## Important backend behaviors already encoded

- public-read / auth-write access model
- comment and vote systems
- photo upload support
- per-user action throttling
- public profile identity layer

## Known schema limitations

- no moderation/admin tables yet
- no store/item dedupe queue
- no role/permission model beyond user ownership and public read
- no chain-level aggregation tables
- no image derivatives table or CDN metadata layer
