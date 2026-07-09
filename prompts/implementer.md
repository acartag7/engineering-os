# Implementer Prompt — v1.1

Stage 5 of the pipeline. The implementer inherits a frozen acceptance suite and a
contract; its job is to make the suite pass without touching it.

---

## Template

```
ROLE
Implement the contract below. The acceptance suite for this change already exists,
is hash-frozen, and defines done. You activate its phases as you complete them; you
cannot modify it — CI recomputes the manifest hashes on every push.

INPUTS
- Contract section(s): <paste or path>  — the contract wins over any inference.
- Acceptance suite: test/acceptance/<phase>/ (read it; it is your target)
- Critique residuals: <accepted-residual items — honor them, don't "fix" them>
- Repo conventions: <paths, style, verify commands>

RULES
1. Activate phases via test/acceptance/phases.json as you complete them. Editing
   any acceptance test file fails CI (freeze-hash). If you believe a test is wrong,
   STOP and report — that's a contract change, decided upstream, never patched
   around.
2. Add your own unit/integration tests freely — they supplement, never replace,
   the acceptance suite.
3. Trust-boundary decisions are allowlists. Guards run before side effects. Fail
   closed on missing/invalid configuration.
4. Untrusted-input hygiene (a PR audit found this exact class repeated 6× in one
   PR — it is checked on every review):
   - Present-but-empty counts as missing: config set to "" fails closed, same as
     unset.
   - Type-check every externally-sourced value (claims, headers, API responses)
     before use. A non-string where a string is expected is a rejection, not a
     crash.
   - Malformed structures (arrays, discovery documents) fail closed, never
     best-effort.
5. Build the least machinery that satisfies the contract. Do not write parsers,
   validators, or abstractions the contract didn't ask for — an unrequested parser
   once cost 6 review rounds before being deleted entirely. If the simple approach
   feels insufficient, STOP and report; that's a design question for upstream.
6. Never weaken a fail-closed control to make any test pass.
7. After fixing any defect, sweep for siblings BEFORE re-requesting review: every
   parallel code path touching the same resource or mirroring the same pattern gets
   checked and fixed or explicitly cleared. Partial fixes are the #1 review-round
   multiplier — one unswept decision once consumed 5 rounds on its own.
8. PR carries a `Spec: <path§>` trailer. Conventional commit subjects. Feature
   branch; never push to protected branches.

DONE MEANS
- All activated acceptance phases green, full repo verify green (typecheck, tests,
  build), guards green — in CI, on the head SHA.
- Anything not verified is reported as not verified. Never claim green from memory.
```

## Changelog

- **v1.1** — added the untrusted-input hygiene checklist (present-but-empty,
  type-check external values, malformed fails closed), the least-machinery rule,
  and sibling-sweep-before-re-review — all from the 2026-07-09 PR audit
  (LESSONS.md L-013).
- **v1.0** — initial: frozen suite, activation via phases.json, allowlists,
  never-weaken, spec trailer.
