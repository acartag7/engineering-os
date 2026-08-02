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
| PC-04 | Every security promise in docs (`fail closed`, never, always, cannot, only) must point to the code and a test that would catch its removal | Docs promising protection the code doesn't deliver — wrong docs ship farther than wrong code | S | SEMI (review grep; CI-able) | [L-005](LESSONS.md#l-005), [L-017](LESSONS.md#l-017) |
| PC-05 | Exact dependency pins, committed lockfile, frozen installs in CI, actions pinned by SHA, new deps must be ≥7 days old (15 for anything that publishes or reaches the network) | A hijacked package version shipping into my build the day it's published | S, I | HARD — inconsistent, standardization pending | ecosystem practice |
| PC-06 | Known gaps are written down in a machine-readable list, not hidden | Shipping with secret known-broken parts; forgetting what we chose to accept | S | AUDIT | [L-007](LESSONS.md#l-007) |
| PC-07 | Decisions at trust boundaries are **allowlists** (name what's permitted), never blocklists (name what's forbidden) | The bug that started all this: a null slipped past a blocklist and became a confirmed fact | S, I | SEMI (critic + review lens) | [L-001](LESSONS.md#l-001), [L-002](LESSONS.md#l-002) |
| PC-08 | A behavior-changing PR has one bounded slice and closes its contract before code when the effective profile or route requires one; line counts never cause compressed code or mechanical splits | Oversized work, open decisions, and code-golf used to satisfy a process number | S, I | PROMPT + AUDIT | [L-001](LESSONS.md#l-001), [L-012](LESSONS.md#l-012), [L-015](LESSONS.md#l-015), [L-016](LESSONS.md#l-016) |
| PC-09 | A bug fix includes a regression test that fails when the fix is removed | A green test that never proves the reported failure | S, I | SEMI (PR evidence; CI-able) | [L-001](LESSONS.md#l-001), [L-015](LESSONS.md#l-015) |
| PC-10 | A profile-selected reviewer checks the full diff and records the exact final commit SHA: basic uses owner review (or CI for T0), while standard and strict use one fresh reviewer | Self-review and stale review evidence being treated as approval | S, I | PROMPT + AUDIT; HARD where wired | [L-001](LESSONS.md#l-001), [L-005](LESSONS.md#l-005), [L-015](LESSONS.md#l-015) |
| PC-11 | CI runs one repository-owned verify command covering suitable static checks, tests, build/package, and the real entrypoint | Language assumptions, local-only success, and green units hiding a broken shipped flow | S, I | HARD (platform) | [L-004](LESSONS.md#l-004), [L-015](LESSONS.md#l-015) |
| PC-12 | Each repo declares its tier in one line; gaining logins/real data/publishing flags a promotion | An internal tool quietly becoming a product with experiment-level process | S, I, X | AUDIT | [L-008](LESSONS.md#l-008) |
| PC-13 | Strict T2/T3 work and lower routes whose configured independent-test coverage matches the change require an independent test author before one implementation | Tests being shaped around an implementation, while avoiding competing implementations or mandatory ceremony for low-risk work | S, I | PROMPT + AUDIT | [L-001](LESSONS.md#l-001), [L-015](LESSONS.md#l-015), [L-019](LESSONS.md#l-019) |
| PC-14 | Reviewers get the contract's promises + threat notes up front, in round 1 | Reviews that find wrong code but never missing code | S, I | PROMPT + AUDIT | [L-005](LESSONS.md#l-005) |
| PC-15 | The configured final substantive review round stops the PR until the contract is fixed or the slice is cut smaller; three is the maximum | Grinding through repeated review instead of repairing the input to implementation | S, I | PROMPT + AUDIT; mechanical gate pending | [L-005](LESSONS.md#l-005), [L-012](LESSONS.md#l-012), [L-015](LESSONS.md#l-015) |
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
| PC-32 | The required repository verify command runs a language-appropriate linter or static analyzer | Type checks and security scans leaving ordinary correctness defects entirely to review | S, I | HARD through required `verify`; fleet port pending | [L-017](LESSONS.md#l-017) |
| PC-33 | Every HTTP trust boundary rejects duplicated credential, cookie, API-key, and forwarded-identity headers with a fixed reason code | Different parsers choosing different credential values and changing who the request represents | S, I | HARD per-boundary negative test; fleet port pending | [L-017](LESSONS.md#l-017) |
| PC-34 | Error reason codes use a closed language type rather than a free-form string | A typo silently creating a new reason code that policy, clients, or audit handling do not recognize | S, I | HARD where compiler/type checker supports it; review otherwise | [L-017](LESSONS.md#l-017) |
| PC-35 | Every governed repository has a current root `BRIEF.md` with the real project map and working run/test commands | The solo owner or a new collaborator losing the project's shape between sessions | S, I, X | REVIEW + AUDIT; content gate not built | [L-018](LESSONS.md#l-018) |
| PC-36 | Every governed repository stores validated `engineering-os.json`; unknown fields, unsafe keys, wrong types, invalid providers, and expired exceptions fail closed | Hidden workflow defaults or malformed settings silently removing required work | S, I | HARD when validator runs in required CI | [L-019](LESSONS.md#l-019) |
| PC-37 | Workflow providers are named by real instance; fresh sessions or humans replace unavailable multi-agent seats without fabricating approval | Self-review being relabeled as independent review or teams being unable to adopt the process | S, I | PROMPT + AUDIT | [L-019](LESSONS.md#l-019) |
| PC-38 | Old-process migration keeps old checks until the new verify check is green at the current head and required by branch protection | Cleanup creating a window with no effective merge protection | S, I | PROMPT + PLATFORM EVIDENCE | [L-019](LESSONS.md#l-019) |
| PC-39 | Read every paginated review thread after each push and immediately before readiness; unresolved actionable findings block | Green checks or a separate review hiding unread inline findings | S, I | PROMPT + REVIEW EVIDENCE; mechanical gate pending | [L-020](LESSONS.md#l-020) |

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
