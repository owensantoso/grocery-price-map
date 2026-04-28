# Incident Triage Checklist

Use this checklist for auth callback and storage/photo failures before choosing an observability provider.

## Auth Callback Failures

Look for structured server log events:

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

- `price_log_photo_prepare_failed`
- `price_log_photo_upload_failed`
- `price_log_photo_cleanup_failed`

Checks:

- Confirm bucket name `price-log-photos`.
- Confirm photo payload size and content type.
- Confirm the authenticated user ID matches the object path prefix.
- Confirm object cleanup failures did not leave user-visible database records pointing at missing objects.

## Paper Trail

For a real incident, add a dated session log or `DIAG-*` record with sanitized evidence, commands run, timeline, and remaining follow-up risk.
