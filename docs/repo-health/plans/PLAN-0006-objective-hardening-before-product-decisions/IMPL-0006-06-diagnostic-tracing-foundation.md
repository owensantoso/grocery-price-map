---
type: implementation-brief
id: IMPL-0006-06
title: Diagnostic tracing foundation
domain: repo-health
status: draft
created_at: "2026-04-29 06:30:48 JST +0900"
updated_at: "2026-04-29 06:30:48 JST +0900"
parent_plan: PLAN-0006
task_refs:
  - AUDT-0002#FINDING-004
owner: 
areas:
  - diagnostics
  - observability
  - performance
depends_on:
  - IMPL-0006-02
parallel_with: []
related_specs:[]
related_adrs: []
related_sessions: []
related_issues: []
related_prs: []
linked_paths:
  - src/app/actions.ts
  - src/app/auth/callback/route.ts
  - src/lib/queries.ts
  - src/lib/price-log-photo-actions.ts
  - src/lib/photo-mutation-compensation.ts
  - docs/repo-health/operations/incident-triage-checklist.md
  - docs/repo-health/debugging/README.md
repo_state:
  based_on_commit: ae0c4b85f4e2a82583ba44c5f243e66b33500474
  last_reviewed_commit: ae0c4b85f4e2a82583ba44c5f243e66b33500474
---

# IMPL-0006-06 - Diagnostic tracing foundation

## Parent Plan

- PLAN-0006

## Task Goal

Add a small, provider-neutral diagnostic tracing foundation so important server-side flows can answer:

- what happened
- which related events belong together
- how long each boundary took
- what failed
- what private data was deliberately not logged

The first version should use structured server logs that work locally in `npm run dev`, in CI/build logs where relevant, and in Vercel/serverless runtime logs. It should not choose a paid observability vendor yet.

## Scope

In scope:

- create a shared diagnostics helper, likely `src/lib/diagnostics.ts`
- define a stable event shape with at least:
  - `schema_version`
  - `ts`
  - `elapsed_ms`
  - `trace_id`
  - `span_id`
  - `parent_span_id`
  - `level`
  - `component`
  - `operation`
  - `event`
  - `event_kind`
  - `duration_ms` where a span ends
  - `outcome`
  - `redaction`
  - `attrs`
- generate correlation IDs for a single request/action flow
- add monotonic timing helpers around server-side spans
- log JSON strings to `console.info`, `console.warn`, and `console.error` so logs remain visible locally and in Vercel
- instrument the first high-value server flows:
  - auth callback
  - price-log create/edit/delete actions
  - price-log photo upload/delete/cleanup
  - core read snapshots in `src/lib/queries.ts` where timings are most useful
- document where logs appear:
  - local terminal during `npm run dev`
  - GitHub Actions logs for verification-only traces
  - Vercel runtime/function logs for deployed server code
- document when local JSONL artifacts are appropriate for explicit diagnostic runs

Out of scope:

- selecting Sentry, Axiom, Datadog, Logtail, Vercel Observability, OpenTelemetry hosting, or any other vendor
- client/browser telemetry collection beyond documenting future options
- logging raw user notes, emails, precise location, auth tokens, full URLs with query strings, photo data, request bodies, or Supabase keys
- adding a persistent production log database
- tracing every component or every query in the app
- using filesystem JSONL as the default production path on serverless infrastructure

## Execution Steps

1. Add a small diagnostics helper with redaction defaults and tests for event shape.
2. Add helpers for `trace_id`, `span_id`, child spans, monotonic timers, and safe attribute serialization.
3. Define the server-log transport as structured JSON to `console.*`.
4. Update existing `auth_callback_*` and `price_log_photo_*` logs to use the shared helper.
5. Instrument price-log write actions with start/end/error events and duration.
6. Instrument a small number of read snapshots where performance questions already exist, especially public feed/account/store detail.
7. Add docs explaining log locations, local versus deployed visibility, and privacy rules.
8. Add or update a `DIAG-*` template/reference only if real trace artifacts are produced during implementation.

## Verification

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH NEXT_PUBLIC_SUPABASE_URL=https://ci-placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=ci-placeholder-anon-key ./node_modules/.bin/next build
scripts/docs-meta check
```

Manual verification:

- Run a local action or route that emits a diagnostic event and confirm it prints in the dev server terminal.
- Confirm at least one error path emits a JSON event with a trace/correlation ID and no raw private content.
- Confirm existing incident-triage docs list the new event names or event families.

## Done Checklist

- [ ] Shared diagnostics helper exists with tests.
- [ ] Auth callback logs use the shared event shape.
- [ ] Price-log write flow emits correlated start/end/error events with timings.
- [ ] Photo upload/delete/cleanup diagnostics use the shared event shape without double-classifying failures.
- [ ] Key read snapshots have lightweight duration events or a documented reason to defer.
- [ ] Docs explain where logs appear locally, in CI, and in deployed server logs.
- [ ] Privacy/redaction rules are documented and covered by tests or review notes.
