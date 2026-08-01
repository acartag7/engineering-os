# Engineering OS Brief

## What it is

Engineering OS is a configurable set of delivery rules for one owner or a team. Its
skill makes the process discoverable while onboarding a repository or starting work.
It prevents unclear work, false-green checks, unsafe migration, and stale review
evidence from reaching `main`. Each project keeps its own tools and one command that
proves the real project still works.

## Why it exists

Different projects had learned useful safety practices, but the lessons stayed inside
each repository. The first shared process then grew too specific and too costly to run.
This repository keeps the useful checks while making the normal path small,
language-neutral, and realistic for a solo developer.

## How it works

The `engineering-os` skill inspects the repository, asks unresolved questions, and
recommends a basic, standard, or strict workflow. T2 and T3 use strict: a fresh critic,
an independent test author before code, one implementation, real verification, and a
fresh exact-head reviewer. The included validator checks `engineering-os.json`. CI
runs `scripts/verify`, including policy tests, skill tests, optional guard tests,
prompt copies, and the real Go example. The owner still decides whether to merge.

## The map

| Directory or file | What lives there |
|---|---|
| `OS.md` | Source of truth for how one change reaches `main` |
| `POLICY.md` | Risk routes and the checks each route needs |
| `BASELINE.md` | Auditable rules learned from incidents or proven practice |
| `LESSONS.md` | Class-level record of failures and the checks they created |
| `ONBOARDING.md` | Language-neutral setup, including a real Go example |
| `skills/engineering-os/` | Canonical guided skill, references, starter config, and validator |
| `prompts/` | Versioned critic, implementer, independent test author, and reviewer instructions |
| `templates/` | Files copied into governed repositories |
| `plugins/engineering-os/` | Optional installed helper for running the workflow |
| `process-guard/` | Optional hash guard for repositories that freeze contract tests |
| `test/` | Policy tests, guard tests, and the Go fixture |
| `scripts/verify` | One local and CI command for this repository |

## Sharp edges

- The exact-head review, review-round limit, and work-in-progress limit are not yet
  enforced by one fleet-wide GitHub check.
- `process-guard` has a documented broad contract-change path. It is optional and is
  not part of normal onboarding.
- Some older baseline checks are hard in only part of the project fleet. The monthly
  audit reports that difference instead of calling the whole fleet green.

## How to run and test it

```text
./scripts/verify
cd test/fixtures/go-project && ./scripts/verify
```

The first command ends after the policy tests, all guard tests, and the Go fixture are
green. The second command prints `engineering-os-go-fixture` after Go formatting,
code inspection, tests, and build succeed.

## State and next milestone

- Current phase: configurable, language-neutral workflow under exact-head review
- Frozen parts: `test/acceptance/process-guard/` when the optional guard is changed
- Next milestone: merge the guided skill, then onboard the blocked Go project
