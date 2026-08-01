# Engineering OS Brief

## What it is

Engineering OS is a small set of delivery rules for repositories maintained by one
owner. It prevents unclear work, false-green checks, and stale review evidence from
reaching `main`. Each project keeps its own tools and exposes one command that proves
the real project still works.

## Why it exists

Different projects had learned useful safety practices, but the lessons stayed inside
each repository. The first shared process then grew too specific and too costly to run.
This repository keeps the useful checks while making the normal path small,
language-neutral, and realistic for a solo developer.

## How it works

An owner starts with one bounded change and records its route in `POLICY.md` terms. A
fresh critic uses `prompts/critique.md` to find missing decisions before code. The
implementer uses the repository's own verification command. CI runs `scripts/verify`,
which checks this repository's policy tests, optional guard tests, prompt copies, and
the real Go onboarding example. One fresh reviewer uses `prompts/reviewer.md` and
records the exact commit SHA on the pull request before the owner merges.

## The map

| Directory or file | What lives there |
|---|---|
| `OS.md` | Source of truth for how one change reaches `main` |
| `POLICY.md` | Risk routes and the checks each route needs |
| `BASELINE.md` | Auditable rules learned from incidents or proven practice |
| `LESSONS.md` | Class-level record of failures and the checks they created |
| `ONBOARDING.md` | Language-neutral setup, including a real Go example |
| `prompts/` | Versioned critic, implementer, challenger, and reviewer instructions |
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

- Current phase: solo, language-neutral workflow ready for first governed Go project
- Frozen parts: `test/acceptance/process-guard/` when the optional guard is changed
- Next milestone: onboard the Go project and require its repository-owned `verify` job
