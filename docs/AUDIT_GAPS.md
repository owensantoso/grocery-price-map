# Audit Gaps

This file tracks confirmed mismatches between the current docs and the current implementation.

Unlike `OPEN_QUESTIONS.md`, these are not abstract product questions. They are concrete audit findings that should be resolved before the docs are treated as reliable session guidance.

## 1. Product geography is not settled enough to document narrowly

Current state:
- the live app shell and default map centers are Tokyo/Japan-oriented
- the higher-level product docs were written in a more globally generic way

Why this matters:
- future agents could overfit either direction
- locking the docs to Tokyo today would be premature
- locking the docs to fully global support would also overstate current ambition

Current direction from product review:
- do not treat the product as Tokyo-only
- Japan-wide may be a practical near-term framing
- global use is not ruled out, but would raise scope around localization, scale, and smarter geo filtering

Documentation rule for now:
- describe the product scope as not yet geographically fixed
- treat broader geo support, distance filtering, and area-based filtering as future design pressure, not current commitment

## 2. Supported canonical item units should be documented as only three

Current state:
- the schema and measurement helpers still include broader unit support from earlier iterations
- current item creation and current product behavior are intentionally constrained to:
  - `count`
  - `g`
  - `ml`

Why this matters:
- future agents could infer that `kg`, `l`, or `piece` should still be exposed in product flows
- that would re-open a decision that has already narrowed

Current direction from product review:
- document only the current three canonical item units as product-supported
- legacy broader enum support should be treated as technical residue unless revived intentionally later

Open implementation note:
- a cleanup migration may still be appropriate later if the extra enum values should be removed from the schema entirely
