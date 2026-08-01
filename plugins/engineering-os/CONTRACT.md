# Plugin contract — engineering-os `/pipeline`

Status: v2.1 · solo, language-neutral workflow

## Purpose

The plugin makes the normal Engineering OS path easy to run. It is prompt-layer
orchestration, not enforcement. Repository CI and GitHub branch protection remain the
merge wall.

## Requirements

- **R1 — Self-contained.** The plugin ships the four canonical prompt templates. CI
  checks byte parity with the repository originals. No stale source commit header is
  used as proof.
- **R2 — One bounded slice.** The driver records one changed rule, affected paths,
  exclusions, tier, repository verify command, and real entrypoint before dispatch.
- **R3 — One normal seat per role.** The normal path uses one critic, one implementer,
  and one reviewer. There is no reviewer panel or competing implementation mode.
- **R4 — Optional challenger.** The acceptance challenger runs only when the routing
  record explicitly requires it. It returns three to seven hostile cases and never
  creates a frozen suite.
- **R5 — Language-neutral.** The driver runs the repository's declared verify command.
  It never guesses a language, package manager, source root, or test layout. The
  command includes a language-appropriate linter or static analyzer.
- **R6 — Remote evidence.** Implementation verification runs against the pushed remote
  branch in a temporary worktree, not an agent's discarded worktree or claim. Its
  result is attached to the pull request and never committed onto the branch it
  attests to.
- **R7 — Exact-head review.** The reviewer receives and returns the full head SHA. A
  mismatch or later push makes the result stale.
- **R8 — Bounded review.** P1 and P2 findings block. Fixes happen in one batch. The
  third substantive review round stops with `process-stop`; round four does not run.
- **R9 — Honest status.** `/pipeline <feature> status` is read-only. Missing artifacts,
  commands, reviewers, or verification fail closed with a plain reason.
- **R10 — Solo owner.** The plugin stops for owner product decisions and final merge.
  It does not require or fabricate approval from another human.
- **R11 — Plain English.** Status, blockers, artifacts, and prompts use plain English;
  exact code names and commands stay exact.
- **R12 — Maintainable project map.** A governed repository has root `BRIEF.md`. The
  driver checks it changed with architecture, module, or run/test command changes and
  rejects line-target compression or mechanical file splits.

## Artifacts

| Stage | Artifact |
|---|---|
| Contract | `specs/<feature>.md` |
| Critique | `specs/<feature>.critique.md` ending in `READY` |
| Optional challenge | `specs/<feature>.challenge.md` ending in `READY` |
| Implementation | pushed feature branch and pull request |
| Verification | Pull-request evidence containing `VERIFIED_SHA: <full SHA>` |
| Review | Pull-request review or comment containing `REVIEWED_SHA: <full SHA>` |

## Out of scope

- Enforcing branch protection or CI settings.
- Pretending prompt instructions are hard gates.
- Running a frozen acceptance workflow by default.
- Cross-harness identity proof.
- A central language configuration parser.
- Merging without the owner.
