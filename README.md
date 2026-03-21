# Grocery Price Map

A Next.js + Supabase app for logging grocery prices at exact store locations, preserving full history, and comparing the latest normalized price by item.

## What is implemented

- Google-auth ready app shell with Supabase SSR wiring
- Shared `items`, `stores`, and `price_logs` model
- Manual item creation with normalization basis
- Manual store creation with a map pin picker
- Price log entry with normalized yen-per-unit calculation
- Compare home screen with ranked list, map view, and per-store history
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

## Supabase setup

1. Create a Supabase project.
2. Enable Google auth in Supabase Auth.
3. Add `http://localhost:3000/auth/callback` as an allowed redirect URL for local development.
4. Run the SQL in [supabase/migrations/202603210001_init.sql](/Users/macintoso/Documents/VSCode/grocery-price-map/supabase/migrations/202603210001_init.sql).

The migration creates:

- `profiles`
- `stores`
- `items`
- `price_logs`
- a trigger to mirror new auth users into `profiles`
- RLS policies for shared reads and owner-only `price_logs` updates

## Verification

```bash
npm test
npm run lint
npm run build
```
