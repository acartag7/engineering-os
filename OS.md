# The Operating System

This document is the specification of how work flows and where each rule is enforced.
It follows its own rule: anything stated here that is not yet a check is marked
**[not yet enforced]**. There is no third state.

## 1. The four enforcement layers

Every rule lives at exactly one layer. A rule only counts as *enforced* at layers 0–1.

| Layer | Lives in | Who can bypass | Role |
|---|---|---|---|
| **0 — Platform** | GitHub server-side: branch protection, required status checks, required review, CODEOWNERS | Nobody | The wall |
| **1 — Repo** | Checks committed to the repository: CI jobs, test suites, lints, guard scripts | Only via a visible diff, which layer 0 gates | The teeth |
| **2 — Prompt** | Instructions generated per task per agent | Any agent, under pressure | Guidance |
| **3 — Prose** | Specs, playbooks, CLAUDE.md/AGENTS.md | Everyone, silently | Specification of future checks |

**The drain rule:** every rule is pushed to the lowest layer that can hold it. Layers
2–3 are larval stages. A rule sitting at layer 2–3 is a check waiting to be built, and
the gap between its current and target layer is the work backlog.

## 2. The artifact chain

Work flows through stages. Each stage emits a committed artifact. CI on each stage
requires the previous stage's artifact — so skipping a stage makes the next PR
unmergeable. The pipeline enforces its own ordering with zero cooperation from any
agent or harness.

| Stage | Actor | Emits | Gate that demands it |
|---|---|---|---|
| 1. Define | Human | `specs/<feature>.md` | — |
| 2. Contract | Human + agent | `contracts.md §n`, threat rows (T2+) | Critique needs a contract to attack |
| 3. Critique | Independent agent | `specs/<feature>.critique.md` | Acceptance PR fails without it |
| 4. Acceptance suite | **Different author than implementer** | `test/acceptance/<phase>/` + `acceptance.manifest.json` | Implementation PR fails without manifest on base branch |
| 5. Implement | Routed agent | `src/**` PR with `Spec:` trailer | Freeze-hash + mixed-diff + suite-green required checks |
| 6. Review | Different model family + bot | Review marker on head SHA | Branch protection requires it |
| 7. Merge | Platform | The complete evidence chain | — |

Key mechanics:

- **Freeze:** the acceptance author commits a manifest of sha256 hashes over the
  acceptance test files. `process-guard` recomputes on every PR. Any edit → red.
  Activation of pending phases happens through a separate activation file
  (`test/acceptance/phases.json`), which is exempt from the freeze — so the
  implementer can turn tests *on* but never *change* them.
- **Mixed-diff:** a PR touching both `src/**` and `test/acceptance/**` fails, unless
  the same PR also changes the contract (owner-reviewed path). Same-author-writes-both
  becomes structurally impossible within a PR.
- **Contract supremacy:** acceptance tests change only via a contract change. Never
  weaken a fail-closed control to make a test pass; if a test and a fail-closed rule
  conflict, the rule wins and the test changes — with the reasoning documented.
- **Author identity:** the committer on acceptance paths must differ from the
  committer on src paths. **[semi-enforced]** — identity is checkable but forgeable by
  the repo owner; named residual, verified by the monthly audit.

## 3. Project tiers

The baseline is tiered. The tier is determined by **data sensitivity × exposure** —
never by team size or audience. Declared in one machine-readable line per repo
(`tier: S | I | X` in the repo's policy file, mirrored in its agent context doc).

| Tier | Definition | Floor |
|---|---|---|
| **S** | Public, published, or security products | Full baseline — every applicable item in `BASELINE.md` |
| **I** | Internal, but holds real data, credentials, or an auth boundary | CI exists and gates; one-page threat model; acceptance-split at trust boundaries; portable checks (secret-history lint, pinned deps) |
| **X** | Experiments, throwaway | Secrets hygiene + secret-history lint only |

**Promotion triggers** — the audit flags a tier mismatch when a repo gains: an auth
boundary, real personal data, published packages, network egress, or write access to
other systems. Tier changes are a one-line reviewed diff. **[audit-enforced]**

Note: internal "lab" repos where process and model experiments run deserve Tier I even
when the stakes look low — if the lab has no verification floor, the experiments
produce unreliable conclusions, and those conclusions steer everything else.

## 4. The two-plane rule (for orchestrators)

Any system that dispatches agents — a factory, an orchestrator, a workflow engine — is
itself LLM-driven and therefore **must not hold enforcement**.

- **Orchestration plane:** generates stage prompts from the templates in `prompts/`,
  routes seats (which model critiques / authors / implements / reviews), dispatches to
  any harness, watches PRs, drives bounded fix loops, drafts ledger entries.
- **Enforcement plane:** branch protection, `process-guard`, runtime tool gates, and
  the monthly audit. Server-side or repo-resident. Governs the orchestrator's output
  like any other contributor's.

The orchestrator is governed by the same plane it dispatches into. If the enforcement
plane trusts the orchestrator, the design is wrong.

## 5. Review discipline

- Round 1 ships with the contract's claims list, the threat rows, and the invariant
  checklist. Reviewers hunt what is *missing*, not only what is wrong — absences only
  surface in invariant-driven review.
- Lenses run in parallel (security / claims-vs-enforcement / wiring), findings merge,
  one fix pass, one confirmation round — instead of serial discovery.
- Merge requires the reviewer's marker on the **head SHA** — never a silence window.
- **More than 3 review rounds on one PR is a process finding**: the contract or the
  acceptance suite was weak. It goes in `LESSONS.md` instead of being endured.
  **[audit-enforced]**
- Every defect a review catches becomes a permanent regression or conformance test,
  plus a sibling sweep across every parallel code path, plus a ledger entry. A finding
  is not closed until its siblings are confirmed clean.

## 6. The evolution rule

This OS is a versioned artifact and expects to be wrong somewhere.

1. Every failure — bug, near-miss, review finding, audit gap — becomes a `LESSONS.md`
   entry: five lines, class-level, agent-drafted, human-approved.
2. Every entry becomes or updates a `BASELINE.md` item with a check, or an update to a
   prompt template's silence classes.
3. Checks land in `process-guard`, and a version bump propagates them to every repo in
   one batched sweep.
4. A monthly audit reads merged reality — not stated intentions — per repo, and emits a
   conformance scorecard with named gaps. Audit findings feed back into step 1.

Prose in this repo is the specification of those checks. It is never the enforcement.
