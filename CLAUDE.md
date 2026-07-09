# engineering-os

tier: S (public)

This repo IS the process — treat edits to it with the same rigor the process demands
of code.

- `OS.md` is the source of truth for the pipeline and enforcement layers.
- `BASELINE.md` items are only added via `LESSONS.md` entries — never invent checklist
  items without an incident origin.
- Every rule stated anywhere in this repo must carry its enforcement layer; "not yet
  enforced" is an explicit, allowed state — an unlabeled rule is a defect.
- Prompt templates in `prompts/` are versioned; changes bump the version and add a
  changelog line explaining which incident or gap motivated them.
- `process-guard/` changes are T2 by this repo's own policy (they gate every other
  repo): contract first, frozen acceptance suite, independent review.
- Public-content boundary: incidents are described class-level only — no private-repo
  internals, no employer/customer names, no subscription/pricing details.
