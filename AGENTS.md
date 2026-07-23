# engineering-os

tier: S (public)

This repo IS the process. Treat changes to it with the same care the process expects
from other repos.

- `OS.md` is the source of truth for the pipeline and enforcement layers.
- Add a `BASELINE.md` item only when a real incident in `LESSONS.md` supports it.
- Every rule names how it is enforced. If it is not enforced yet, say so.
- Version changes to prompts in `prompts/` and explain the incident behind the change.
- Treat `process-guard/` changes as T2: contract first, frozen acceptance tests, then
  independent review.
- Keep public incident lessons general. Do not name private repos, employers,
  customers, model vendors, PR numbers, prices, or exact counts that identify a public
  incident. Keep the lesson; remove the fingerprint.
