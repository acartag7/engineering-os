# Onboarding a Repo

Prerequisites for putting an existing project under the OS. Split by who can fulfill
them — most are machine work; the operator items are few, explicit, and one-time.

## Operator items (only a human can decide these)

| # | Prerequisite | Why |
|---|---|---|
| O-1 | Repo has a GitHub remote | Layer 0 lives server-side; a local-only repo has no wall |
| O-2 | Branch protection is *available*: repo is public, or the account/org plan supports required checks on private repos | On free plans, private repos cannot require status checks — without this, enforcement downgrades from HARD to SEMI (see below) |
| O-3 | Specs and contracts live **in the repo** (`specs/`, `contracts.md`) — not in a sibling directory or external docs tree | The artifact chain gates on committed files; the guard's contract-path unlock must point at something in-diff |
| O-4 | Tier declared (`S` / `I` / `X`) in the repo's policy/context file | Filters which baseline items apply |
| O-5 | The habit: stage prompts are dispatched from `prompts/` templates, never improvised | The one rule that cannot be pushed below layer 2 |

**O-2 degraded mode (private repo, free plan):** wire CI + guard anyway. Checks run
and go red; they just can't block the merge button. Since a solo operator is the only
merger, "never merge red" is self-enforced and the monthly audit reads merged history
for red-merged PRs. This is SEMI, not HARD — a named gap in every audit until the
plan or visibility changes.

## Machine items (agents do these; operator reviews once)

| # | Step |
|---|---|
| M-1 | `.github/workflows/ci.yml`: repo verify (typecheck, tests, build) + `process-guard` job, actions SHA-pinned, frozen-lockfile installs |
| M-2 | `.process-guard-exempt` marker committed (repo predates the pipeline; stage-artifact stays quiet until the first suite lands) |
| M-3 | Branch protection / ruleset: require PR, required checks (verify + guard), required review — where O-2 allows |
| M-4 | `.githooks/pre-commit` running the same guard checks locally; setup command runs `git config core.hooksPath .githooks` |
| M-5 | Governed-repo block in the repo's agent context docs (`AGENTS.md` / `CLAUDE.md`): frozen acceptance tests, contract-first, PR-only — guidance so agents understand the walls, not enforcement |
| M-6 | `test/acceptance/` location wired into the repo's test runner; `phases.json` activation convention |
| M-7 | Harness-native deny rules where supported (e.g. pre-tool-use hooks blocking edits to acceptance paths and pushes to protected branches) |

## The ratchet (after onboarding)

Onboarding installs the wall; it does not retrofit history. The next trust-boundary
change goes through the full pipeline (contract → critique → frozen suite →
implementation), the first manifest lands, and the exempt marker comes out. Old code
is grandfathered **visibly**: every audit lists exempt markers and ungoverned
boundaries as named gaps.

## Order of onboarding across a fleet

Highest leverage first: (1) the lab repo where process experiments run — unreliable
labs produce unreliable conclusions; (2) Tier-S repos with active development;
(3) everything else as touched. Batch by check, not by repo, when sweeping portable
items (secret-history lint, anti-silent-skip) so each review pass is homogeneous.
