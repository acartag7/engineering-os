# Speed vs. Safety Policy

Three levers are set per change, by change tier: **which model/config implements**,
**how much verification**, and **how many independent implementations**. The tier is
determined by trust-boundary proximity — not by how big the diff is.

Agent-hours are cheap; the operator's attention is the constraint. Every rule below is
designed so the expensive resource being spent is machine time, and human attention is
reserved for judgment.

## Change tiers

| Tier | Definition | Examples |
|---|---|---|
| **T0** | Mechanical, no behavior change | renames, dep bumps, formatting, chores |
| **T1** | Behavior change, no trust boundary | features, UI, non-boundary logic |
| **T2** | Touches a trust boundary | auth, tenancy, tokens, scopes, redaction, egress, writebacks, state machines guarding data integrity |
| **T3** | Security-critical parser/state machine, or a *novel* boundary being implemented for the first time | input parsers on untrusted data, permission evaluation, claim/evidence promotion logic |
| **Docs** | Deployer- or user-facing prose | READMEs, guides, API docs |

## The policy matrix

| | T0 | T1 | T2 | T3 | Docs |
|---|---|---|---|---|---|
| **Critique stage** | — | default-on¹ | **mandatory** | **mandatory** | — |
| **Independent acceptance suite** | — | default-on¹ | **mandatory** (hash-frozen) | **mandatory** (hash-frozen) | — |
| **Implementations (N)** | 1 | 1 | 1 | **2–3, judged by the frozen suite + blind review** | 1 |
| **Implementer config** | fast config | default config | strongest config | strongest config | any |
| **Review** | bot only | 1 independent reviewer, different family | different family + parallel lenses (security / claims / wiring) | two families + parallel lenses | claims-vs-enforcement pass (PC-04) |
| **Extra verification** | CI floor | CI floor | property tests if parser/encoding is touched; threat rows updated first | abuse fixtures derived from threat rows; property tests mandatory | guarantee-verb grep |

¹ *Default-on with an explicit skip:* generated prompts include the stages unless the
task carries a `Process-Skip: acceptance — <reason>` trailer. Skips are counted by the
monthly audit; a rising skip rate is a process finding, not a convenience.

**Tier assignment is part of the contract stage** and recorded in the spec. When in
doubt between two tiers, take the higher one — misclassifying down is how boundary
code ships on implementer-authored tests.

### Change routing record

Every change records this compact header in its spec, or in the PR body when no spec
is needed:

```text
Route: <T0 | T1 | T2 | T3 | Docs>
Reason: <why this route fits>
Required evidence: <stages, tests, review, runtime evidence>
Evidence links: <filled before merge>
Acceptance-criteria version: <AC-n | not applicable>
```

This makes the selected process inspectable without making supporting rationale part
of the binding contract. **Enforcement: PROMPT + AUDIT, not HARD.** The monthly audit
flags missing records on T1+ changes; `process-guard` does not parse this header.

### Discovery is a lane, not a delivery tier

Discovery is allowed when a decision cannot be made honestly without an experiment.
Its record states: the question, owner, time or scope bound, permitted environment,
prohibited actions, and exit decision. Discovery has no production credentials or
mutations, produces observations rather than completion claims, and cannot be merged
or deployed as the delivery implementation. Once the unknown is resolved, delivery
starts at the normal contract stage; experimental code is discarded or re-authored
against that contract.

**Enforcement: PROMPT + AUDIT, not HARD.** Repository-specific sandbox or credential
denies may make parts HARD, but no fleet-wide isolation gate is claimed.

## Model routing (quality-based defaults)

Routing is decided by measured quality on real slices, wall-clock, and fit — re-baked
whenever a new model ships. Current defaults:

- **Default implementer:** the strongest available coding config — currently GLM 5.2
  at maximum effort with workflow orchestration. Bake-off evidence: effort and
  orchestration mattered as much as model identity; the same model at a lower effort
  tier produced the worst of four implementations, including a trust-boundary defect.
- **Speed-sensitive T0/T1:** GPT 5.5 at high effort (2nd in quality, ~4× faster in the
  reference bake-off).
- **Acceptance author:** any strong model from a **different harness/family than the
  implementer** — the split is the point, not the specific model.
- **Reviews:** a different family than the implementer, always. Currently Claude for
  review and adjudication.
- **Never** route T2+ implementation to a low/medium-effort config, regardless of model.

## Redundancy policy

N>1 independent implementations are reserved — they are cheap in agent-hours but
expensive in adjudication unless the frozen acceptance suite exists to act as judge:

- **T3 changes:** 2–3 candidates, same prompt, parallel worktrees. The frozen suite
  scores first; a blind review ranks the survivors; best ideas from runners-up get
  grafted deliberately, never from memory.
- **New-model evaluation** (see below).
- Everywhere else: N=1. Redundancy without a pre-authored judge converts free agent
  time into expensive human comparison time.

## New-model evaluation protocol

A new model is never adopted on launch-day vibes:

1. It takes the **implementer seat as an extra candidate** on the next real T1/T2
   slice — same generated prompt as the incumbent, parallel worktree.
2. The frozen acceptance suite judges mechanically; the independent review ranks
   quality (structure, boundary handling, test honesty).
3. Adoption requires **two consecutive clean slices**: quality ≥ incumbent and no
   unique review findings against it.
4. Losing candidates cost nothing but compute; the comparison artifacts (tags per
   candidate) are kept for later re-baking.

The same protocol re-runs for the *incumbent* when its provider ships a major version.

## Review capacity is a budget, not a backstop

AI review (Codex, CodeRabbit, Greptile, any of them) runs on shared quotas — per-seat
limits, rate limits, or plan caps. One PR that burns 16 rounds starves every other PR
and future review of the same capacity. So:

- Review exists to **verify**, never to **discover**. A round that teaches you what
  the spec should have said is the most expensive possible way to write a spec:
  serialized, quota-billed, and after the code already exists.
- Target: 1–2 rounds per PR. More than 3 is recorded as a process failure (PC-15) —
  the question is never "why did review find so much" but "why did so much reach
  review."
- Round burn is tracked per repo by the audit, like cost. A repo trending up is a
  signal its contracts or upstream gates are weakening.

## Production-mutation overlay

Passing the artifact chain proves properties of a software revision; it does not prove
that one production action is safe. For a system that changes live state, the change
contract names the runtime evidence needed before and after each mutation: target and
deployed revision, observed preconditions, accountable authorization, stop conditions,
rollback readiness, and postcondition evidence. Approval/evidence state belongs outside
the AI orchestrator.

**Enforcement: NOT YET ENFORCED fleetwide (Layers 2–3).** Each operational repository
must push these items into runtime gates before claiming HARD enforcement; until then,
the gap is named in its threat model or accepted risks.

## Verification floor (all tiers, every repo — see BASELINE.md)

Frozen-lockfile installs, exact pins, SHA-pinned actions, secret-history lint,
anti-silent-skip, and the repo's full verify (typecheck + tests + build) as required
status checks. Merges happen only via PR with review; never a direct push to a
protected branch; never `--no-verify`; never weaken a check to get green.
