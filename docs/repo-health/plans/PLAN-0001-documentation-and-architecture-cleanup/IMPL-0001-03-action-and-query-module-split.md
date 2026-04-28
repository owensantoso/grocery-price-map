---
type: implementation-brief
id: IMPL-0001-03
title: Action and query module split
domain: repo-health
status: draft
created_at: "2026-04-28 22:51:03 JST +0900"
updated_at: "2026-04-29 01:01:18 JST +0900"
parent_plan: PLAN-0001
task_refs:
  - AUDT-0001#FINDING-016
owner: 
areas: []
depends_on:
  - IMPL-0001-01
  - IMPL-0001-02
  - IMPL-0002-01
  - IMPL-0004-01
  - IMPL-0004-02
parallel_with: []
related_specs: []
related_adrs: []
related_sessions: []
related_issues: []
related_prs: []
linked_paths:
  - src/app/actions.ts
  - src/lib/queries.ts
  - src/lib/models.ts
  - src/lib/supabase/server.ts
  - src/lib/supabase/public.ts
repo_state:
  based_on_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
  last_reviewed_commit: e7f59d0c770f05d4e7720ef54e4865c6eb245081
---

# IMPL-0001-03 - Action and query module split

## Parent Plan

- PLAN-0001

## Task Goal

Reduce the two largest code gravity wells without changing product behavior.

## Scope

In scope:

- split `src/app/actions.ts` into domain-oriented action modules if Next server action constraints allow it cleanly
- split `src/lib/queries.ts` into smaller read/snapshot modules
- extract repeated row mapping or vote summary helpers when it reduces real duplication
- address or explicitly preserve the log-detail duplicate item-log assembly path from `AUDT-0001#FINDING-016`
- preserve existing route imports or update them surgically

Out of scope:

- changing Supabase schema
- changing route UX
- adding admin/moderation/product expansion
- replacing server actions with a different mutation architecture
- starting before the backend write-integrity boundary and verification gate decisions are recorded

## Execution Steps

1. Read tests and docs from `IMPL-0001-02`, backend-boundary notes from `IMPL-0002-01`, and read/verification decisions from `IMPL-0004-01` and `IMPL-0004-02`.
2. Map current exported functions and route/component imports.
3. Choose the smallest split that lowers cognitive load.
4. Move one domain at a time and run tests after each meaningful move.
5. Update architecture docs only if module boundaries actually changed.

## Verification

```bash
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
PATH=/Users/macintoso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build
```

## Done Checklist

- [ ] Large modules are smaller or a blocked reason is documented.
- [ ] Public route behavior is preserved.
- [ ] Imports remain understandable.
- [ ] Verification complete.
