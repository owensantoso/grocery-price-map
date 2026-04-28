# Database Migration Checklist

Use this checklist for staging, live-like, and production Supabase migration verification. Do not apply migrations to production from an agent session unless the owner explicitly approves the target project and credentials.

## Prerequisites

- Confirm the target Supabase project is the intended staging or production project.
- Confirm `supabase/migrations/` is applied in filename order.
- Confirm the app build being deployed expects the same migration set.
- Capture current migration version, project ref, and backup/restore status in the release notes.

## Apply Order

1. Apply all unapplied migrations to a disposable or staging project first.
2. Run the app against that project with real `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Repeat the same migration order for production only after staging verification passes.

## Required Verification

- Price-log integrity trigger:
  - Insert a normal price log through the app and confirm normalized/tax values are accepted.
  - Attempt a direct authenticated insert with mismatched calculated values and confirm the trigger rejects it.
  - Attempt a direct authenticated update that bypasses server-action calculations and confirm it is rejected.
- Profile update constraints:
  - Update only `public_name` from settings and confirm it succeeds.
  - Attempt to update protected profile fields as the same user and confirm the trigger rejects it.
- Profile privacy and public labels:
  - As user A, query `profiles` for user A's row and confirm it is readable.
  - As user A, query `profiles` for user B's row and confirm no private profile row is returned.
  - As a signed-out/public client, query `public_profiles` and confirm only `id` and `public_name` are returned.
  - Confirm public feed, log detail, and comment author labels still render through `public_profiles`.
- Public text limits:
  - Attempt to insert or update a comment body longer than 1,000 characters and confirm `price_log_comments_body_max_length` rejects it.
  - Attempt to insert or update store notes longer than 2,000 characters and confirm `stores_notes_max_length` rejects it.
  - Attempt to insert or update price-log notes longer than 2,000 characters and confirm `price_logs_notes_max_length` rejects it.
  - Inspect existing rows over those limits before manually validating the `NOT VALID` constraints.
- Rate-limit RPC:
  - Confirm write actions still consume `public.consume_action_rate_limit`.
  - Confirm repeated calls over the action limit return the expected rate-limit failure.
- Public read surfaces:
  - Confirm compare, logs, log detail, stores, and items still load for signed-out users.
- Storage:
  - Upload a price-log photo and confirm the public object URL resolves.
  - Delete or replace a photo and confirm cleanup logs are quiet or contain only expected best-effort failures.

## Rollback Notes

Prefer forward fixes for schema changes. If rollback is required, stop deploy traffic first, restore from a known-good Supabase backup or point-in-time restore, then redeploy the app version that matches the restored schema.
