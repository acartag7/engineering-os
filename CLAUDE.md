# engineering-os

tier: S (public)
verify: ./scripts/verify
real entrypoint: ./scripts/verify

This repo IS the process — treat edits to it with the same rigor the process demands
of code.

- `OS.md` is the source of truth for the pipeline and enforcement layers.
- `BASELINE.md` items are only added via `LESSONS.md` entries — never invent checklist
  items without an incident origin.
- Every rule stated anywhere in this repo must carry its enforcement layer; "not yet
  enforced" is an explicit, allowed state — an unlabeled rule is a defect.
- Prompt templates in `prompts/` are versioned; changes bump the version and add a
  changelog line explaining which incident or gap motivated them.
- Root `BRIEF.md` is updated with architecture, module, and run/test command changes.
- `process-guard/` changes are T2 because the optional guard protects repositories
  that choose it: contract first, regression tests, real verification, independent
  exact-head review.
- Public-content boundary: incidents are described class-level only — no private-repo
  internals, no employer/customer names, no subscription/pricing details, and no
  repo-identifying specifics (protocol/tech names, PR numbers, exact round counts or
  file counts that could be matched to a findable public PR). Abstract the story,
  keep the lesson.
