---
type: docs-index
title: Research
status: ready
created_at: "2026-04-28 22:48:08 JST +0900"
updated_at: "2026-04-28 22:48:08 JST +0900"
---

# Research

Research notes, surveys, prompts, and exploratory inputs live here when they are useful to keep with the docs paper trail.

Use `RSCH-*` research surveys when the question is:

> What options exist, what do credible sources say, and what should we investigate next?

`RSCH-*` is for sourced landscape work before the team is ready to choose, specify, or build. It should compare at least two options or source clusters and end with a recommendation, shortlist, or next-question set.

Do not use a research survey for repeatable experiments or model bakeoffs; use an `EVAL-*` evaluation instead. Do not use it for one real failed run; use a `DIAG-*` diagnostic record.

Do not create a new `RSCH-*` for one source, one quick chat answer, a decision that is already made, or material that belongs in an existing survey. Update the existing survey when the research question is the same.

## Layout

- Put `RSCH-*` surveys directly in this folder until the project has enough research volume to justify subfolders.
- Keep raw notes out of committed docs unless they are sanitized and useful to future work.

## Filename

```text
RSCH-####-<slug>.md
```

Create new surveys with:

```bash
scripts/docs-meta new research "<Title>" --domain <domain>
```
