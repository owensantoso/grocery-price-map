# Grocery Price Map

A Next.js + Supabase app for logging grocery prices at exact store locations, preserving full history, and comparing the latest normalized price by item.
<img width="1226" height="908" alt="image" src="https://github.com/user-attachments/assets/47774ee3-98b0-443d-bc5b-1d886e4d4fef" />
<img width="1259" height="903" alt="image" src="https://github.com/user-attachments/assets/187c8f6f-a5bd-4d38-927c-a100a9d702e5" />


## What is implemented

- Google-auth ready app shell with Supabase SSR wiring
- Shared `items`, `stores`, and `price_logs` model
- Manual item creation with normalization basis
- Manual store creation with a map pin picker plus required store link
- Price log entry with tax-included / tax-excluded syncing
- Compare home screen with a featured best result, larger map, and log-detail drilldowns
- Dedicated log detail pages for individual observations
- Demo-mode fallback data when Supabase is not configured
- Supabase SQL migration with RLS policies
- Unit tests for normalization and compare ordering

## Local development

1. Install dependencies:

```bash
npm install
```

2. Copy the env template:

```bash
cp .env.example .env.local
```

3. Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. Start the app:

```bash
npm run dev
```

If env vars are missing, the app still renders in demo mode with seeded Tokyo grocery data.

Demo mode is for local development and tests only. Production builds fail when
`NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing.

## Supabase setup

1. Create a Supabase project.
2. Enable Google auth in Supabase Auth.
3. Add `http://localhost:3000/auth/callback` as an allowed redirect URL for local development.
4. Run the SQL migrations in order:

- [supabase/migrations/202603210001_init.sql](/Users/macintoso/Documents/VSCode/grocery-price-map/supabase/migrations/202603210001_init.sql)
- [supabase/migrations/202603210002_feedback_iteration.sql](/Users/macintoso/Documents/VSCode/grocery-price-map/supabase/migrations/202603210002_feedback_iteration.sql)
- [supabase/migrations/202603210003_logs_and_votes.sql](/Users/macintoso/Documents/VSCode/grocery-price-map/supabase/migrations/202603210003_logs_and_votes.sql)
- [supabase/migrations/202603220001_comments_and_photos.sql](/Users/macintoso/Documents/VSCode/grocery-price-map/supabase/migrations/202603220001_comments_and_photos.sql)
- [supabase/migrations/202603220002_public_read_access.sql](/Users/macintoso/Documents/VSCode/grocery-price-map/supabase/migrations/202603220002_public_read_access.sql)
- [supabase/migrations/202603220003_action_rate_limits.sql](/Users/macintoso/Documents/VSCode/grocery-price-map/supabase/migrations/202603220003_action_rate_limits.sql)
- [supabase/migrations/202603230001_profile_usernames.sql](/Users/macintoso/Documents/VSCode/grocery-price-map/supabase/migrations/202603230001_profile_usernames.sql)
- [supabase/migrations/202603230002_profiles_self_update.sql](/Users/macintoso/Documents/VSCode/grocery-price-map/supabase/migrations/202603230002_profiles_self_update.sql)
- [supabase/migrations/202603250001_price_log_owner_delete.sql](/Users/macintoso/Documents/VSCode/grocery-price-map/supabase/migrations/202603250001_price_log_owner_delete.sql)
- [supabase/migrations/202604290001_price_log_integrity.sql](/Users/macintoso/Documents/VSCode/grocery-price-map/supabase/migrations/202604290001_price_log_integrity.sql)
- [supabase/migrations/202604290002_profile_rate_limit_constraints.sql](/Users/macintoso/Documents/VSCode/grocery-price-map/supabase/migrations/202604290002_profile_rate_limit_constraints.sql)

The migration creates:

- `profiles`
- `stores`
- `items`
- `price_logs`
- store links and store type support
- tax-excluded pricing and optional item listing URLs on price logs
- a trigger to mirror new auth users into `profiles`
- comments, votes, public-read access, photo storage, rate limiting, and profile usernames
- trigger-backed price-log integrity checks and bounded profile updates
- RLS policies for shared reads and owner-owned writes

For staging/live-like migration verification, use
[docs/repo-health/operations/db-migration-checklist.md](/Users/macintoso/Documents/VSCode/grocery-price-map/docs/repo-health/operations/db-migration-checklist.md).

## Production readiness

Before deploying outside local/demo development:

- Configure real Supabase public env vars.
- Verify OAuth redirect URLs include `/auth/callback` for the deployed origin.
- Apply and verify database migrations with the operations checklist.
- Follow [docs/repo-health/operations/deploy-rollback-runbook.md](/Users/macintoso/Documents/VSCode/grocery-price-map/docs/repo-health/operations/deploy-rollback-runbook.md).

## Verification

```bash
npm test
npm run lint
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
  NEXT_PUBLIC_SUPABASE_ANON_KEY=example-anon-key \
  npm run build
```
