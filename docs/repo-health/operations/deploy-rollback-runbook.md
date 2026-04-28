# Deploy And Rollback Runbook

This runbook is intentionally lightweight and provider-neutral. Fill in owner, hosting, and alert routing before a public production launch.

## Required Ownership Placeholders

- Release owner: TBD.
- Production Supabase project owner: TBD.
- Hosting owner: TBD.
- Incident contact path: TBD.

## Environment Boundary

Production builds must include real values for:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Local development and tests may omit these values and use demo data. CI may use clearly non-live placeholder values only for compile/build verification after the missing-env guard has been checked.

## Deploy Prerequisites

- `vitest run` passes.
- `eslint .` passes.
- `next build` passes with the intended production Supabase public env vars.
- `scripts/docs-meta check` passes.
- Database migrations have passed [db-migration-checklist.md](db-migration-checklist.md) against staging or a live-like project.
- Supabase Auth allowed redirect URLs include the deploy URL plus `/auth/callback`.
- Storage bucket `price-log-photos` exists with the expected public-read behavior.

## Release Steps

1. Confirm the exact git commit, migration set, and target environment.
2. Apply database migrations to staging and verify the checklist.
3. Deploy the app with real production Supabase public env vars.
4. Run post-deploy smoke checks before announcing the release.

## Post-Deploy Smoke Checks

- Signed-out compare page loads live data, not demo setup messaging.
- Sign-in reaches Google OAuth and returns through `/auth/callback`.
- Settings page shows the authenticated profile.
- Create a test store, item, and price log if the environment allows test data.
- Upload one small photo and confirm the log detail page renders it.
- Check server logs for `auth_callback_*` and `price_log_photo_*` events.

## Rollback Steps

1. Stop or pause further deploys.
2. Revert to the last app version known to match the live schema.
3. If the schema migration caused the incident, use the Supabase restore plan approved by the owner; otherwise prefer a forward migration fix.
4. Re-run the post-deploy smoke checks.
5. Record the incident, root cause, rollback action, and follow-up owner.
