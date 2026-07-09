# Engineering OS

**Agents skip process. Documents don't stop them. Required checks do.**

This repository is my engineering operating system: how I ship software with fleets of
AI coding agents across heterogeneous harnesses — safely, fast, and consistently across
every project I run. It is public because a process that evolves in the open, with its
own failures recorded and converted into checks, is more trustworthy than one described
in a pitch.

It is versioned and evolving. Changes to my own process arrive here as PRs. Every rule
is tagged with where it is enforced — and a rule that is not yet a check is explicitly
labeled *not yet enforced*, never assumed to bind anyone.

## The one-line version

Process became files → files became required checks → checks became the only path to
merge. Every stage of work emits a committed artifact, and CI refuses the next stage
until the previous artifact exists and is intact.

## Why this exists

Running multiple independent AI implementations of the same spec taught me two things
the hard way:

1. **A defective implementation can ship a green, self-authored test suite.** The worst
   of four parallel implementations of one spec contained a real trust-boundary bug —
   with 100+ passing tests it wrote itself. Every implementation returned "APPROVE."
   The defect was caught only by independent adversarial review.
2. **Lessons written as prose decay, even under discipline.** The same documentation
   defect class recurred in the same repo after being flagged and fixed. Verification
   docs drifted from the code they described. Only lessons that became executable
   checks held without attention.

The conclusions: test authorship must be split from implementation authorship, and
every process rule must drain downward until it is a check no agent — and no harness —
can route around.

## What's here

| Path | What it is |
|---|---|
| [`OS.md`](OS.md) | The operating system: the four enforcement layers, the artifact-chain pipeline, project tiers, and the two-plane rule for orchestrators |
| [`BASELINE.md`](BASELINE.md) | The process conformance baseline — numbered, checkable items every repo is audited against, each traceable to a real incident |
| [`LESSONS.md`](LESSONS.md) | The incident ledger. Every defect caught anywhere becomes an entry; every entry becomes or updates a check |
| [`POLICY.md`](POLICY.md) | Speed vs. safety policy: change tiers, model routing, verification depth, and when redundant implementations are worth it |
| [`prompts/`](prompts/) | Versioned prompt templates for the pipeline seats: critique, acceptance author, implementer, reviewer |
| [`process-guard/`](process-guard/) | The shared CI action that hard-enforces the artifact chain: freeze-hash, mixed-diff, and stage-artifact checks |

## The pipeline at a glance

```
1. Define      →  specs/<feature>.md
2. Contract    →  contracts.md §n (+ threat rows for trust-boundary work)
3. Critique    →  specs/<feature>.critique.md          [independent agent]
4. Acceptance  →  test/acceptance/<phase>/ + manifest  [different author than implementer]
5. Implement   →  src/** PR — cannot edit acceptance tests (hash-enforced)
6. Review      →  findings-first, parallel lenses, review marker on head SHA
7. Merge       →  branch protection: all required checks + review. No other path.
```

Stages 3–4 are mandatory for trust-boundary changes and default-on for features
(see [`POLICY.md`](POLICY.md)). The implementer inherits a frozen acceptance suite it
cannot weaken: every test body is hashed into a committed manifest, and CI recomputes
the hashes on every PR.

## The loop that makes it evolve

```
defect caught anywhere → LESSONS.md entry → new/updated baseline item + check
   → process-guard version bump → every repo, one sweep → monthly audit verifies
```

## License

Apache-2.0. If you fork the process, I'd genuinely like to hear what broke first.
