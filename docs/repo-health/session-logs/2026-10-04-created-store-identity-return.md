---
type: session-log
title: Preserve exact store identity when returning to price entry
status: completed
created_at: "2026-10-04 05:52:16 JST +0900"
updated_at: "2026-10-04 05:52:16 JST +0900"
started_at: "2026-10-04 05:38:16 JST +0900"
ended_at: "2026-10-04 05:52:16 JST +0900"
timezone: Asia/Tokyo
participants:
  - Codex
  - GPT-6 Astra reviewer
areas:
  - price-entry
  - stores
related_plans:
  - docs/repo-health/plans/PLAN-0006-objective-hardening-before-product-decisions/PLAN-0006-objective-hardening-before-product-decisions.md
related_briefs:
  - docs/repo-health/plans/PLAN-0006-objective-hardening-before-product-decisions/IMPL-0006-05-price-log-draft-preservation.md
related_specs: []
related_adrs: []
related_todos: []
commits: []
---

# Preserve Exact Store Identity on Return

## Goal and Evidence

Creating a missing store from price entry previously redirected with its display name. Two exact locations can share that name; the form selected the first cached match and could attach the observation to the older location. A saved draft could also restore the old location when the new return value was unavailable.

Before the fix, the server-action redirect regression failed (name instead of inserted ID), and three actual page/form regressions failed (duplicate location, draft precedence, unavailable ID). Browser API stubs model a desktop viewport; Supabase action tests mock backend results, not a live database.

## Change and Dependencies

The store insert requests its returned ID and redirects with `prefillStoreId`. The new-price page carries it into the form. Explicit ID selection takes priority over legacy name links and the saved draft's store. If that ID is unavailable, the form leaves the selection empty while restoring other draft fields, allowing the user to select a location. Existing name-only URLs retain their behavior; this change does not deduplicate stores or redefine names as unique. Ordinary store creation still returns to the directory.

The branch is stacked on dependency repair PR #32, revision `41fa80875686eb911e6506c8c5fe75ae610a82f8`, so checks use its repaired production dependency baseline. Decimal parity PR #31 remains separate. Main, unresolved preview choices, taxonomy, schema and RLS policies are unchanged.

## Verification

- Clean installation completed; production dependency audit reports zero findings.
- All 56 tests passed: 48 baseline and eight action/page-form cases.
- Lint and standalone TypeScript passed.
- Production build rejected missing Supabase configuration with the expected guard message; configured production build passed using CI placeholders.
- Real signed-in Supabase roundtrip, deployed behavior, physical mobile behavior and storage/RLS validation remain open.

## Next

Review the focused candidate, then merge dependency repair before integrating this stacked branch. No automatic merge or deployment is authorized. Keep the Opus visual verdict and other product questions with the human.
