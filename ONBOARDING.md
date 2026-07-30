# Onboarding a Repo

What an existing repository needs before using Engineering OS. Most setup can be
automated; a person must make a few choices once.

## Decisions a person must make

| # | Prerequisite | Why |
|---|---|---|
| O-1 | Repo has a GitHub remote | Layer 0 lives server-side; a local-only repo has no wall |
| O-2 | Branch protection is available: the repo is public, or its account plan supports required checks on private repos | Without required checks, GitHub cannot block a failing merge |
| O-3 | Written rules live **in the repo** (`specs/`, `contracts.md`) rather than elsewhere | The guard can check only committed files and must see a rule change before protected tests can be updated |
| O-4 | Tier declared (`S` / `I` / `X`) in the repo's policy/context file | Filters which baseline items apply |
| O-5 | The habit: stage prompts are dispatched from `prompts/` templates, never improvised | The one rule that cannot be pushed below layer 2 |

**If private-repository branch protection is unavailable:** add CI and the guard
anyway. Failing checks will be visible but cannot block the merge button. “Never merge
red” then depends on the person merging. Record that weakness in every monthly review
until the plan or repository visibility changes.

## Setup that can be automated

| # | Step |
|---|---|
| M-1 | `.github/workflows/ci.yml`: repo verify (typecheck, tests, build) + `process-guard` job, actions SHA-pinned, frozen-lockfile installs |
| M-2 | `.process-guard-exempt` marker committed with lifecycle metadata (repo predates the pipeline; stage-artifact stays quiet until the first suite lands) |
| M-3 | Branch protection / ruleset: require PR, required checks (verify + guard), required review — where O-2 allows |
| M-4 | `.githooks/pre-commit` running the same guard checks locally; setup command runs `git config core.hooksPath .githooks` |
| M-5 | Governed-repo block in the repo's agent context docs (`AGENTS.md` / `CLAUDE.md`): frozen acceptance tests, contract-first, PR-only — guidance so agents understand the walls, not enforcement |
| M-6 | `test/acceptance/` location wired into the repo's test runner; `phases.json` activation convention |
| M-7 | Harness-native deny rules where supported (e.g. pre-tool-use hooks blocking edits to acceptance paths and pushes to protected branches) |

The marker is machine-readable YAML:

```yaml
owner: <accountable owner>
reason: <why the first suite cannot land yet>
created: <YYYY-MM-DD>
review_by: <YYYY-MM-DD>
removal_condition: <observable condition that removes the marker>
```

`process-guard` checks only that the marker exists on the base tree; that presence
check is Layer 1. Field completeness, review dates, and removal conditions are
**AUDIT-enforced** by R-1. An empty legacy marker remains an explicit audit gap rather
than being silently treated as compliant.

## After onboarding

Onboarding does not rewrite history. The next security or sensitive-data change goes
through the full process (written rules → review of those rules → frozen tests →
implementation), the first manifest lands, and the exempt marker comes out. Old code
is grandfathered **visibly**: every audit lists exempt markers and ungoverned
boundaries as named gaps.

## Order of onboarding across a fleet

Highest leverage first: (1) the lab repo where process experiments run — unreliable
labs produce unreliable conclusions; (2) Tier-S repos with active development;
(3) everything else as touched. Batch by check, not by repo, when sweeping portable
items (secret-history lint, anti-silent-skip) so each review pass is homogeneous.
