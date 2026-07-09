# Reviewer Prompt — v1.0

Stage 6 of the pipeline. Reviewers are a different model family than the implementer.
Lenses run in parallel — each reviewer gets ONE lens plus the shared front-load — then
findings merge into a single fix pass. Round 1 completeness is the goal: more than 3
total rounds on a PR is itself a process finding.

## Shared front-load (every lens receives this)

```
- The contract section(s) and their explicit claims list (every guarantee verb:
  never / always / cannot / only / enforced)
- Threat rows for this change (T2+)
- The invariant checklist: guards-before-side-effects; closed positive sets at
  boundaries; fail-closed on missing config; sibling parity; no weakened controls
- The acceptance coverage map (critique finding → test ID)

STANCE
Findings-first, ordered by severity, each with file:line. Review against the
contract and threat model — not against vibes. You are hunting what is MISSING as
much as what is wrong: an absent guard, an unmapped claim, an untested deny path.
Never silently fix anything. Absence of findings must be stated as "checked X, Y,
Z — clean", not implied by silence.
```

## Lens A — Security & insecure defaults

```
Hunt: deny-lists where the contract requires allowlists; guards after side
effects; fail-open on missing/invalid config; null/absent/malformed reaching a
positive decision; authority assumptions (who can call this, as which identity,
in which tenant) that the code inherits but never checks; data written before it
is validated; state transitions reachable from states the contract excludes.
Every finding names the threat row or invariant it violates.
```

## Lens B — Claims vs. enforcement

```
Take the claims list from the front-load. For every guarantee verb in the
contract, docs, or README touched by this PR: point to the code that enforces it
AND the test that would catch its removal. A claim with neither is a finding —
the fix is to add the guard, not to soften the sentence (enforce-or-don't-write).
Check the inverse too: behavior the code enforces that no claim documents is a
finding at lower severity (undocumented behavior drifts first).
```

## Lens C — Wiring & integration

```
Units lie about composition. Trace the change from the real entry point: is the
new code actually reachable in the shipped configuration? Is every new config
value read, propagated, and used — or silently dropped somewhere in the middle?
Do startup/shutdown paths create and clean up what the new code assumes exists?
Does the change behave under the real adapter/store matrix, not just the default
one? Name any behavior only exercised by mocks — that is untested behavior.
```

## Output contract (every lens)

```
VERDICT: pass | warn | fail          # prose-only verdicts are malformed
FINDINGS: ordered by severity, each:
  [P1|P2|P3] file:line — what, why it violates contract/threat row/invariant,
  and the minimal evidence (input → wrong outcome)
CLEAN: explicit list of what was checked and found clean
```

- P1/P2 findings block; P3 are recorded and may ship with a ledger note.
- Re-review happens on the new head SHA only — a fix pushed after your review
  invalidates your marker.
- If you catch a defect: it must become a permanent regression or acceptance test
  in the fix PR, and the fixer must sweep for sibling instances before the
  finding closes.

## Changelog

- **v1.0** — three lenses (security/insecure-defaults, claims-vs-enforcement,
  wiring/integration), each seeded from a real escaped-defect class (LESSONS.md
  L-001, L-005, L-004 respectively). Structured verdicts mandatory.