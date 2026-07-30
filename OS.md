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

**2. The agent runner never approves itself.**
The tool running AI agents cannot also be the final judge. My first setup kept
approvals and evidence inside the same program that ran the agents, and both went
wrong. Final checks live outside it: in GitHub, CI, and deployment checks that the
agent cannot edit while it works.

**3. Every gate checks its own inputs.**
A gate that runs against the wrong inputs looks green and proves nothing. Real case:
my three SDKs each verify against a shared test-fixture set, pinned by version — and
the pins silently drifted apart. All three were "passing parity" against different
fixtures. So every verifier must also check: am I running the right corpus, at the
right version, at full breadth? A green check that didn't verify its inputs is a lie
with extra steps.

## Where a rule can live

| Place | What it means | Who can ignore it | Best use |
|---|---|---|---|
| **GitHub** | Branch protection, required checks, required review | Nobody who follows the merge rules | The final block |
| **Repository** | CI jobs, tests, lints, guard scripts | Someone must visibly edit the repository | Most repeatable checks |
| **Task prompt** | Instructions given to an agent for one task | The agent can miss or ignore them | Guidance |
| **Written docs** | Rules, plans, and agent context files | Anyone can forget them | Explanation and future checks |

Put each important rule in the strongest place that can check it. A rule that exists
only in a prompt or document is guidance, not a guarantee.

## The pipeline — how one piece of work flows

Each step leaves something that can be checked. `process-guard` requires a saved list
of protected test hashes, verifies those hashes, and rejects a pull request that
quietly changes protected tests together with code. Other scripts and the monthly
review check that the files belong to this change and were created in order. CI does
**not** currently prove that every feature has its own acceptance tests.

| Step | Who | Leaves behind | Why the next gate needs it |
|---|---|---|---|
| 1. Define | Me | `specs/<feature>.md` | — |
| 2. Contract | Me + agent | `contracts.md` section (+ threat notes for risky changes) | The critic needs something concrete to attack |
| 3. Critique | An independent agent | `specs/<feature>.critique.md` | Finds the questions the contract forgot to answer — *before* four models answer them four different ways. Prevents: "the spec was silent, so the model guessed, and guessed wrong." |
| 4. Acceptance tests | A **different AI than the coder** | `test/acceptance/` + a hash manifest | Defines "done" independently. Prevents: green tests that never test the bug. |
| 5. Code | The routed coder | `src/` changes | The freeze-hash check stops it from touching the tests. Prevents: quietly weakening a test to pass it. |
| 6. Review | A different model family | Review marker on the exact commit | Hunts what's *missing*, not just what's wrong. Prevents: "the code is right but the guard was never written." |
| 7. Merge | GitHub | — | Only path in. All checks green + review present. |

Important details:

- **Keep firm rules easy to find.** Give each required behavior a stable ID and keep
  background explanation clearly separate. Record the route, reason, required
  evidence, and version of the acceptance criteria. Prompts and later review check
  this today; CI does not.
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
2. Increment the contract's acceptance-criteria version and identify the old version
   and the rule IDs that changed.
3. Review those rules again.
4. The contract owner commits the versioned contract correction on a correction
   branch. A test author independent from the implementer then changes only the
   affected acceptance tests and manifest on that branch.
5. Merge the reviewed contract+acceptance PR before implementation resumes against
   the new version.

The acceptance-criteria version describes expected product behavior; it is not the
file-format version of the hash list. `process-guard` checks only that a configured
contract file changed, the protected tests match the new hashes, and the new list is
valid. Prompts and later review—not CI—currently check the reason, old and new
versions, affected rule IDs, separate authorship, and approval. The permission signal
is therefore broader than it should be.

## Project tiers — not every repo needs the full treatment

The tier depends on **what the repo can leak or break** — never on how many users it
has. My two-person internal app does auth and holds personal data, so it gets real
gates. A throwaway experiment doesn't.

| Tier | What it is | What it must have |
|---|---|---|
| **S** | Public, published, or security products | Everything in `BASELINE.md` |
| **I** | Internal, but holds real data, credentials, or logins | required CI, a one-page threat review, frozen acceptance tests for security and sensitive-data decisions, secret-history scan |
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
  gate. Accepted for now: I'm the only person deploying, and the deploy scripts are
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
3. The reusable check ships in `process-guard`; each repository can then update to it.
4. A monthly audit compares each repo against `BASELINE.md` and reports gaps as a
   short table. Findings go back to step 1.

Nothing in this loop depends on my memory. That's the design goal: the process should
survive me being tired, busy, or five months smarter than my own docs.
