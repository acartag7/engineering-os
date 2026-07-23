# Implementer Prompt — v1.3

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
- Routing record + acceptance-criteria version: <paste or path>
- Contract normative invariants: <stable IDs + binding text — these win over inference>
- Supporting rationale: <context only, not an additional requirement>
- Acceptance suite: test/acceptance/<phase>/ (read it; it is your target)
- Critique residuals: <accepted-residual items — honor them, don't "fix" them>
- Repo conventions: <paths, style, verify commands>

RULES
1. Activate phases via test/acceptance/phases.json as you complete them. Editing
   any acceptance test file fails CI (freeze-hash). If you believe a test is wrong,
   STOP and report — implementation pauses while the versioned contract + acceptance
   correction path runs; never patch around or continue against disputed criteria.
2. Add your own unit/integration tests freely — they supplement, never replace,
   the acceptance suite.
3. Trust-boundary decisions are allowlists. Guards run before side effects. Fail
   closed on missing/invalid configuration.
4. Untrusted-input hygiene (a PR audit found this exact class repeated many times
   in a single PR — it is checked on every review):
   - Present-but-empty counts as missing: config set to "" fails closed, same as
     unset.
   - Type-check every externally-sourced value (claims, headers, API responses)
     before use. A non-string where a string is expected is a rejection, not a
     crash.
   - Malformed structures (arrays, discovery documents) fail closed, never
     best-effort.
5. Build the least machinery that satisfies the contract. Do not write parsers,
   validators, or abstractions the contract didn't ask for — an unrequested parser
   once cost several review rounds before being deleted entirely. If the simple approach
   feels insufficient, STOP and report; that's a design question for upstream.
6. Never weaken a fail-closed control to make any test pass.
7. After fixing any defect, sweep for siblings BEFORE re-requesting review: every
   parallel code path touching the same resource or mirroring the same pattern gets
   checked and fixed or explicitly cleared. Partial fixes are the #1 review-round
   multiplier — one unswept decision once consumed several rounds on its own.
8. Prove each regression test is a discriminator: run it on the pinned broken
   revision or with the fix reverted and record the expected failure, then run it
   with the fix. A test that passes both ways does not pin the bug.
9. Before deleting or renaming a file, symbol, command, or config key, search direct
   calls, type references, string literals, dynamic imports, re-exports, barrel files,
   test mocks, package entry points, CI, containers, deploy files, examples, and
   operational scripts. Read the replacement and run the shipped entry point.
10. Proof artifacts are inside the security boundary. Before commit, scan staged
   evidence for the planted test value and ordinary secret patterns. Never quote a
   found value; rotate any real credential that appeared.
11. PR carries a `Spec: <path§>` trailer. Conventional commit subjects. Feature
   branch; never push to protected branches.

DONE MEANS
- All activated acceptance phases green, full repo verify green (typecheck, tests,
  build), guards green — in CI, on the head SHA.
- End-to-end proof names the exact candidate revision and real input, uses the shipped
  entry point, and asserts the user-visible result — not only status or schema.
- Anything not verified is reported as not verified. Never claim green from memory.
- For production mutations, report software verification separately from per-run
  operational evidence. Tests cannot authorize or prove a specific live action.
```

## Changelog

- **v1.3** — added regression counterfactual proof, deletion/rename consumer sweeps,
  staged-proof secret hygiene, and exact-candidate visible-result evidence from
  LESSONS.md L-019 through L-022.
- **v1.2** — added routing/criteria-version inputs, normative-vs-rationale authority,
  the frozen-criteria correction stop, and software-vs-runtime evidence separation
  for practical-process gaps PA-1/PA-2/PA-3/PA-7.
- **v1.1** — added the untrusted-input hygiene checklist (present-but-empty,
  type-check external values, malformed fails closed), the least-machinery rule,
  and sibling-sweep-before-re-review — all from the 2026-07-09 PR audit
  (LESSONS.md L-013).
- **v1.0** — initial: frozen suite, activation via phases.json, allowlists,
  never-weaken, spec trailer.
