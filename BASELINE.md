# Process Conformance Baseline

The checklist every repo is audited against, filtered by its tier (`S | I | X` — see
[`OS.md`](OS.md)). Every item says **what it prevents** — if I can't name the failure
an item stops, the item doesn't belong here. The Origin column says where it came
from: a real incident ([`LESSONS.md`](LESSONS.md)) or a practice already proven in one
of my repos.

Audit results live with each repo, not in this file.

| ID | Rule | What it prevents | Tier | Enforced | Origin |
|---|---|---|---|---|---|
| PC-01 | CI scans the **full git history** for secrets, using planted-secret test cases | A key that was committed once and "fixed" is still in history for anyone who clones | S, I | HARD in 1 repo — port pending | [L-003](LESSONS.md#l-003) |
| PC-02 | Test suites that need an environment (DB, browser) must **prove they ran**; missing env = red, never skip | "All green" when the important tests silently didn't run | S, I | HARD in 3 repos — port pending | [L-006](LESSONS.md#l-006) |
| PC-03 | A threat model exists: what we protect, where attacks come in, which test covers each defense, what risks we accept. One page is fine for Tier I | Security that lives in someone's head; new attack classes nobody wrote down | S, I | AUDIT | [L-001](LESSONS.md#l-001), [L-005](LESSONS.md#l-005) |
| PC-04 | Every promise word in user-facing docs (never/always/cannot/only) must point to the code that enforces it and a test that would catch its removal | Docs promising protection the code doesn't deliver — wrong docs ship farther than wrong code | S | SEMI (review grep; CI-able) | [L-005](LESSONS.md#l-005) |
| PC-05 | Exact dependency pins, committed lockfile, frozen installs in CI, actions pinned by SHA, new deps must be ≥7 days old (15 for anything that publishes or reaches the network) | A hijacked package version shipping into my build the day it's published | S, I | HARD — inconsistent, standardization pending | ecosystem practice |
| PC-06 | Known gaps are written down in a machine-readable list, not hidden | Shipping with secret known-broken parts; forgetting what we chose to accept | S | AUDIT | [L-007](LESSONS.md#l-007) |
| PC-07 | Security and sensitive-data decisions use **allowlists** (name what is permitted), never blocklists (name what is forbidden) | The bug that started all this: a null slipped past a blocklist and became a confirmed fact | S, I | SEMI (critic + review lens) | [L-001](LESSONS.md#l-001), [L-002](LESSONS.md#l-002) |
| PC-08 | A PR that changes code requires the frozen acceptance tests to already exist | Code written before anyone defined "done" independently | S, I | HARD (process-guard) | [L-001](LESSONS.md#l-001) |
| PC-09 | Acceptance test files are hash-frozen; any edit turns CI red | The coder weakening or deleting the test that would catch its bug | S, I | HARD (process-guard) | [L-001](LESSONS.md#l-001) |
| PC-10 | One PR can't change both the code and the acceptance tests, unless the contract changed too | One author quietly playing both sides | S, I | HARD (process-guard) | [L-001](LESSONS.md#l-001) |
| PC-11 | CI exists in the repo and runs the full verify (types, tests, build) on every PR | "It worked on my machine" as the only quality gate | S, I | HARD (platform) | [L-004](LESSONS.md#l-004) |
| PC-12 | Each repo declares its tier in one line; gaining logins/real data/publishing flags a promotion | An internal tool quietly becoming a product with experiment-level process | S, I, X | AUDIT | [L-008](LESSONS.md#l-008) |
| PC-13 | The committer on acceptance tests differs from the committer on code | Same-author tests pretending to be independent | S, I | SEMI — forgeable by owner, audited | [L-001](LESSONS.md#l-001) |
| PC-14 | Reviewers get the contract's promises + threat notes up front, in round 1 | Reviews that find wrong code but never missing code | S, I | PROMPT + AUDIT | [L-005](LESSONS.md#l-005) |
| PC-15 | More than 3 review rounds on one PR is recorded as a process failure | Grinding through 16 rounds instead of fixing the stage that produced weak code | S, I | AUDIT | [L-005](LESSONS.md#l-005) |
| PC-16 | The real end-to-end flow (real entry point, real stores, real client) runs in CI before anything is called done | Perfect units, broken product — wiring bugs are invisible to unit tests | S, I | HARD where suites exist | [L-004](LESSONS.md#l-004) |
| PC-17 | Generative (property/fuzz) tests at parser and encoding boundaries | The input shape nobody hand-wrote a test for | S | NOT YET ENFORCED — backlog | [L-002](LESSONS.md#l-002) |
| PC-18 | Mutation testing as a periodic report (never a CI gate): break the code on purpose, see if tests notice | Test suites that look thorough but assert nothing | S | NOT YET ENFORCED — backlog | [L-001](LESSONS.md#l-001) |
| PC-19 | Docs describe only what exists; designs are labeled as designs | Docs describing a test harness that was never built (happened in my best repo) | S, I | AUDIT | [L-007](LESSONS.md#l-007) |
| PC-20 | The agent-dispatching system holds no enforcement; it obeys the same walls | The factory approving its own work with corrupted records (happened) | S | DESIGN RULE + AUDIT | [L-009](LESSONS.md#l-009) |
| PC-21 | Gates verify their own inputs: shared fixture sets pinned from ONE source, bumped everywhere at once; every consumer runs the full set or names what it skips | Three SDKs "passing parity" against different fixture versions (happened) | S | NOT YET ENFORCED — check plannable | [L-010](LESSONS.md#l-010) |
| PC-22 | Production keys and admin credentials live in a secret manager, never in working trees; local dev uses scoped non-prod credentials | One `.gitignore` mistake away from leaking prod | S, I, X | AUDIT | standing hygiene rule |
| PC-23 | AI reviewers read their instructions from the base branch, never from the PR; write-capable CI jobs never check out untrusted code; verdicts come from local files, not posted comments | A malicious PR rewriting its own reviewer's rules or faking a pass | S | HARD where review gates exist | harvest: SDK review workflows |
| PC-24 | Code merges trigger a docs-drift check against a source→docs map | Docs rotting silently until a user follows a stale guide | S | HARD in 1 pipeline — port pending | harvest: docs pipeline |
| PC-25 | Dangerous change classes (destructive migrations, regulated identifiers) are blocked by a lint with an inline, auditable override note | A table-locking migration taking down prod because nobody remembered it was dangerous | S, I | HARD where implemented | harvest: migration-hazard gate |
| PC-26 | CI config itself is linted on every change to it | A broken workflow silently skipping the checks it was supposed to run | S, I | HARD in 2 repos — port pending | harvest: workflow-sanity checks |
| PC-27 | Examples run in CI; release artifacts are built and driven end-to-end before publishing | READMEs that don't work; binaries that crash on `--help` | S | HARD in 2 repos — port pending | harvest: demo + binary smoke |
| PC-28 | Publishing uses short-lived OIDC credentials with provenance; SBOM + signing for Tier S | A stolen long-lived registry token publishing malware as me | S | HARD where publishing exists | harvest: fleet publish workflows |
| PC-29 | Dry-run mode is a deny-all-writes policy layer, not a code path that must remember to be careful | One forgotten `if dry_run` guard doing a real write | S, I | PATTERN — adopt per tool | harvest: replication-agent |
| PC-30 | Every allowlist entry (network, mounts, commands) carries an inline reason | Allowlists that grow forever because nobody remembers why entries exist | S, I | SEMI (review lens) | harvest: scanner sandbox policy |
| PC-31 | Every suppressed warning (ignored CVE, disabled lint) carries a recheck date; expired ones get flagged | Ignores that outlive their excuse — the patch shipped a year ago and we're still ignoring the CVE | S, I | AUDIT | harvest: CVE-ignore rot |

## How enforcement labels read

- **HARD** — a required check. Nobody merges around it, no matter the tool.
- **SEMI** — checked, but the repo owner could fool it, or it's only partly mechanical. The gap is named and audited.
- **AUDIT** — caught by the scheduled audit after the fact. Detected within a month, not prevented.
- **PROMPT** — only enforced through generated prompts. Weakest level; listed so the gap is visible.
- **NOT YET ENFORCED** — declared intent with a backlog entry. Counts as a named gap in every audit.

## Adding an item

Two legitimate origins only: a real incident (`LESSONS.md`) or a practice already
proven in one of my repos (name it). Every item must state what failure it prevents.
No origin, no entry — checklists that grow without pain behind them turn into theater.
