# Rationale and design pressure

> **Status:** explanatory analysis and potential improvements—not an authoritative
> policy document. **Enforcement layer: 3 (prose).** Current rules remain in
> [`OS.md`](OS.md), [`POLICY.md`](POLICY.md), and [`BASELINE.md`](BASELINE.md).
> Suggestions explicitly marked **not yet enforced** do not describe current gates.

## Bottom line

Engineering OS is not fundamentally overengineered. It is appropriately skeptical
for security-sensitive, irreversible, or trust-boundary work. Its core controls answer
failures that have happened in practice rather than adding generic ceremony.

It would be too much if every change received the maximum pipeline. The existing
T0–T3 policy avoids that: the same engineering values apply everywhere, while the
amount of independent evidence follows risk.

The main danger is not “too much engineering.” It is useful engineering slowly turning
into compliance theatre—artifacts produced because the process expects them, reviewed
superficially, and treated as proof because they look comprehensive.

## Why this is no longer vibe coding

A vibe-driven loop usually looks like:

```text
prompt → plausible code → coder-authored tests → self-review → merge
```

Engineering OS deliberately breaks that correlated chain:

```text
human-owned promise
        ↓
independent critique
        ↓
independently authored acceptance evidence
        ↓
frozen test bytes
        ↓
implementation
        ↓
independent review
        ↓
external enforcement
```

The important property is not the number of agents. The implementation is evaluated
against criteria authored before it existed; changed test bytes are visible to the
freeze gate; and required status checks sit outside the agent runtime. The current
contract-change unlock is intentionally coarse, so this is separation and evidence—not
an absolute proof of independence.

## What is especially strong

### Controls have a reason to exist

The lessons ledger ties controls to escaped defects, near-misses, or practices already
proved in a repository. This resists checklist growth without evidence behind it.

### False green is treated as a first-class failure

A test suite that silently skipped, a parity job using the wrong corpus, or a guard
reading attacker-controlled inputs can all report green while proving nothing. The OS
requires verifiers to establish that their own evidence is present and trustworthy.

### Enforcement is outside orchestration

Prompts guide agents; they do not constrain them. Git history, frozen hashes, CI, and
platform controls provide the walls. The system that dispatches work is subject to the
same walls rather than holding approval state itself.

### Residual risk is named

Controls are described as hard, partial, audited, prompt-only, or not yet enforced.
That is more useful than presenting “secure” or “governed” as binary properties.

## How a good process can become heavy

### The contract becomes a second implementation

Detailed reasoning is valuable, but a very large normative contract becomes difficult
to read completely and easy to update inconsistently. Its existence can start to
substitute for shared understanding.

### A frozen test freezes a misunderstanding

Independent authorship reduces correlated mistakes; it does not guarantee a correct
contract or complete suite. Frozen evidence needs an explicit, reviewed replacement
path when the underlying promise is legitimately corrected.

### Model diversity is mistaken for full independence

Different model families can still share the same incomplete source material and
conventional assumptions. Critical operational or domain claims still need accountable
human ownership and evidence from the real system.

### Discovery is forced to pretend it is delivery

Some contracts require experiments before they can be written honestly. If there is
no safe discovery lane, exploratory code may be disguised as implementation or an
uncertain contract may be frozen prematurely.

### Exemptions quietly become permanent

A visible exception is better than a hidden bypass. Without an owner, reason, review
date, and removal condition, however, temporary exemptions tend to become normal
configuration.

### Artifact volume substitutes for judgment

AI can generate an impressive contract, threat model, suite, and review. If nobody can
state the important promises, dangerous failures, evidence, and unknowns plainly, the
result is **vibe governance**: formal-looking output without accountable understanding.

## Potential improvements

Everything in this section is **not yet enforced** unless it already appears in an
authoritative file linked above. Some proposals extend partial mechanisms that already
exist; each item says so where relevant. These are design directions, not current
guarantees.

### 1. Make the selected route visible

The repository already defines change tiers. A small header in each change contract
could make the decision immediately inspectable:

```text
Change tier: T2
Reason: transfers data across a trust boundary
Required evidence: critique, frozen acceptance suite, cross-family review
```

This is an ergonomics improvement, not a new tier model.

### 2. Separate normative promises from supporting reasoning

Keep the binding surface compact and identifiable—for example, stable invariant IDs
and decision tables—while retaining longer threat analysis, alternatives, examples,
and incident history as supporting material.

A reviewer should be able to enumerate the promises without treating the surrounding
reasoning as optional or attempting to memorize an entire design history.

### 3. Extend the current re-freeze path with explicit versioning

Today, a configured contract-path change opens a coarse, reviewed re-freeze path. That
prevents the implementation from changing frozen evidence silently, but it does not
bind one contract change to one specific suite change.

A future replacement path could add explicit suite versions, independent authorship of
the new version, preserved history of the old version, and a newly frozen manifest
before implementation changes.

### 4. Bound a discovery lane

Exploration can be legitimate when it is structurally prevented from becoming an
unreviewed production path:

- no production credentials or mutations;
- no claims that an experiment is complete implementation;
- observations converted into an explicit contract;
- deployable implementation authored against the reviewed contract afterward.

A prototype proves only the property it actually exercises.

### 5. Extend exemption handling with explicit lifecycle metadata

Today, onboarding defines a base-branch exemption marker and audit escalation. A richer
machine-readable exception record could additionally include:

```yaml
control: PC-08
reason: repository predates its first frozen acceptance suite
owner: repository-owner
created: YYYY-MM-DD
review_by: YYYY-MM-DD
removal_condition: first independent suite is merged and frozen
```

An expired review date could produce an overdue finding without pretending the gap was
never accepted.

### 6. Measure outcomes, not artifact count

Useful process-health signals include:

- defects caught before implementation merge;
- defects escaping all gates;
- false-green and silent-skip incidents;
- review rounds per change;
- contract changes after coding began;
- acceptance tests that caught a real implementation defect;
- exemption count and age;
- incident classes missing from the current threat model.

These signals make it possible to remove controls that create cost without addressing
a credible failure and spread controls that repeatedly catch defects cheaply.

### 7. Add runtime evidence for operational systems

Software artifact integrity does not establish that one production operation is safe.
A production-changing system may also need evidence about the actual environment,
preconditions, observed state, stop conditions, exercised rollback, and the accountable
human authorizing the next mutation.

The evidence can be compact. Its purpose is to prevent “the implementation passed”
from being treated as “this particular production action is safe.”

## What should remain load-bearing

The following existing ideas provide the process’s identity and should not be weakened
merely to make it feel lighter:

- contract before trust-boundary implementation;
- critique before review is forced to discover the design;
- independently authored acceptance evidence;
- hash-frozen suites and mixed-diff protection;
- fail-closed decisions at trust boundaries;
- enforcement outside the agent orchestrator;
- explicit anti-silent-skip checks;
- real-entry-point end-to-end verification where applicable;
- the PC-04 claims-versus-enforcement pass for public documentation;
- residual risks and unenforced intentions labelled honestly;
- escaped failures converted into reusable controls.

“Lightweight” should mean less effort carrying rigor: smaller normative surfaces,
clearer routing, automated traceability, bounded discovery, expiring exceptions, and
less duplicated prose. It should not mean returning approval authority to the system
that generated the work.

## A practical comprehension test

Regardless of document size, an accountable owner should be able to answer:

1. What are the most important promises?
2. What credible failures can cause real harm?
3. Which independent evidence exercises each promise?
4. What remains unproven or accepted as residual risk?
5. Why is the available evidence sufficient for this change tier?

If those answers are unclear, generating more artifacts is unlikely to fix the
problem. The process is working when its evidence makes those answers easier—not when
it merely makes the repository look rigorous.
