# Configuration and workflow

Read this for onboarding, explanation, configuration changes, migration, starting or
continuing a change, or status.

## Profiles

Solo ownership permits one or two active pull requests. A team permits one through
nine.

| Profile | What it enables | What it costs |
|---|---|---|
| `basic` | One implementation, real verification, owner or CI review for T0, and owner review for a closed low-risk T1 change. | Least ceremony; fewer fresh judgments. |
| `standard` | A closed contract, fresh critic, one implementation, real verification, and a fresh final reviewer. | Two fresh review sessions or people. Recommended normal solo default. |
| `strict` | Standard plus an independent test author before implementation. | One more handoff and a required failing-test proof. Required for T2 and T3. |

T0 may use basic. T1 uses the configured default. T2 and T3 always use strict.
Every Docs route uses at least standard. Configuration can raise or increase
protection; it can never lower or reduce this floor.

Verification and final review record the full current commit SHA. A later push makes
that evidence stale.

Strict work requires the independent test author to write small behavior tests before
implementation and prove they are failing. Record the pre-implementation commit,
exact command, and failing output. The implementer may add tests but cannot weaken the
independent ones without a contract amendment.

For a lower route, `independentTests` has these exact effects:

- `security-only` requires an independent test author for a security or trust
  boundary;
- `security-and-bug-fixes` also requires one for every bug fix;
- `all-behavior-changes` requires one for every behavior change.

Configured coverage can add the role but never remove a route requirement. At start,
derive the result from the effective route, bug answer, and risk answers. Record both
the result and reason in the routing record, then validate the real provider instance.

## Providers

Allowed provider labels are:

- `owner`
- `human-teammate`
- `fresh-ai-session`
- `multi-agent-seat`
- `current-session`
- `ci`
- `not-required`

The implementer cannot be CI or not required. A reviewer can never be not required.
Standard and strict critics and reviewers cannot be the current implementation
session or CI; their critics also cannot be not required. A strict test author has
the same restriction. The final reviewer uses a different provider instance
from the critic, independent test author, and implementer. Record the actual
person, fresh AI session, seat, or CI run in each change's routing record.

When multi-agent seats do not exist, use a fresh AI session or a named human. Prepare
one handoff with the closed contract, exact files, commands, current commit, and
required output. A handoff is complete only when its written result exists in a
repository artifact or pull-request record.

For a solo strict change with one AI session at a time, use this sequence:

1. the owner and current session close the contract;
2. a fresh critic session reports missing decisions without implementing;
3. the owner updates the contract until the critique is ready;
4. a different fresh test-author session writes the small behavior tests and records
   the pre-implementation SHA, exact failing command, and expected failure;
5. one implementer session writes the implementation and normal tests without
   weakening the independent tests;
6. repository verification records the current SHA and real output;
7. a different fresh reviewer session reviews the full diff at that exact SHA.

These roles run one after another; they do not need to run at the same time. Reopening
the implementer chat under a reviewer label is self-review, not independence.

P1 and P2 findings block. Before the configured final round, return all findings for
one fix pass, then verify and review the new head. Use `process-stop` only when a P1 or
P2 remains at the configured final round.

When the final review passes with only named P3 findings, the owner may approve one
cleanup check. Fix only those findings and their direct siblings, verify the new
exact head, and ask the same reviewer to confirm only those corrections. Any remaining
or new finding ends the check with `process-stop`. A second cleanup check is not
allowed.

## Configuration file

Store accepted project defaults in root `engineering-os.json`. Start from
`assets/engineering-os.json`, then replace every example value with discovered facts
and owner decisions.

Top-level fields are exactly `version`, `project`, `commands`, `workflow`, `optional`,
`decisions`, and `exceptions`. Version is the number `1`.

Project values:

- `tier`: `S`, `I`, or `X`;
- `defaultBranch`: the real default branch;
- `languages`: one to sixteen discovered languages;
- `ownership`: `solo` or `team`.

Command values:

- `verify`: one repository-owned command that runs at least the tests;
- `entrypoint`: the shipped command or closest public API integration test;
- `entrypointReason`: why this is real user-facing proof.

Refuse a verify command that runs no checks. When no tests exist, say so, propose the
smallest real test, and record any owner decision to onboard with that named gap. For
a pure library, use a public API integration test as the real entrypoint and explain
the reason.

Workflow values:

- `defaultProfile`: `basic`, `standard`, or `strict`;
- four provider fields: `critic`, `testAuthor`, `implementer`, and `reviewer`;
- `independentTests`: `security-only`, `security-and-bug-fixes`, or
  `all-behavior-changes`;
- `maxReviewRounds`: integer one through three;
- `maxActivePullRequests`: one or two for solo ownership, or one through nine for a
  team.

The optional `processGuard` Boolean stays false unless named behavior tests need hash
protection. Process guard is optional. It adds maintenance cost and makes broad
contract changes require an explicit amendment.

Each `decisions.notApplicable` item contains only `group` and `reason`. Allowed groups
are mode, project, commands, risk, team, workflow, platform, brief, migration, change,
and confirmation. Use this only for project-level decisions; a change records its own
skips in its routing record.

Each exception contains only `rule`, `reason`, `owner`, `created`, `reviewBy`, and
`removalCondition`. Dates are real `YYYY-MM-DD` dates. The review date cannot be before
creation or in the past. Exceptions cannot target protected safety rules. Read the
canonical contract before proposing one.

### Exception effect

An exception is active only when its entry is present and the complete
`engineering-os.json` is valid when a mode reads it. An active exception waives the
whole obligation of only the named non-protected rule for this project through
`reviewBy`. Its reason explains the waiver; it never defines a replacement rule.

An exception never changes a protected rule, route floor, provider eligibility,
validator behavior, or protected evidence order. When a protected rule independently
requires the same behavior, that protected obligation remains in force. An exception
also cannot waive the rule that onboarding never claims a GitHub setting changed
without separate authorization and verification. Applying an exception is never
silent: every visible output names its `rule`, `reason`, and `reviewBy`. An expired
exception keeps the complete configuration invalid. Renew an exception only through
a configuration change with a new reason and date.

Each mode applies this same meaning:

- Onboarding collects requested exceptions in the complete confirmed preview; they
  become active only after the owner confirms and the resulting configuration is
  valid.
- Explanation mode names each active exception and describes the whole-rule waiver.
- Configuration mode adds, renews, or removes an exception only through a validated
  complete preview and owner confirmation.
- Migration names active exceptions while protected migration rules remain in force.
- Start mode records every applied active exception in the routing record.
- Continue mode names every applied active exception in prepared handoffs.
- Status mode lists all six fields for every active exception: `rule`, `reason`,
  `owner`, `created`, `reviewBy`, and `removalCondition`.

## Validation

Before the first write, validate the complete candidate through standard input:

```text
node <skill>/scripts/validate_config.mjs --stdin
```

Send the proposed JSON bytes to that process without creating a temporary config file.
This checks UTF-8, JSON, fields, types, bounds, dates, exceptions, and providers. It
does not inspect or create a filesystem path.

After writing the confirmed file, validate the real path from the repository root:

```text
node <skill>/scripts/validate_config.mjs engineering-os.json
```

The validator is read-only. It checks path boundaries, symlinks, file size, UTF-8,
JSON shape, unsafe keys, exact fields, types, bounds, dates, exceptions, and provider
rules. A valid result prints `engineering-os config: valid`. An invalid result prints
one fixed reason code without a path or supplied value.

The file size is checked before content is read and checked again afterward. A local
process that can rename repository directories at the same moment could still race
the parent-directory checks. Run validation in a workspace whose parent directories
are not writable by untrusted local processes.

Configuration validation is hard only when required CI runs this command. Without
Node, perform the same review by inference, report `deterministic validator did not
run`, and keep onboarding incomplete until required CI runs it.

## Onboarding output

A complete preview proposes:

- validated `engineering-os.json`;
- a real `BRIEF.md`;
- `AGENTS.md` for Codex and `CLAUDE.md` for Claude Code when those hosts are used;
- one repository-owned verify command;
- CI that runs verify and configuration validation;
- branch protection that requires those checks;
- exact proof still missing.

The skill does not change GitHub settings by itself. It does not install dependencies.
It does not turn process guard on by default.

## Changing configuration

Before changing a setting, show:

- old value and proposed new value;
- work added or removed;
- protection added or removed;
- cost change;
- every route affected;
- files and checks that change;
- what remains unchanged.

Recompute the effective workflow for the current change. A lower default never lowers
the current route. Validate the complete candidate file, show the complete preview,
then ask for confirmation.
