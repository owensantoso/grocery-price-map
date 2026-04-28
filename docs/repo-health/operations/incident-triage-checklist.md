# Incident Triage Checklist

Use this checklist for auth callback and storage/photo failures before choosing an observability provider.

Server diagnostic logs are JSON strings emitted through `console.info`, `console.warn`, and `console.error` by `src/lib/diagnostics.ts`. They appear in:

- the local terminal running `npm run dev`
- GitHub Actions command logs when verification executes server code that emits diagnostics
- Vercel runtime/function logs for deployed server routes and server actions

Every diagnostic event should include `schema_version`, `ts`, `elapsed_ms`, `trace_id`, `span_id`, `component`, `operation`, `event`, `event_kind`, `level`, `redaction`, and sanitized `attrs`. Treat `trace_id` as the correlation key when grouping related auth, action, photo, and read-snapshot events.

## Auth Callback Failures

Look for structured server log events:

- `auth_callback.started`
- `auth_callback.finished`
- `auth_callback_provider_error`
- `auth_callback_missing_supabase_client`
- `auth_callback_exchange_failed`

Checks:

- Confirm production Supabase public env vars are present.
- Confirm the Supabase Auth redirect URL exactly matches the deployed `/auth/callback` URL.
- Confirm Google OAuth credentials are enabled in Supabase.
- Confirm the user sees the sign-in error message instead of being silently redirected home.

## Photo Upload Or Cleanup Failures

Look for structured server log events:

- `price_log_create.started`
- `price_log_create.finished`
- `price_log_create.failed`
- `price_log_update.started`
- `price_log_update.finished`
- `price_log_update.failed`
- `price_log_delete.started`
- `price_log_delete.finished`
- `price_log_delete.failed`
- `price_log_photo_upload.started`
- `price_log_photo_upload.finished`
- `price_log_photo_prepare_failed`
- `price_log_photo_upload_failed`
- `price_log_photo_cleanup_failed`

Checks:

- Confirm bucket name `price-log-photos`.
- Confirm photo payload size and content type.
- Confirm the authenticated user ID matches the object path prefix.
- Confirm object cleanup failures did not leave user-visible database records pointing at missing objects.

## Read Snapshot Slowdowns

Look for lightweight duration events around the highest-value server read boundaries:

- `read_snapshot_price_logs.finished`
- `read_snapshot_price_logs.failed`
- `read_snapshot_account_settings.finished`
- `read_snapshot_account_settings.failed`
- `read_snapshot_store_detail.finished`
- `read_snapshot_store_detail.failed`

Checks:

- Compare `duration_ms` across local, preview, and production runs before choosing a query/index change.
- Use `trace_id` to correlate read snapshot events with nearby server logs from the same request when available.
- If a real incident needs raw run evidence, create a `DIAG-*` record and keep raw JSONL artifacts local unless explicitly sanitized.

## Privacy Rules

Diagnostic attrs must not include raw notes, emails, precise location, auth tokens, Supabase keys, full URLs with query strings, request bodies, photo data, or storage object paths. Prefer booleans, counts, content type, byte length, event names, entity IDs already visible in route/action context, and sanitized error messages.

## Paper Trail

For a real incident, add a dated session log or `DIAG-*` record with sanitized evidence, commands run, timeline, and remaining follow-up risk.
