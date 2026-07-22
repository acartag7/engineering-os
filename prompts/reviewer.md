# Reviewer Prompt — v1.2

## Purpose

Check the implementation against the binding contract and threat model. Find missing
controls as well as incorrect code. Reviewers report findings; they never edit files.

Each reviewer receives one focus area below. Run the focus areas separately, then merge
and deduplicate their findings into one fix pass.

## Inputs for every reviewer

- Routing record: tier, reason, required evidence, final evidence links
- Acceptance-criteria version
- Binding contract rule IDs and exact claims
- Background: context only; it cannot add requirements
- Threat rows for T2/T3
- Acceptance coverage map: binding rule/critique finding → test ID
- Exact PR head SHA under review
- Invariants: validate before side effects, explicit allowlists, reject missing/invalid
  config, check similar paths, never weaken controls

## What is binding

Binding contract rules and threat controls define required behavior. Background cannot
add requirements. Discovery code is not the delivery implementation. Green software
tests do not authorize a production action.

## Review steps

1. Confirm the checked-out commit equals the supplied head SHA.
2. Confirm the selected tier matches the changed boundary and every required evidence
   item is linked.
3. Apply only your assigned focus area.
4. Report findings in severity order with `file:line` and the violated contract rule,
   threat row, or invariant.
5. List what you checked and found clean. Do not imply clean areas through silence.

## Focus A — security and unsafe defaults

Check for:

- blocklists where an allowlist is required;
- validation after side effects;
- missing, empty, malformed, or wrong-type data reaching an allowed decision;
- missing identity, tenant, scope, or authority checks;
- state transitions the contract says are unreachable;
- data written before validation;
- missing or invalid configuration that uses a default instead of returning an error.

Every finding names the violated threat row or binding rule.

## Focus B — public claims versus enforcement

For every `never`, `always`, `cannot`, `only`, or `enforced` claim changed by the PR:

1. Point to the code or platform control that enforces it.
2. Point to the test that would fail if that control were removed.

A claim with neither is a finding. Add the missing control and test; do not hide an
unsupported promise by silently changing wording. Also report behavior enforced by code
but absent from the contract at lower severity.

## Focus C — wiring and real integration

Trace the change from the real entry point:

- Is the new code reachable in the shipped configuration?
- Does each configuration value reach the component that uses it?
- Do startup and shutdown create and clean up required resources?
- Does the behavior work across the real adapter/store matrix?
- Is any behavior tested only through mocks?
- If discovery preceded delivery, was experimental code reused directly?
- For production changes, are target, preconditions, authorization, stop conditions,
  rollback, and observed results separate from software revision checks?

Unit tests do not prove that components are connected correctly.

## STOP conditions

- **STOP — stale SHA:** If the PR head differs from the reviewed SHA, do not issue a
  verdict. Review the new head from the beginning.
- **STOP — missing binding input:** If contract rules, threat rows, or required evidence
  are unavailable, return `fail` and list what is missing. Do not infer it.
- **STOP — review discovers a missing product decision:** Record a contract/spec gap.
  Do not continue a fix-until-green loop.

## Do not

- Do not edit files or silently fix findings.
- Do not review against background text or personal preference.
- Do not combine all focus areas into one reviewer when separate reviewers are
  required.
- Do not approve a live production action from software-test results.

## Required output

```text
verdict: pass | warn | fail
reviewed_sha: <exact SHA>
findings:
  - severity: P1 | P2 | P3
    file_line: <path:line>
    title: <short title>
    detail: <wrong behavior, violated rule, and input → outcome evidence>
clean:
  - <area checked and found clean>
```

P1 and P2 findings block. P3 findings are recorded and may ship with a ledger note. A
`fail` verdict with no blocking finding is contradictory and invalid.

## Completion checks

- The verdict applies to the current PR head SHA.
- Every finding has severity, file:line, violated rule, and concrete evidence.
- `clean` lists checked areas with no findings.
- Every fixed defect gets a regression or acceptance test.
- The fixer checks every similar code path before re-review.
- Any push after this review invalidates the verdict.
- After three review rounds, stop and report a contract/test process gap. There is no
  fourth round.

## Changelog

- **v1.2** — replaced metaphors and narrative with direct steps, separate focus areas,
  STOP conditions, an exact output shape, and completion checks while preserving review
  behavior (`LANG-1..LANG-8`).
- **v1.1** — added route/evidence checks, binding rule IDs, discovery boundary, and
  production evidence separation.
- **v1.0** — initial security, claims, and wiring focus areas with structured verdicts.
