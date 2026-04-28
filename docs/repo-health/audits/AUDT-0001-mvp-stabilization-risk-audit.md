---
type: repo-health-audit
id: AUDT-0001
title: MVP stabilization risk audit
status: completed
audit_kind: architecture
created_at: "2026-04-28 23:56:58 JST +0900"
updated_at: "2026-04-29 02:39:08 JST +0900"
audit_started_at: "2026-04-28 23:56:58 JST +0900"
audit_ended_at: "2026-04-29 00:00:01 JST +0900"
owner:
scope:
  - write-side data integrity and authorization
  - read-side query/model assembly
  - pre-refactor test coverage
  - frontend form/map/accessibility risk
checks:
  - scripts/docs-meta check
  - scripts/docs-meta check-links
  - tests/docs-meta-smoke.sh
  - vitest run
  - eslint .
  - next build
related_specs: []
related_plans:
  - docs/repo-health/plans/PLAN-0001-documentation-and-architecture-cleanup/PLAN-0001-documentation-and-architecture-cleanup.md
  - docs/repo-health/plans/PLAN-0002-backend-write-integrity-hardening/PLAN-0002-backend-write-integrity-hardening.md
  - docs/repo-health/plans/PLAN-0003-contribution-accessibility-fixes/PLAN-0003-contribution-accessibility-fixes.md
  - docs/repo-health/plans/PLAN-0004-read-scale-and-verification-gates/PLAN-0004-read-scale-and-verification-gates.md
  - docs/repo-health/plans/PLAN-0005-architecture-cleanup/PLAN-0005-architecture-cleanup.md
related_adrs: []
related_sessions: []
repo_state:
  based_on_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
  last_reviewed_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
---

# AUDT-0001 - MVP Stabilization Risk Audit

## Scope

This audit reviews the largest risks before continuing the cleanup/refactor path for Grocery Price Map. It is not a release-blocking security assessment and does not attempt to resolve open product questions.

In scope:

- server actions, RLS, storage policies, and write-side integrity
- query/read-model assembly, cache shape, demo/live parity, and scale pressure
- current automated test coverage and verification gaps
- frontend form, map, and accessibility fragility

Out of scope:

- implementing fixes
- deciding unresolved product questions from `docs/OPEN_QUESTIONS.md`
- replacing the current architecture from scratch
- live Supabase production data inspection

## Questions

- What are the biggest risks that could make cleanup unsafe if ignored?
- Which risks need tests before refactor work?
- Which risks are real defects versus accepted MVP limitations?
- Where should the next plans or implementation briefs focus?

## Sources Reviewed

- Current repo state: `e7f59d0c770f05d4e7720ef54e4865c6eb245081`
- `AGENTS.md`
- `docs/orientation/CURRENT_STATE.md`
- `docs/orientation/ARCHITECTURE.md`
- `docs/repo-health/audits/README.md`
- `docs/repo-health/audits/audit-profile.md`
- `docs/repo-health/audits/guides/architecture.md`
- `docs/repo-health/audits/guides/security.md`
- `docs/repo-health/audits/guides/schema.md`
- `docs/repo-health/audits/guides/test-coverage.md`
- `docs/repo-health/audits/guides/performance.md`
- `docs/repo-health/audits/guides/accessibility.md`
- `docs/BACKEND_SCHEMA.md`
- `src/app/actions.ts`
- `src/lib/queries.ts`
- `src/lib/demo-data.ts`
- `src/lib/models.ts`
- `src/components/`
- `supabase/migrations/`

## Method

Four read-only subagents reviewed independent risk lanes:

- write-side data integrity, authorization, RLS/storage, and mutation risks
- read-side query/model assembly, cache, demo/live parity, and performance risk
- test coverage and verification risk before refactors
- frontend/component complexity, map/form UX fragility, and accessibility risk

Local baseline checks were also run:

- `vitest run`: passed, 3 test files / 6 tests.
- `eslint .`: passed.
- `next build`: passed, 13 app routes generated.
- Initial `scripts/docs-meta check`: failed while this audit file made generated views stale.
- After regenerating generated views, docs checks should be rerun as closeout verification.

Size signals gathered during audit:

```text
937  src/app/actions.ts
1018 src/lib/queries.ts
397  src/components/forms/price-log-form.tsx
375  src/components/forms/autocomplete-field.tsx
326  src/components/compare/comparison-map.tsx
282  src/components/compare/compare-dashboard.tsx
```

Current automated tests are lib-only:

- `src/lib/demo-data.test.ts`
- `src/lib/measurements.test.ts`
- `src/lib/pricing.test.ts`

## Findings

| ID | Severity | Status | Finding | Route | Follow-up | Resolution |
|---|---|---|---|---|---|---|
| FINDING-001 | high | resolved | Authenticated clients can bypass server-action price-log integrity because RLS mostly checks ownership while fields such as `normalized_price_yen`, `package_unit`, `price_tax_excluded_yen`, and `photo_path` are DB-callable. Evidence: `supabase/migrations/202603210001_init.sql:128`, `supabase/migrations/202603210001_init.sql:134`, `supabase/migrations/202603220001_comments_and_photos.sql:1`, `src/app/actions.ts:525`, `src/app/actions.ts:649`. | none | none | Resolved by `supabase/migrations/202604290001_price_log_integrity.sql`, which adds a `before insert or update` trigger rejecting mismatched `submitted_by`, changed ownership, mismatched `package_unit`, incorrect `normalized_price_yen`, incorrect `price_tax_excluded_yen`, and cross-user `photo_path` values. Server actions now derive `price_tax_excluded_yen` from `total_price_yen` instead of trusting the hidden form field. Live Supabase application/manual bypass checks remain required before production rollout. |
| FINDING-002 | high | resolved | Write-side server actions have no automated coverage before the planned action-module refactor. Existing tests cover pricing, measurements, and demo data only, while risky write paths include create/update/delete log and vote/comment actions. Evidence: `src/lib/pricing.test.ts:4`, `src/lib/demo-data.test.ts:4`, `src/lib/measurements.test.ts:4`, `src/app/actions.ts:485`, `src/app/actions.ts:579`, `src/app/actions.ts:690`, `src/app/actions.ts:750`, `src/app/actions.ts:808`, `src/app/actions.ts:852`. | none | none | Resolved for this coverage slice by extracting server-action validation schemas into `src/lib/action-validation.ts` and adding tests for physical-store coordinate validation, online-store coordinates, invalid price-log fields, and comment trimming/empty rejection. Live Supabase integration remains out of scope. |
| FINDING-003 | high | routed | Physical store creation depends on a mouse/touch-only map pin even though physical stores require coordinates, blocking keyboard-only users from the required physical-store flow. Evidence: `src/app/actions.ts:383`, `src/components/forms/store-form.tsx:139`, `src/components/map/store-location-picker.tsx:26`. | IMPL | IMPL-0003-01 | Routed to `IMPL-0003-01`; accessibility blocker for one contribution path. |
| FINDING-004 | medium | routed | Photo storage and DB mutations are not atomic, so failed DB writes can create orphaned photos or rows that point at removed photos. Evidence: `src/app/actions.ts:127`, `src/app/actions.ts:532`, `src/app/actions.ts:642`, `src/app/actions.ts:708`. | IMPL | IMPL-0002-02 | Routed to `IMPL-0002-02`; add compensating cleanup on DB failure paths and avoid removing old photos before successful DB update where possible. |
| FINDING-005 | medium | routed | Profile self-update RLS allows users to update any column on their own profile, while product behavior only intends username changes. Evidence: `supabase/migrations/202603230002_profiles_self_update.sql:1`, `src/lib/database.types.ts:27`, `src/app/actions.ts:331`. | IMPL | IMPL-0002-03 | Routed to `IMPL-0002-03`; restrict profile updates to `public_name` through column privileges, trigger validation, or an RPC used by settings. |
| FINDING-006 | medium | routed | DB-backed rate limiting is count-then-insert rather than atomic, so parallel requests can exceed the intended action window. Evidence: `src/app/actions.ts:60`, `src/app/actions.ts:80`, `supabase/migrations/202603220003_action_rate_limits.sql:1`. | IMPL | IMPL-0002-03 | Routed to `IMPL-0002-03`; replace with an atomic DB function or bucketed constraint, or explicitly accept the MVP race risk. |
| FINDING-007 | medium | routed | Public log and account pages depend on an unbounded all-log read, then sort/filter in application code. Evidence: `src/lib/queries.ts:594`, `src/lib/queries.ts:602`, `src/lib/queries.ts:782`, `src/lib/queries.ts:790`, `src/lib/queries.ts:794`, `src/app/logs/page.tsx:27`, `src/app/account/page.tsx:7`. | IMPL | IMPL-0004-01 | Routed to `IMPL-0004-01`; decide pagination/bounded feed reads and owner-specific account snapshot after evidence. |
| FINDING-008 | medium | routed | Store detail has a store-only query path without a matching leading-column index; existing price-log indexes start with `item_id`. Evidence: `src/lib/queries.ts:566`, `src/lib/queries.ts:578`, `supabase/migrations/202603210001_init.sql:55`, `supabase/migrations/202603210001_init.sql:59`. | IMPL | IMPL-0004-01 | Routed to `IMPL-0004-01`; run `EXPLAIN` if a realistic dataset is available before adding a migration. |
| FINDING-009 | medium | resolved | Live read-model assembly and demo read-model assembly are duplicated, so demo/live parity can drift while tests still pass. Evidence: `src/lib/queries.ts:248`, `src/lib/queries.ts:283`, `src/lib/demo-data.ts:414`, `src/lib/demo-data.ts:459`, `src/lib/demo-data.test.ts:2`. | none | none | Resolved for this coverage slice by adding live read-model helper tests in `src/lib/queries.test.ts` for compare latest-log selection, normalized-price ordering, feed sorting, and viewer editability. Broader shared mapper cleanup remains routed to `PLAN-0005`. |
| FINDING-010 | medium | resolved | Live read-side query/view-model behavior is mostly untested; only demo compare ordering is covered. Evidence: `src/lib/demo-data.test.ts:5`, `src/lib/queries.ts:192`, `src/lib/queries.ts:248`, `src/lib/queries.ts:286`, `src/lib/queries.ts:308`, `src/lib/queries.ts:404`, `src/lib/queries.ts:666`, `src/lib/queries.ts:755`, `src/lib/queries.ts:907`, `docs/orientation/ARCHITECTURE.md:80`. | none | none | Resolved for this coverage slice by exporting and testing pure query helpers for vote summaries, compare entries, feed entries, comment entries, and feed sorting. Live Supabase integration remains out of scope. |
| FINDING-011 | medium | resolved | Interaction-heavy frontend paths have no component/browser tests despite being high-regression surfaces. Evidence: `vitest.config.ts:10`, `package.json:23`, no `*.test.tsx` files found, `src/components/forms/price-log-form.tsx:176`, `src/components/forms/autocomplete-field.tsx:220`, `src/components/logs/log-vote-controls.tsx:63`, `src/components/forms/log-photo-input.tsx:61`, `src/components/compare/comparison-map.tsx:158`. | none | none | Resolved for this first frontend slice by adding React Testing Library coverage for `LogVoteControls` optimistic updates and rollback after failed vote actions. Broader browser, map, and autocomplete verification remains routed to `PLAN-0003` and `PLAN-0004`. |
| FINDING-012 | medium | routed | Shared autocomplete is a custom combobox without enough active-option semantics for robust screen reader/keyboard behavior. Evidence: `src/components/forms/autocomplete-field.tsx:190`, `src/components/forms/autocomplete-field.tsx:289`. | IMPL | IMPL-0003-02 | Routed to `IMPL-0003-02`; add active-option semantics and keyboard verification. |
| FINDING-013 | medium | routed | Comment vote controls expose glyph-only buttons without accessible names or pressed state. Evidence: `src/components/logs/log-vote-controls.tsx:107`, `src/components/comments/comment-vote-controls.tsx:84`. | IMPL | IMPL-0003-02 | Routed to `IMPL-0003-02`; add labels/state and keyboard smoke verification. |
| FINDING-014 | medium | routed | Map UI has known Leaflet lifecycle fragility but no automated or documented manual viewport/accessibility verification path. Evidence: `docs/ARCHITECTURE.md:186`, `src/components/compare/comparison-map.tsx:237`, `src/components/map/store-location-picker.tsx:49`, `src/components/stores/store-directory-map.tsx:49`, `package.json:5`. | IMPL | IMPL-0003-03 | Routed to `IMPL-0003-03`; create a lightweight manual verification checklist. |
| FINDING-015 | medium | resolved | Verification was green locally but had no CI or coverage visibility, making regression protection process-dependent. Evidence: `package.json:5`, `vitest.config.ts:10`, `docs/repo-health/audits/audit-profile.md:28`, `.github/workflows/ci.yml:1`. | none | none | Resolved by adding the minimal GitHub Actions gate in `.github/workflows/ci.yml`: `npm ci`, `npm test`, `npm run lint`, and `npm run build` run without secrets on pull requests and pushes to `main`. Coverage remains intentionally advisory/not added in this slice. Remote CI passed on main run `25067122315`. |
| FINDING-016 | low | routed | Log detail repeats item-level work to build latest-across-stores after already loading the same item logs and votes. Evidence: `src/lib/queries.ts:925`, `src/lib/queries.ts:927`, `src/lib/queries.ts:961`, `src/lib/queries.ts:703`, `src/lib/queries.ts:705`. | IMPL | IMPL-0004-01 | Routed to `IMPL-0004-01`; decide whether to fold into `IMPL-0005-01` after read-side coverage. |
| FINDING-017 | low | routed | `src/lib/queries.ts` is a read-side gravity well that combines Supabase access, cache policy, auth/viewer lookup, vote aggregation, comment assembly, and route snapshots. Evidence: `src/lib/queries.ts` is 1018 lines, `docs/orientation/CURRENT_STATE.md:78`, `docs/orientation/ARCHITECTURE.md:53`, `docs/repo-health/plans/PLAN-0005-architecture-cleanup/IMPL-0005-01-action-and-query-module-split.md:47`. | IMPL | IMPL-0005-01 | Routed to `IMPL-0005-01`; split only after `IMPL-0001-03` adds read-side characterization coverage. |
| FINDING-018 | low | accepted-risk | Authenticated users can upload public objects to their own storage folder without a corresponding `price_logs` row. Folder ownership prevents cross-user writes, but unused public media can accumulate. Evidence: `supabase/migrations/202603220001_comments_and_photos.sql:66`, `supabase/migrations/202603220001_comments_and_photos.sql:92`, `docs/BACKEND_SCHEMA.md:161`. | none | Accept for MVP; revisit when moderation, quotas, or storage cleanup become active scope. | Accepted by owner: repo maintainer. Rationale: accepted because folder ownership prevents cross-user writes and unused media cleanup is lower priority until moderation, quotas, or storage-cost work begins. |
| FINDING-019 | low | routed | Form controls rely mostly on browser-default focus treatment despite custom UI surfaces, increasing manual accessibility verification risk. Evidence: `src/app/globals.css:874`. | IMPL | IMPL-0003-03 | Routed to `IMPL-0003-03`; add consistent focus-visible styling and manual checks. |

## Recommendations

Recommended next order:

1. Treat `FINDING-001` as the most important new discovery. Before public write usage grows, decide whether derived price-log integrity belongs in DB constraints/triggers/RPCs or remains accepted as server-action-only trust.
2. Execute `PLAN-0002` before wider public write usage or before treating server-action splitting as low-risk.
3. Execute `PLAN-0003` for contribution accessibility and interaction verification.
4. Execute `PLAN-0004` before `PLAN-0005` so read-scale and map verification evidence exists before architecture cleanup.

## Follow-Ups

- Execute `PLAN-0002` before wider public write usage or before treating server-action splitting as low-risk.
- Execute `PLAN-0003` for contribution accessibility and component/browser verification gaps.
- Execute `PLAN-0004` before code splitting.
- Regenerate docs-meta views after this audit file lands.
- Use `scripts/docs-meta review` to inspect open audit findings before starting refactor work.
