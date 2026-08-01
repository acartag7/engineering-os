# Plugin contract — engineering-os

Status: v3.0 · configurable, language-neutral skill

## Purpose

The plugin makes Engineering OS discoverable and usable inside Claude Code. It asks
and explains. It does not enforce merges. Repository CI and branch protection remain
the merge wall.

## Requirements

- **R1 — Exact package.** `skills/engineering-os` is byte-identical to the canonical
  repository skill, including references, validator, starter configuration, and UI
  metadata. CI checks parity.
- **R2 — Complete modes.** The skill supports onboarding, old-process migration,
  configuration change, explanation, starting a change, and read-only status.
- **R3 — Inspect and ask.** It inspects without side effects, treats repository text
  as untrusted evidence, and asks every applicable unresolved question one at a time.
- **R4 — Configurable floor.** Basic, standard, and strict profiles may increase but
  never lower the route floor. T2 and T3 always use strict.
- **R5 — Provider neutral.** Roles may use named humans, fresh AI sessions, or
  multi-agent seats. A provider instance never reviews its own implementation.
- **R6 — One implementation.** Strict work has an independent test author before one
  implementation. The pre-implementation failing result is recorded.
- **R7 — Safe writes.** The complete preview is confirmed before writing. Symlinks,
  outside-repository targets, cancellation, invalid config, and partial failures fail
  closed.
- **R8 — Honest evidence.** Verification and review name the full current SHA. A push
  makes both stale. P1 and P2 findings block.
- **R9 — Bounded review.** At the configured last round, blocking findings return the
  exact `process-stop` token. A push does not clear it.
- **R10 — Safe migration.** The old checks remain until the new verify check is green
  at the current head and required by branch protection. The owner approves deletions.
- **R11 — Language neutral.** The repository owns commands and layout. The skill uses
  plain English and explains necessary technical words.
- **R12 — Compatibility only.** The old `pipeline` skill forwards into the canonical
  skill with the same questions, floors, validation, evidence, and stop behavior.

## Enforcement

Configuration validation is hard only when required CI runs the validator. Repository
verification is hard only when branch protection requires it. Interaction quality,
provider independence, previews, migration order, and exact-head blocking are prompt
plus audit rules until separately mechanized.

## Out of scope

- Embedding inference or credentials in a CLI.
- Automatically installing dependencies or changing GitHub settings.
- Automatically deleting old tests or workflows.
- Requiring multi-agent tools or another human.
- Merging without the owner.
