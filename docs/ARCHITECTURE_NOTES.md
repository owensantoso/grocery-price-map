# Architecture Notes

This is a short operational note for future implementation sessions.

Read [AGENT_ENTRYPOINT.md](AGENT_ENTRYPOINT.md) first before using this file.

## What to trust first

1. route components
2. `src/lib/queries.ts`
3. `src/app/actions.ts`
4. current migrations
5. these docs

## Where the app’s real “service boundaries” are

- Read model boundary:
  - `src/lib/queries.ts`

- Write/mutation boundary:
  - `src/app/actions.ts`

- Shared shell/navigation boundary:
  - `src/app/layout.tsx`
  - `src/components/app-shell.tsx`

- Shared feed/list UI boundary:
  - `src/components/logs/price-log-feed.tsx`
  - `src/components/logs/price-log-card.tsx`

## Current implementation themes

- Prefer reuse over per-page bespoke log list UIs.
- Prefer internal drilldown pages over raw external links.
- Prefer public-read browsing with auth-required contribution.
- Prefer documenting unresolved product choices instead of guessing them.
