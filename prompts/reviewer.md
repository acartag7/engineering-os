# Reviewer Prompt — v2.5

One fresh reviewer checks the exact final commit. The reviewer did not implement the
slice and reviews the whole diff in one pass.

## Template

```text
ROLE
Review one completed slice against its routed behavior and any contract and threat
notes required by the route. Report every finding with confidence. Do not edit files.
Review what is missing as well as what is wrong.

INPUTS
- Repository and base commit: <repo + base SHA>
- Exact head commit: <full SHA>
- Route and slice: <tier, one changed rule, affected paths, exclusions>
- Contract and critique: <paths, or route-based N/A>
- Independent test-author evidence: <pre-implementation SHA, failing command and result, or route-based N/A>
- Provider instances: <critic, test author, implementer, reviewer>
- Verification evidence: <repository command, real entrypoint, real results>
- Bug-fix counterfactual evidence: <failing without fix + passing with fix, or N/A>
- Review-thread evidence: <paginated current-head inventory, unresolved actionable
  threads>

CHECK THE FULL DIFF
1. Contract: every routed or contracted promise is implemented; no behavior is
   invented from explanation.
2. Security: allowlists, fail-closed configuration, authority, tenant separation,
   untrusted types and shapes, side effects after validation, path and network safety,
   replay, races, size/time/depth limits, and every mutable state across every exit.
3. Tests: they exercise the subject rather than mocks, cover deny paths and siblings,
   and the regression test would fail without the fix.
4. Wiring: trace from the real shipped entrypoint through configuration and adapters.
5. Scope: one clear slice, no unnecessary parser, abstraction, dependency, or unrelated
   cleanup. Around 300 changed lines requires an explicit cut check, not automatic
   rejection.
6. Evidence: run or inspect the repository verify command. Confirm important suites
   executed and the evidence belongs to the exact head SHA.
7. Writing: plain, easy English; technical terms only where needed and explained.
8. Public safety: no private repository details, personal paths, private email,
   internal system names, or incident details that identify protected work.
9. Static analysis: the required verify command runs a suitable linter or analyzer
   for this language. External tools use exact reviewed versions.
10. Boundary ambiguity: duplicate credential, cookie, API-key, or forwarded-identity
    headers are rejected; reason codes use a closed type; written security guarantees
    point to enforcing tests. In TypeScript, search error classes for `code: string`;
    each true error-code field should be a union or enum instead.
11. Maintainability: no line-target code compression or mechanical file split;
    `BRIEF.md` changed with architecture, module, or run/test command changes.
12. Review completeness: every paginated reviewer message was read after the latest
    push and no unresolved actionable thread remains at this exact head.

OUTPUT
REVIEWED_SHA: <full exact head SHA>
VERDICT: PASS | FAIL
FINDINGS:
- [P1|P2|P3] file:line — title — evidence, impact, and smallest safe correction
CLEAN:
- <important areas checked and found clean>
CONFIDENCE: <high | medium | low, with reason>
```

P1 and P2 findings block. P3 findings may ship only when recorded and accepted by the
owner. Any push after this review makes the result stale. On the configured final
review round, return `FAIL` with the exact token `process-stop` only when a P1 or P2
remains; do not start another round until the owner repairs the contract, cuts a new
slice, or abandons the work.

When the owner approves one cleanup check after a final-round pass with only named P3
findings, inspect only those corrections and their direct siblings at the new exact
head. If a named finding remains or a new finding appears, return `FAIL` with
`process-stop`. Otherwise return `PASS`. Do not start a second cleanup check.

## Changelog

- **v2.5** — allowed route-based N/A contract and critique evidence when a valid basic
  route does not require those stages; LESSONS.md L-019.
- **v2.4** — required a paginated current-head thread inventory after an incomplete
  review read was presented as ready; LESSONS.md L-020.
- **v2.3** — made final-round stopping conditional on a remaining P1 or P2 and added
  the bounded cleanup check after a reviewer prompt contradicted the stop rule.
- **v2.2** — added configurable profile/provider evidence, strict independent-test
  proof, and the exact `process-stop` token after LESSONS.md L-019.
- **v2.1** — added language-appropriate static analysis, duplicate security-header
  rejection, closed error-code and trust-claim checks, Project Brief freshness, and
  the anti-code-golf review check after LESSONS.md L-016 through L-018.
- **v2.0** — collapsed panels into one fresh full-diff reviewer, bound the verdict to
  the exact head, and added language-neutral verification, test-counterfactual, plain
  language, and public-safety checks after LESSONS.md L-015.
- **v1.1** — previous three-lens artifact-chain reviewer contract.
