---
type: implementation-brief
id: IMPL-0002-01
title: Price log write integrity boundary
domain: repo-health
status: draft
created_at: "2026-04-29 00:25:41 JST +0900"
updated_at: "2026-04-29 01:01:18 JST +0900"
parent_plan: PLAN-0002
task_refs:
  - AUDT-0001#FINDING-001
owner:
areas: []
depends_on: []
parallel_with: []
related_specs: []
related_adrs: []
related_sessions: []
related_issues: []
related_prs: []
linked_paths:
  - docs/repo-health/audits/AUDT-0001-mvp-stabilization-risk-audit.md
  - src/app/actions.ts
  - src/lib/measurements.ts
  - src/lib/photos.ts
  - supabase/migrations/
  - docs/BACKEND_SCHEMA.md
repo_state:
  based_on_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
  last_reviewed_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
---

# IMPL-0002-01 - Price Log Write Integrity Boundary

## Parent Plan

- PLAN-0002

## Task Goal

Prevent direct authenticated Supabase clients from bypassing price-log integrity assumptions that the app currently calculates in server actions.

## Scope

In scope:

- `AUDT-0001#FINDING-001`
- `price_logs` fields that are currently trusted by compare/feed/detail surfaces:
  - `normalized_price_yen`
  - `package_unit`
  - `price_tax_excluded_yen`
  - `photo_path`
  - ownership fields such as `submitted_by`
- migration or RPC/trigger options that preserve current UI behavior
- tests or documented checks for bypass attempts where practical

Out of scope:

- changing item normalization product rules
- adding moderation/admin features
- replacing server actions with a new mutation architecture

## Implementation Assumptions

- Server actions remain the only intended app write API for `price_logs`.
- Direct authenticated Supabase clients should not be able to choose trusted derived values that the UI later displays as fact.
- Existing public read behavior should remain unchanged.
- Migrations should be forward-only and should not require wiping local data.

## Preferred Approach

Start by extracting the app-side price-log write shape into a short inventory before choosing an enforcement mechanism. Prefer a database guardrail when the value must be trusted even if a client bypasses the UI. Prefer keeping helper calculations in TypeScript only when the database can independently reject or derive the same trusted fields.

Required invariants:

- `submitted_by` must equal `auth.uid()` on insert/update.
- `package_unit` must match the submitted item's comparison unit unless a documented product rule allows a conversion path.
- `normalized_price_yen` must be derived from `total_price_yen`, `package_amount`, item comparison basis, and the product's measurement rules, or direct writes must be rejected when the value does not match the app calculation.
- `price_tax_excluded_yen` must match the current product tax rule when present, or be null only when the schema/product explicitly permits it.
- `photo_path` must be null or point to the authenticated submitter's allowed storage namespace.
- Updates must not let an owner mutate another user's trusted fields by changing ownership-related columns.

Required bypass checks:

- direct insert with mismatched `submitted_by`
- direct insert/update with incorrect `normalized_price_yen`
- direct insert/update with mismatched `package_unit`
- direct insert/update with incorrect `price_tax_excluded_yen`, if that column exists in the active schema
- direct insert/update with another user's `photo_path`, if storage namespace can be checked

Use this decision order:

1. If a field can be derived from submitted fields without app context, derive or validate it in the database.
2. If a field depends on authenticated user identity, enforce it with RLS, trigger logic, or an RPC that uses `auth.uid()`.
3. If Supabase column grants/RLS cannot express the rule clearly, document why and use the narrowest RPC or trigger path.
4. If a risk is intentionally accepted, include an owner, reason, and revisit trigger in `AUDT-0001`.

## Execution Steps

1. Map every `price_logs` insert/update path in `src/app/actions.ts`.
2. Compare app-side assumptions against current RLS and migrations.
3. Choose and document one backend guardrail before coding:
   - constraints/triggers for derived fields
   - RPC for price-log writes
   - column grants/policies if compatible with Supabase client usage
4. Add migration(s) and update generated/manual schema docs.
5. Add tests around extracted calculation helpers or mocked mutation boundaries where feasible.
6. Run a real policy/RPC/trigger verification path against local Supabase if available; otherwise document the blocker and exact SQL/manual check still needed.
7. Update `AUDT-0001#FINDING-001` with resolution evidence.

## Handoff Notes

- Include the exact trusted field list in the implementation PR/session log.
- Call out whether direct table inserts still exist after the change or whether writes move behind an RPC.
- If using triggers, include one positive path and one bypass/rejection path in the evidence.
- If using RPC, confirm existing server actions still return the same user-facing errors as before.
- Mocked tests alone are not sufficient evidence for RLS, grants, triggers, or `SECURITY DEFINER` behavior.

## Verification

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build
scripts/docs-meta check
scripts/docs-meta review --type audit-findings
```

Attach evidence for:

- normal price-log create/update still works
- a bypass attempt cannot set `submitted_by` or derived pricing fields incorrectly, or the remaining gap is explicitly accepted
- docs and migrations agree about the final boundary

## Done Checklist

- [ ] Backend write boundary chosen and documented.
- [ ] Migration or server-side enforcement added.
- [ ] Existing product write flows still work.
- [ ] Bypass/integrity behavior is tested or documented with a concrete manual check.
- [ ] `AUDT-0001#FINDING-001` updated.
