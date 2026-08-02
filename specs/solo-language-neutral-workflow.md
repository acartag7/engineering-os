# Solo, language-neutral workflow

Status: implementation complete; pull-request verification and review pending

Route: T2
Reason: this changes the process used to review security-sensitive work and the CI
contract used when onboarding repositories.
Slice: replace the default freeze-first, TypeScript-shaped workflow with one solo,
language-neutral path, and include the fleet-audit rules required by the next
onboarding. Change the source docs, prompts, plugin, CI proof, Go fixture, and Project
Brief together so they cannot describe different processes.
Affected paths: source-of-truth process docs, baseline and lessons, prompt templates,
plugin copies and driver, CI, policy tests, optional guard documentation, and the Go
fixture.
Dependencies: the Go toolchain declared by the fixture and existing Node.js tooling.
Exclusions: onboarding the external Go repository, changing `process-guard` behavior,
building a fleet-wide GitHub review gate, and rolling `BRIEF.md` into other repositories.
Required evidence: repository tests, a real Go verification run, full-diff review,
and an independent Fable 5 review of the exact final commit.
Evidence links: filled in the pull request before merge.

The diff is larger than the normal warning because the old process was copied across
canonical docs, vendored prompts, and the installed plugin. Splitting the switch would
leave a published source telling users to run both workflows. The branch removes that
drift in one reviewed change; it does not treat the line count as proof of quality.

## Problem

The current process assumes TypeScript-shaped repositories and requires a large
frozen-test workflow. In practice, that made review expensive, depended on manual
coordination, and could report green without proving that the prescribed stages ran.
It also blocks a Go repository whose source and tests do not live under `src/` and
`test/acceptance/`.

## Binding rules

- **SLW-1 — Solo ownership.** One human owner chooses the scope, answers open product
  questions, and merges. GitHub does not require approval from a second human who
  does not exist.
- **SLW-2 — Small slices.** One pull request changes one clear rule that one reviewer
  can understand in one sitting. About 300 changed lines is a warning to re-check the
  cut, not an automatic rejection. Generated files and necessary tests are explained
  rather than blindly counted.
- **SLW-3 — One normal path.** The effective `basic`, `standard`, or `strict` profile
  chooses the normal path. Already-clear basic work may omit the contract and fresh
  critique. Standard and strict work use one contract and one fresh critic before
  code. Every profile uses one implementer that writes code and tests, one real
  verification run, and one final review appropriate to that profile on the exact
  final commit.
- **SLW-4 — One implementation.** Normal work uses one implementation. Competing
  implementations and reviewer panels are reserved for explicit model evaluations,
  not product delivery.
- **SLW-5 — Optional acceptance challenger.** A separate acceptance challenger is
  used only when the owner marks a slice as unusually dangerous. It proposes a small
  set of hostile cases. It does not create a second implementation or a default
  frozen suite. For the configurable skill, CES-11 supersedes this rule: strict T2
  and T3 work always uses an independent test author before implementation.
- **SLW-6 — Language-neutral verification.** Every governed repository exposes one
  repository-owned verification command. CI runs that same command. Engineering OS
  does not assume a package manager, programming language, source directory, test
  directory, or type checker.
- **SLW-7 — Real entrypoint.** Verification runs the thing users actually execute,
  or records why that cannot run in CI. A build or type check alone is not enough.
- **SLW-8 — Regression proof.** A bug fix includes a test that fails when the fix is
  removed. The pull request records that proof. General mutation testing remains a
  periodic report, not a required check for every change.
- **SLW-9 — Exact-head review.** Every profile uses a final reviewer and records the
  full commit SHA. Basic uses owner review, or CI for T0; standard and strict use a
  fresh independent reviewer. Any later push makes the review stale. P1 and P2
  findings block merge.
- **SLW-10 — Stop at the configured round.** The configured final substantive review
  round stops the change; three is the maximum. The owner fixes the contract or cuts
  a smaller slice before review resumes. This stop is prompt and audit enforced until
  a reliable GitHub check exists.
- **SLW-11 — Work in progress.** A solo owner keeps no more than two pull requests in
  active review. This is audit enforced, not a GitHub block.
- **SLW-12 — Plain English.** Project writing uses plain, easy English. Technical
  terms appear only when accuracy needs them and are explained on first use. Exact
  code names and commands remain exact.
- **SLW-13 — Honest optional guard.** `process-guard` remains available for repositories
  that deliberately keep hash-frozen acceptance tests. It is optional and is not the
  default onboarding path. Its broad contract-change escape hatch remains a named
  limitation.
- **SLW-14 — Go proof.** This repository carries a small Go fixture whose repository
  verification command runs formatting, static checks, tests, build, and the real
  command entrypoint.
- **SLW-15 — Static analysis without a language default.** Every required verify
  command runs an appropriate linter or static analyzer. Go can use `go vet`; no rule
  assumes JavaScript or Python tooling.
- **SLW-16 — Practical line guidance.** File length is a review signal. It never
  justifies code compression or mechanical file splits.
- **SLW-17 — Small frozen amendment.** A repository that opted into frozen contract
  tests may update a small contract, its code, and affected frozen tests in one pull
  request. It still runs hash checks and freezes only externally visible behavior.
- **SLW-18 — Explicit trust rejection.** HTTP boundaries reject duplicate security
  headers with a fixed reason code; reason codes use a closed type; every written
  security guarantee names its enforcing test.
- **SLW-19 — Five-minute project map.** Every governed repository has a root
  `BRIEF.md`. Review and the monthly audit keep its map and commands current.

## Go onboarding contract

A Go repository may use `./scripts/verify` as its stable command. At minimum it runs:

1. `gofmt` checking;
2. `go vet ./...`;
3. `go test ./...`;
4. `go build ./...`;
5. one smoke test through the shipped command, server, or library entrypoint.

The repository may add stronger checks. Engineering OS calls only the repository's
declared command and does not reproduce these steps in a central language switch.

## Out of scope

- A universal parser for repository configuration.
- A hard line-count rejection.
- A fake human approval requirement.
- Replacing language-specific CI tools with Engineering OS tools.
- Claiming the review-round or work-in-progress limits are mechanically enforced
  before those checks exist.
