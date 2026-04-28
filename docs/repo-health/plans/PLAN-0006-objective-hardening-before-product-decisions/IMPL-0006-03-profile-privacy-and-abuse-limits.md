---
type: implementation-brief
id: IMPL-0006-03
title: Profile privacy and abuse limits
domain: repo-health
status: completed
created_at: "2026-04-29 05:25:00 JST +0900"
updated_at: "2026-04-29 08:17:18 JST +0900"
parent_plan: PLAN-0006
task_refs:
  - AUDT-0002#FINDING-006
  - AUDT-0002#FINDING-010
  - AUDT-0002#FINDING-011
owner:
areas:
  - privacy
  - abuse-prevention
  - supabase
depends_on:
  - IMPL-0006-02
parallel_with:
  - IMPL-0006-04
related_specs: []
related_adrs: []
related_sessions: []
related_issues: []
related_prs: []
linked_paths:
  - src/app/actions.ts
  - src/lib/action-validation.ts
  - src/lib/action-validation.test.ts
  - src/lib/action-helpers.ts
  - docs/BACKEND_SCHEMA.md
  - docs/repo-health/audits/AUDT-0002-second-pass-risk-blind-spot-audit.md
  - supabase/migrations/202604290003_profile_privacy_text_limits.sql
  - supabase/migrations/
repo_state:
  based_on_commit: 81ec608aea076e5ca7bde8eae8466d838c68033f
  last_reviewed_commit: 81ec608aea076e5ca7bde8eae8466d838c68033f
---

# IMPL-0006-03 - Profile Privacy and Abuse Limits

## Parent Plan

- PLAN-0006

## Task Goal

Close privacy and abuse-prevention gaps that have clear technical fixes and do not require deciding future moderation or account-deletion policy.

## Scope

In scope:

- restrict private `profiles` reads to the owning user
- preserve public author labels through `public_profiles` or existing public read models
- verify settings/account flows still load the signed-in user's private profile fields
- add rate limiting to profile or username update actions
- add app-level and DB-level max lengths for public text fields as technical abuse/storage ceilings:
  - comments: 1,000 characters
  - store notes: 2,000 characters
  - price-log notes: 2,000 characters
- update backend schema docs with the new policies and constraints

Out of scope:

- changing generated default username policy or migrating existing generated usernames
- adding comment/photo report, moderation, or admin workflows
- defining account deletion, anonymization, ownership transfer, or retention rules
- changing public profile display names beyond the privacy boundary fix

## Execution Steps

1. Map current profile reads in settings, auth/profile actions, public pages, comments, photos, and feed queries.
2. Add a Supabase migration that restricts `profiles` select access to the owner row while preserving `public_profiles` access.
3. Update app queries only where they accidentally depended on broad private profile reads.
4. Add a profile-update rate limit through the existing rate-limit helper/RPC pattern.
5. Define conservative public text length constants in validation code and mirror them in DB check constraints: comments at 1,000 characters, store notes at 2,000 characters, and price-log notes at 2,000 characters.
6. Add focused tests for validation behavior and any pure helpers; document manual DB/RLS checks where local Supabase is unavailable.
7. Update `docs/BACKEND_SCHEMA.md` and `AUDT-0002` routes/statuses.

## Verification

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build
scripts/docs-meta check
```

Manual verification:

- As user A, verify own settings/profile data still loads.
- As user A, verify user B private profile row is not readable through direct `profiles` access.
- Verify public pages still show public author names through public read models.
- Verify overly long public text is rejected before insert/update.

## Implementation Notes

- Direct private profile reads are owner-scoped by the `users can read their own profile` RLS policy.
- Public labels continue through the `public_profiles` view, which exposes only `id` and `public_name`.
- Account settings updates consume the `profile-update` rate-limit bucket before public-name conflict checks or writes.
- Username conflict checks use `public_profiles`, not broad `profiles` reads, so they continue to work after private profile RLS is tightened.
- DB text ceilings are named `price_log_comments_body_max_length`, `stores_notes_max_length`, and `price_logs_notes_max_length`.
- The text ceiling constraints are `NOT VALID` to avoid failing migration on unknown legacy content. They enforce future inserts/updates; staging should inspect existing rows before optional manual validation.

## Done Checklist

- [x] Private profile rows are owner-readable only.
- [x] Public author display still works.
- [x] Profile update action is rate-limited.
- [x] Public text fields have matching app and DB length limits.
- [x] `AUDT-0002#FINDING-006`, `AUDT-0002#FINDING-010`, and `AUDT-0002#FINDING-011` are updated.
