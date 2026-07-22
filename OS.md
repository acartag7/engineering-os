# The Operating System

The rules of how I work. Every rule here says **why** it exists — what breaks without
it. Any rule that no machine checks yet is marked **[not yet enforced]**. There is no
third state: a rule is checked, or it's honestly labeled as a wish.

## The three principles

**1. Rules become checks, or they don't count.**
Written rules decay — agents skip them, humans forget them, docs drift from reality.
I've watched all three happen in my own repos. So every rule gets pushed down until a
machine checks it (see the four layers below). A rule that's still only words is a
to-do, not a rule.

**2. The orchestrator never guards itself.**
Any system that dispatches AI agents is itself AI-driven — so it can't be the thing
that enforces the rules. My first factory kept approval state and evidence records
inside the same runtime that ran the agents, and both went wrong. Enforcement lives
outside: in GitHub, in CI, in runtime gates the orchestrator can't edit. The factory
obeys the same walls as everyone else.

**3. Every gate checks its own inputs.**
A gate that runs against the wrong inputs looks green and proves nothing. Real case:
my three SDKs each verify against a shared test-fixture set, pinned by version — and
the pins silently drifted apart. All three were "passing parity" against different
fixtures. So every verifier must also check: am I running the right corpus, at the
right version, at full breadth? A green check that didn't verify its inputs is a lie
with extra steps.

## The four layers — where a rule can live

| Layer | Lives in | Who can ignore it | So it's good for |
|---|---|---|---|
| **0 — Platform** | GitHub itself: branch protection, required checks, required review | Nobody | The final wall |
| **1 — Repo** | Checks committed in the repo: CI jobs, tests, lints, guard scripts | Only by editing the repo — which is visible and blocked by layer 0 | Almost everything |
| **2 — Prompt** | The instructions an agent gets for one task | Any agent, any time it's under pressure | Guidance, never guarantees |
| **3 — Prose** | Specs, playbooks, CLAUDE.md files | Everyone, silently | Explaining rules and specifying future checks |

Every rule gets pushed to the lowest layer that can hold it. A rule at layer 2–3 is a
check waiting to be built.

## The pipeline — how one piece of work flows

Each step leaves a file behind. CI refuses the next step until the previous file
exists and is intact. Skip a step → red merge button. This works the same for every
AI tool and for me.

| Step | Who | Leaves behind | Why the next gate needs it |
|---|---|---|---|
| 1. Define | Me | `specs/<feature>.md` | — |
| 2. Contract | Me + agent | `contracts.md` section (+ threat notes for risky changes) | The critic needs something concrete to attack |
| 3. Critique | An independent agent | `specs/<feature>.critique.md` | Finds the questions the contract forgot to answer — *before* four models answer them four different ways. Prevents: "the spec was silent, so the model guessed, and guessed wrong." |
| 4. Acceptance tests | A **different AI than the coder** | `test/acceptance/` + a hash manifest | Defines "done" independently. Prevents: green tests that never test the bug. |
| 5. Code | The routed coder | `src/` changes | The freeze-hash check stops it from touching the tests. Prevents: quietly weakening a test to pass it. |
| 6. Review | A different model family | Review marker on the exact commit | Hunts what's *missing*, not just what's wrong. Prevents: "the code is right but the guard was never written." |
| 7. Merge | GitHub | — | Only path in. All checks green + review present. |

Key mechanics, plainly:
- **Compact contract surface:** new or changed contracts give normative promises
  stable invariant IDs and mark supporting rationale as non-normative. The routing
  record names tier, reason, required evidence, and acceptance-criteria version.
  **Enforcement: PROMPT + AUDIT, not HARD.** This keeps the binding surface reviewable
  without deleting the reasoning behind it.
- **Freeze:** the test author commits a list of file hashes. CI recomputes them on
  every PR. Any edited test → red. The coder can *activate* finished test phases via
  a separate small file — it can never change test content.
- **Mixed-diff rule:** one PR can't change both the code and the acceptance tests —
  unless the contract changed too, which I review. Prevents one author from playing
  both sides.
- **Never weaken a safety check to make a test pass.** If a test and a fail-closed
  rule disagree, the rule wins and the acceptance criteria are corrected through the
  replacement path below.

### Correcting frozen acceptance criteria

Frozen means an implementation cannot silently rewrite its judge; it does not make a
mistaken criterion permanent. When a criterion is wrong:

1. Stop implementation and record why the current criteria are wrong.
2. Increment the contract's acceptance-criteria version and identify the version it
   supersedes plus the affected invariant IDs.
3. Re-run critique for those invariants.
4. A test author independent from the implementer changes the contract, affected
   acceptance tests, and manifest in a contract+acceptance-only PR.
5. Merge that reviewed PR before implementation resumes against the new version.

The acceptance-criteria version is a domain label, not the manifest schema version.
`process-guard` HARD-enforces only that frozen bytes change through a configured
contract-path change and that the new manifest is self-consistent. The correction
reason, semantic version link, affected invariants, independent authorship, and review
are **PROMPT + AUDIT** checks; the current contract unlock remains coarse.

## Project tiers — not every repo needs the full treatment

The tier depends on **what the repo can leak or break** — never on how many users it
has. My two-person internal app does auth and holds personal data, so it gets real
gates. A throwaway experiment doesn't.

| Tier | What it is | What it must have |
|---|---|---|
| **S** | Public, published, or security products | Everything in `BASELINE.md` |
| **I** | Internal, but holds real data, credentials, or logins | CI that gates, a one-page threat model, frozen acceptance tests at trust boundaries, secret-history scan |
| **X** | Experiments and scratch | Secrets hygiene only |

A repo's tier is one declared line. If a repo gains logins, real data, or gets
published, the audit flags it for promotion. Prevents: "the internal tool quietly
became a product but kept experiment-level process."

## Review rules

- Reviewers get the contract's promises and the threat notes **up front**. Prevents
  the failure I hit twice: reviewers find wrong code but never missing code, because
  nobody told them what was promised.
- Review lenses run in parallel (security / promises-vs-code / wiring), then one fix
  pass. Prevents ten slow rounds of one-finding-at-a-time.
- Merge needs the reviewer's marker on the exact final commit — never "no complaints
  after a while." Prevents merging before a late finding lands.
- More than 3 review rounds on one PR = the spec or tests were weak. That gets written
  into `LESSONS.md` instead of endured.
- Every defect a review catches becomes a permanent test, and every similar code path
  gets checked for the same bug before the finding is closed. Prevents: "fixed here,
  forgotten there."

## Accepted risks — named, not hidden

Honesty rule: risks I choose to keep are written down, so they're decisions instead
of surprises.

- **Solo workstation deploys.** Some infra deploys run from my machine without a CI
  gate. Accepted for now: I'm the only operator, and the deploy scripts are
  evidence-gated (they wait and verify before reporting success). Revisit if anyone
  else ever deploys.
- **"Different AI wrote the tests" is checkable but forgeable.** Git identities can
  be faked — by me. Accepted: the system's job is to stop agents and mistakes, not a
  self-sabotaging owner. The monthly audit watches it.
- **"Prompts come from the templates" can't be machine-enforced.** It's the one habit
  that stays on me. The audit reads merged history to catch drift after the fact.
- **The freeze-gate is global, not per-feature.** `process-guard`'s stage-artifact
  check confirms a frozen acceptance suite exists on the base branch before code lands;
  it does not verify that every feature has its own coverage. That gap is named in the
  guard's own pass message and reviewed by the monthly audit — it is not mechanized in
  CI, and it is not what the review-burn routine (R-2) measures.

## The evolution loop

1. A bug or near-miss happens anywhere → a five-line entry in `LESSONS.md`.
2. The entry becomes a new or updated check (or a new question in the critic's
   checklist).
3. The check ships in `process-guard`, and one version bump spreads it to every repo.
4. A monthly audit compares each repo against `BASELINE.md` and reports gaps as a
   short table. Findings go back to step 1.

Nothing in this loop depends on my memory. That's the design goal: the process should
survive me being tired, busy, or five months smarter than my own docs.
