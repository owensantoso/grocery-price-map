# Audit Profile

Repo-local map for reusable AGENT-DOCS audit guides.

Keep reusable audit method in `docs/repo-health/audits/guides/`. Keep repo-specific paths, commands, exclusions, and sensitive surfaces here.

## Canonical Docs

- Agent index: `AGENTS.md`
- Current state: `docs/orientation/CURRENT_STATE.md`
- Roadmap: `docs/orientation/ROADMAP.md`
- Architecture: `docs/orientation/ARCHITECTURE.md`, `docs/ARCHITECTURE.md`, `docs/ARCHITECTURE_NOTES.md`
- Product baseline: `docs/CURRENT_PRODUCT.md`
- Backend schema: `docs/BACKEND_SCHEMA.md`
- Decisions: `docs/DECISIONS.md`, `docs/decisions/adr/`
- Open questions: `docs/OPEN_QUESTIONS.md`
- Deferred scope: `docs/DEFERRED.md`
- Plans: `docs/repo-health/plans/`, `docs/product/plans/`
- Session logs: `docs/repo-health/session-logs/`
- Generated views: `docs/DOCS-REGISTRY.md`, `docs/TODOS.md`, `docs/ROADMAP-VIEW.md`, `docs/AUDITS.md`

## Code And Config Roots

- App/source roots: `src/app/`, `src/components/`, `src/lib/`
- Tests: `src/**/*.test.ts`, `vitest.config.ts`, `vitest.setup.ts`, `tests/`
- Schemas/migrations: `supabase/migrations/`, `src/lib/database.types.ts`
- Persistence/sync: `src/lib/supabase/`, `src/lib/queries.ts`, `src/app/actions.ts`
- CI: none committed yet
- Release/deploy: `next.config.ts`, `package.json`
- Dependency manifests: `package.json`, `package-lock.json`

## Standard Commands

Read-only checks:

```bash
scripts/docs-meta check
scripts/docs-meta check-links
scripts/docs-meta check-todos
```

Write-mode cleanup commands, only when explicitly in scope:

```bash
scripts/docs-meta update
scripts/docs-meta health --write
scripts/docs-meta roadmap --write
```

Test/build commands:

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build
```

## Audit-Kind Notes

| Audit Kind | Extra Sources | Extra Commands | Notes |
|---|---|---|---|
| `roadmap-alignment` | `docs/orientation/ROADMAP.md`, `docs/repo-health/plans/` | `scripts/docs-meta roadmap` | Check that cleanup sequence matches plan status. |
| `ontology` | `docs/CURRENT_PRODUCT.md`, `docs/DECISIONS.md`, `src/lib/models.ts` |  | Focus on item/store/log language and unit assumptions. |
| `architecture` | `docs/orientation/ARCHITECTURE.md`, `src/app/actions.ts`, `src/lib/queries.ts`, `src/components/` | `wc -l src/app/actions.ts src/lib/queries.ts` | Main current concern is gravity wells, not a rewrite. |
| `schema` | `docs/BACKEND_SCHEMA.md`, `supabase/migrations/`, `src/lib/database.types.ts` |  | Check docs vs migrations and public-read/auth-write assumptions. |
| `security` | `src/app/actions.ts`, `src/lib/supabase/`, `supabase/migrations/` |  | Include RLS, storage paths, owner checks, no-op mutations, and photo lifecycle. |
| `privacy` | `docs/BACKEND_SCHEMA.md`, public profile usage, photo/comment surfaces |  | Watch for email exposure and raw user content in docs/logs. |
| `performance` | `src/lib/queries.ts`, map components, feed/detail routes |  | Focus on all-log reads, repeated snapshots, and Leaflet lifecycle. |
| `accessibility` | `src/components/forms/`, `src/components/navigation/`, map surfaces |  | No dedicated a11y test tooling exists yet. |
| `docs-health` | `AGENTS.md`, `docs/README.md`, `docs/orientation/`, generated views | `scripts/docs-meta check && scripts/docs-meta check-links` | Keep current-state short and generated views current. |
| `test-coverage` | `src/**/*.test.ts`, `src/app/actions.ts`, `src/lib/queries.ts`, frontend components | `./node_modules/.bin/vitest run` | Current coverage is thin and mostly lib-level. |
| `paper-trail` | `docs/repo-health/session-logs/`, `docs/repo-health/plans/`, git status | `scripts/docs-meta status` | Check that completed work has receipts and accurate statuses. |

## Sensitive Or Excluded Surfaces

Never paste raw secrets, tokens, private keys, auth headers, raw user content, transcripts, full logs, media, provider payload dumps, or private JSONL into committed audit docs.

Local-only or sensitive paths:

- `.env*`
- logs: local terminal output unless summarized
- traces: none committed
- private artifacts: raw photos, auth/session payloads, Supabase project details
- generated dumps: any local DB/export dumps

## Unavailable Tools

Record missing tools here so audits do not pretend unavailable checks passed.

- Plain `npm` may be unavailable in some Codex desktop shells. Use the bundled Node `PATH=...` commands above.
