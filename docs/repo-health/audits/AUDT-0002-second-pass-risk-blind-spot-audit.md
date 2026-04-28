---
type: repo-health-audit
id: AUDT-0002
title: Second-pass risk blind spot audit
status: completed
audit_kind: architecture
created_at: "2026-04-29 05:05:15 JST +0900"
updated_at: "2026-04-29 08:47:30 JST +0900"
audit_started_at: "2026-04-29 05:05:15 JST +0900"
audit_ended_at: "2026-04-29 05:05:15 JST +0900"
owner:
scope:
  - production readiness and operations
  - privacy, abuse, and public user content
  - product/domain model correctness
  - browser and UI resilience
  - dependency, CI, and supply-chain hygiene
  - data lifecycle and governance
checks:
  - scripts/docs-meta check
  - npm audit --omit=dev --json
  - npm audit --json
related_specs: []
related_plans:
  - PLAN-0006
related_adrs: []
related_sessions: []
repo_state:
  based_on_commit: 81ec608aea076e5ca7bde8eae8466d838c68033f
  last_reviewed_commit: 81ec608aea076e5ca7bde8eae8466d838c68033f
---

# AUDT-0002 - Second-pass Risk Blind Spot Audit

## Scope

This audit reviews what `AUDT-0001` and `PLAN-0001` through `PLAN-0005` did not deeply cover. It looks for risks that matter before public production usage, especially around deployment, privacy, governance, domain semantics, and browser resilience.

In scope:

- production/demo-mode deployment assumptions
- release, migration, rollback, and observability readiness
- public profile, comment, photo, and text-content privacy/abuse risk
- domain model contradictions around tax, currency, geography, online stores, and log history
- browser/map/form resilience gaps after the focused accessibility pass
- dependency and CI/supply-chain gaps
- account deletion, ownership, retention, and moderation lifecycle gaps

Out of scope:

- implementing fixes
- live Supabase production inspection
- adding new product features during the audit
- replacing the current architecture

## Questions

- What important risk vectors were not covered by the first stabilization audit?
- Which risks should block or shape a production rollout?
- Which risks need a product decision before implementation?
- Which risks are acceptable MVP limitations, and which need a concrete follow-up plan?

## Sources Reviewed

- Current repo state: `81ec608aea076e5ca7bde8eae8466d838c68033f`
- `docs/repo-health/audits/AUDT-0001-mvp-stabilization-risk-audit.md`
- `docs/repo-health/audits/audit-profile.md`
- `docs/repo-health/audits/guides/`
- `docs/orientation/CURRENT_STATE.md`
- `docs/orientation/ARCHITECTURE.md`
- `docs/CURRENT_PRODUCT.md`
- `docs/DECISIONS.md`
- `docs/OPEN_QUESTIONS.md`
- `docs/DEFERRED.md`
- `docs/BACKEND_SCHEMA.md`
- `README.md`
- `.github/workflows/ci.yml`
- `next.config.ts`
- `package.json`
- `package-lock.json`
- `src/app/`
- `src/components/`
- `src/lib/`
- `supabase/migrations/`

## Method

Six read-only subagents reviewed independent lanes:

- production readiness and operations
- privacy, abuse, and public user content
- product/domain correctness
- browser and UI resilience beyond the fixed accessibility slice
- dependency, CI, and supply-chain hygiene
- data lifecycle and governance

Additional local checks:

- `scripts/docs-meta check`: passed before writing this audit.
- `npm audit --omit=dev --json`: found production dependency advisories for `next` and transitive `postcss`.
- `npm audit --json`: found additional dev/tooling advisories through test/build tooling.

## Findings

| ID | Severity | Status | Finding | Route | Follow-up | Resolution |
|---|---|---|---|---|---|---|
| FINDING-001 | high | resolved | Production can build and deploy without live Supabase env vars, silently falling back to demo-mode behavior. Evidence: `src/lib/supabase/env.ts:1`, `.github/workflows/ci.yml:36`, `README.md:49`. | none | none | Resolved by `IMPL-0006-02`: `src/lib/supabase/env.ts` now fails production mode loudly when required public Supabase env vars are missing, CI verifies the missing-env guard, and README documents demo versus production boundaries. |
| FINDING-002 | high | resolved | Live/staging database migration and bypass verification is still not operationalized, including the two `20260429` hardening migrations. Evidence: `AUDT-0001#FINDING-001`, `AUDT-0001` recommendations, `README.md:56`, `docs/BACKEND_SCHEMA.md:224`, `supabase/migrations/202604290001_price_log_integrity.sql:1`, `supabase/migrations/202604290002_profile_rate_limit_constraints.sql:1`. | none | none | Resolved by `IMPL-0006-02`: `docs/repo-health/operations/db-migration-checklist.md` covers staging/live-like apply order plus trigger bypass, profile update, rate-limit RPC, public-read, and storage checks. |
| FINDING-003 | medium | resolved | No production/staging deploy, rollback, or manual release runbook is present. Evidence: `docs/repo-health/audits/audit-profile.md:28`, `docs/repo-health/audits/audit-profile.md:29`, `README.md:21`, `README.md:80`. | none | none | Resolved by `IMPL-0006-02`: `docs/repo-health/operations/deploy-rollback-runbook.md` covers deploy prerequisites, smoke checks, rollback steps, and explicit ownership placeholders. |
| FINDING-004 | medium | resolved | Production observability is too thin for triage: OAuth callback exchange failures redirect home without surfacing the reason, and storage/photo failures rely on `console.error` only. Evidence: `src/app/auth/callback/route.ts:8`, `src/app/auth/callback/route.ts:16`, `src/lib/price-log-photo-actions.ts:47`, `src/lib/price-log-photo-actions.ts:82`. | none | none | Resolved by `IMPL-0006-02` and expanded by `IMPL-0006-06`: auth callback failures redirect to the existing sign-in error surface, auth/action/photo/read-snapshot server paths now emit provider-neutral JSON diagnostic events with trace/span IDs and timings, and `docs/repo-health/operations/incident-triage-checklist.md` documents triage locations plus privacy rules. |
| FINDING-005 | low | accepted-risk | Security headers are static and include local development allowances such as `http://localhost:3000` in `form-action`. Evidence: `next.config.ts:17`, `next.config.ts:22`. | none | none | Accepted by owner: repo maintainer. Rationale: acceptable for MVP while production rollout is not active. Revisit during the deploy checklist and remove or environment-gate development-only CSP allowances before production. |
| FINDING-006 | medium | resolved | Authenticated users can read all profile emails/display names through the `profiles` select policy, even though public surfaces are intended to use `public_name`. Evidence: `supabase/migrations/202603210001_init.sql:92`, `docs/BACKEND_SCHEMA.md:27`, `docs/DECISIONS.md:141`. | none | none | Resolved by `IMPL-0006-03`: `202604290003_profile_privacy_text_limits.sql` replaces the broad authenticated profile select policy with `users can read their own profile`, keeps public author labels on `public_profiles`, and the app checks username conflicts through the public profile view. |
| FINDING-007 | medium | deferred | Default public usernames can leak real names or email local-parts because `generated_username()` derives from provider metadata or `split_part(email, '@', 1)`. Evidence: `supabase/migrations/202603230001_profile_usernames.sql:39`, `supabase/migrations/202603230001_profile_usernames.sql:65`. | none | none | Reason: choosing opaque handles and deciding whether/how to migrate existing handles needs product/privacy judgment. Revisit before public launch or account/profile work. |
| FINDING-008 | medium | deferred | Public comments are append-only from the user's perspective: there is no self-delete/edit/report path, and no moderation removal path. Evidence: `supabase/migrations/202603220001_comments_and_photos.sql:29`, `src/app/actions.ts:571`, `src/components/comments/comment-thread.tsx:51`, `docs/DEFERRED.md:5`. | none | none | Reason: report/moderation mechanics need a governance decision. Revisit when defining the moderation MVP. |
| FINDING-009 | medium | resolved | Public photos lack an upload-time privacy warning and report/moderation controls, while store pages aggregate submitted photos publicly. Evidence: `supabase/migrations/202603220001_comments_and_photos.sql:66`, `src/app/stores/[storeId]/page.tsx:53`, `src/components/forms/price-log-form.tsx:332`, `docs/OPEN_QUESTIONS.md:15`. | none | none | Resolved for the objective `PLAN-0006` scope by `IMPL-0006-04`: the upload flow now warns that price-log photos are public and can appear on store pages. Report/moderation controls remain deferred to a moderation decision. |
| FINDING-010 | low | resolved | Public text fields have no product or DB max length for comments, store notes, and log notes. Evidence: `src/lib/action-validation.ts:43`, `src/lib/action-validation.ts:66`, `src/lib/action-validation.ts:80`, `src/app/logs/[logId]/page.tsx:82`. | none | none | Resolved by `IMPL-0006-03`: app validation now caps comments at 1,000 characters and store/log notes at 2,000 characters, mirrored by DB check constraints `price_log_comments_body_max_length`, `stores_notes_max_length`, and `price_logs_notes_max_length`. |
| FINDING-011 | low | resolved | Username/profile updates are not rate-limited, unlike store/item/log/comment/vote actions. Evidence: `src/app/actions.ts:93`, `src/lib/action-helpers.ts:16`. | none | none | Resolved by `IMPL-0006-03`: account settings updates now consume the `profile-update` rate-limit bucket before username conflict checks or profile writes. |
| FINDING-012 | medium | deferred | Tax/currency is a hard product invariant while geography remains open: app and schema are yen-specific and derive tax with a fixed 8% rule. Evidence: `docs/CURRENT_PRODUCT.md:18`, `src/lib/pricing.ts:1`, `src/app/actions.ts:285`, `supabase/migrations/202604290001_price_log_integrity.sql:50`. | none | none | Reason: Japan-first/yen-only scope versus broader tax/currency modeling is a product decision. Revisit before geography expansion. |
| FINDING-013 | medium | deferred | Existing tax-excluded backfill used 10%, while the current app and DB trigger use 8%. Evidence: `supabase/migrations/202603210002_feedback_iteration.sql:41`, `src/lib/pricing.ts:11`, `supabase/migrations/202604290001_price_log_integrity.sql:50`. | none | none | Reason: normalizing historical tax values depends on the chosen tax policy and live-data inspection. PLAN-0006 DB readiness may verify current migrations only; historical tax normalization stays deferred until the tax-scope decision and live-data inspection are approved. |
| FINDING-014 | medium | deferred | "Append-only" / history-preserving log language conflicts with owner edit/delete behavior and no audit/tombstone model. Evidence: `docs/DECISIONS.md:43`, `docs/orientation/ARCHITECTURE.md:25`, `src/app/actions.ts:409`, `src/app/actions.ts:483`, `src/app/logs/[logId]/edit/page.tsx:27`. | none | none | Reason: mutable observations versus append-only history is a product/data-governance decision. Revisit before public launch or audit/history features. |
| FINDING-015 | medium | deferred | Online stores are compared as exact stores without delivery, shipping, service-area, or listing-url semantics. Evidence: `docs/CURRENT_PRODUCT.md:5`, `src/lib/action-validation.ts:45`, `src/lib/demo-data.ts:105`, `src/lib/query-read-models.ts:141`. | none | none | Reason: online-store comparison semantics need product judgment. Revisit before improving ranking or online-store UX. |
| FINDING-016 | low | deferred | Unit helpers still expose legacy conversion vocabulary while product writes force item-unit-only packages. Evidence: `src/lib/measurements.ts:20`, `src/lib/action-validation.ts:11`, `src/app/actions.ts:303`, `supabase/migrations/202604290001_price_log_integrity.sql:37`, `docs/OPEN_QUESTIONS.md:56`. | none | none | Reason: unit normalization breadth is already an open product question. Revisit when product units are deliberately expanded or simplified. |
| FINDING-017 | medium | resolved | Non-compare maps lack the resize/orientation lifecycle hardening used by the compare map, even though the manual checklist expects resize/orientation verification for all map surfaces. Evidence: `src/components/compare/comparison-map.tsx:85`, `src/components/stores/store-directory-map.tsx:47`, `src/components/map/store-location-picker.tsx:60`, `docs/repo-health/debugging/map-manual-verification.md:40`. | none | none | Resolved by `IMPL-0006-04`: the compare map invalidation behavior was extracted to a shared `InvalidateMapSize` helper and added to the store directory and store location picker maps; manual verification notes were updated. |
| FINDING-018 | medium | resolved | The "create missing item/store" flow from the price-log form drops draft state except the newly created entity name. Evidence: `src/components/forms/price-log-form.tsx:217`, `src/components/forms/price-log-form.tsx:237`, `src/app/actions.ts:82`, `src/app/actions.ts:227`, `src/app/prices/new/page.tsx:48`. | none | none | Resolved by `IMPL-0006-05`: the new-log form now saves safe scalar draft fields to `sessionStorage` before the missing item/store roundtrip, restores them on return to `/prices/new`, excludes photo data/file inputs deliberately, and clears the stored draft on price-log submit while restoring it if the action returns an error. |
| FINDING-019 | low | resolved | Mobile header search overlay lacks an Escape/keyboard close path. Evidence: `src/components/navigation/header-search.tsx:42`, `src/components/navigation/account-menu.tsx:24`, `src/app/globals.css:1603`. | none | none | Resolved by `IMPL-0006-04`: the header search listens for Escape, closes the overlay, and returns focus to the Search toggle. |
| FINDING-020 | medium | deferred | Page-level/browser coverage is still absent for route auth states, map render/resize, create-entity roundtrips, and remaining resilience risks. Evidence: `package.json:5`, `package.json:22`, `docs/repo-health/plans/PLAN-0003-contribution-accessibility-fixes/IMPL-0003-03-form-focus-styling-and-map-verification.md:56`. | none | none | Reason: component tests plus manual map checklist are acceptable for the current MVP stabilization phase. Revisit trigger: before public launch, before broad UI changes, or when adding flows that depend on multi-page state preservation. |
| FINDING-021 | high | resolved | Production dependency vulnerabilities were present: `next@16.2.1` was below the advisory fix for a Server Components DoS, and it pulled vulnerable `postcss@8.4.31`. Evidence: `package.json:16`, `package-lock.json:5894`, `package-lock.json:6264`, `npm audit --omit=dev --json`. | none | none | Resolved by `IMPL-0006-01`: `next` and `eslint-config-next` are updated to `16.2.4`, a scoped npm override forces Next's transitive `postcss` to a fixed version, and `npm audit --omit=dev` reports `found 0 vulnerabilities`. |
| FINDING-022 | medium | resolved | Dev/tooling dependency audit failed through `vitest`/tooling transitive dependencies including `vite`, `picomatch`, and `brace-expansion`. Evidence: `package.json:34`, `package-lock.json:7568`, `package-lock.json:7688`, `npm audit --json`. | none | none | Resolved by `IMPL-0006-01`: `vitest` is updated to `4.1.5`, scoped npm overrides force fixed `picomatch` and `brace-expansion` transitive versions, and full `npm audit` reports `found 0 vulnerabilities`. |
| FINDING-023 | medium | resolved | No dependency update/advisory workflow existed, so known vulnerable pins could sit indefinitely. Evidence: `.github/workflows/ci.yml:27`, `.github/workflows/ci.yml:30`, `docs/repo-health/audits/audit-profile.md:28`. | none | none | Resolved by `IMPL-0006-01`: `.github/dependabot.yml` now checks npm and GitHub Actions weekly, and CI runs `npm audit --omit=dev` after `npm ci`. |
| FINDING-024 | low | accepted-risk | GitHub Actions use version tags rather than immutable SHA pins. Evidence: `.github/workflows/ci.yml:9`, `.github/workflows/ci.yml:19`, `.github/workflows/ci.yml:22`. | none | none | Accepted by owner: repo maintainer. Rationale: acceptable for MVP because workflow permissions are tight (`contents: read`) and CI does not use secrets. Revisit when production release hardening begins; consider SHA pinning and `persist-credentials: false`. |
| FINDING-025 | high | deferred | Account deletion is undefined and likely blocked for contributors because profile deletion cascades from `auth.users` but public contributed records restrict profile deletion. Evidence: `supabase/migrations/202603210001_init.sql:12`, `supabase/migrations/202603210001_init.sql:27`, `supabase/migrations/202603210001_init.sql:37`, `supabase/migrations/202603210001_init.sql:45`, `src/app/settings/page.tsx:31`. | none | none | Reason: account deletion requires a governance decision about anonymizing, retaining, transferring, or deleting public contributions. Revisit before public launch. |
| FINDING-026 | high | deferred | Ownership transfer/anonymization is missing for community-created stores, items, and logs. Evidence: `docs/BACKEND_SCHEMA.md:215`, `docs/BACKEND_SCHEMA.md:244`, `docs/OPEN_QUESTIONS.md:5`. | none | none | Reason: ownership transfer and anonymization policy depends on the account deletion/governance decision. Revisit with `FINDING-025`. |
| FINDING-027 | low | accepted-risk | Storage retention and cleanup remain only partially accepted: there is no storage lifecycle, reconciliation job, quota policy, retention window, backup/restore runbook, or restore semantics. Evidence: `AUDT-0001#FINDING-018`, `src/lib/photo-mutation-compensation.ts:13`, `docs/BACKEND_SCHEMA.md:173`. | none | none | Accepted by owner: repo maintainer. Rationale: acceptable for MVP until production rollout, moderation, quota, storage-cost, or backup/restore work begins. Revisit before production or any photo-heavy usage. |

## Recommendations

Recommended next order:

1. Execute `PLAN-0006` for objective hardening items that do not need product judgment.
2. Continue with `IMPL-0006-02` production readiness guardrails now that `IMPL-0006-01` has resolved the dependency advisories.
3. Add production readiness guardrails covering env gates, migration verification, deploy/rollback runbook, and basic diagnostics.
4. Defer governance/product choices until the owner can decide: default usernames, moderation/reporting, account deletion/anonymization, Japan/yen/tax scope, online-store ranking, and mutable versus append-only logs.
5. Treat browser-level coverage as launch-hardening unless the implementation work reveals a failing flow that needs immediate automated coverage.

## Follow-Ups

- Use `scripts/docs-meta review` to inspect these findings before starting production-readiness or governance work.
- If implementing fixes from this audit, split them into small plans by lane rather than one large catch-all refactor.
