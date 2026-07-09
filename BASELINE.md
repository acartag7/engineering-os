# Process Conformance Baseline

Every repo is audited against the items below, filtered by its declared tier
(`S | I | X` — see [`OS.md`](OS.md) §3). Each item exists because a real defect
created it — the `Origin` column links the lesson. An item's `Enforcement` states
where it currently lives; anything not at HARD is explicitly unfinished, not assumed.

Per-repo status matrices are **audit output**, produced by the monthly audit run and
kept with each repo — they are not maintained by hand in this file.

| ID | Check | Tier | Enforcement | Origin |
|---|---|---|---|---|
| PC-01 | Git-history secret lint: planted-secret scan over full history runs in CI | S, I | HARD (CI job) — port pending to all repos | [L-003](LESSONS.md#l-003) |
| PC-02 | Anti-silent-skip: every env-gated suite must prove it ran; missing env hard-fails, never skips green | S, I | HARD (CI assertion) — port pending | [L-006](LESSONS.md#l-006) |
| PC-03 | Threat model exists: assets, trust boundaries, controls→tests mapping, residuals as first-class output. One page suffices for Tier I | S, I | AUDIT (file-shape check plannable) | [L-001](LESSONS.md#l-001), [L-005](LESSONS.md#l-005) |
| PC-04 | Claims-vs-enforcement: every guarantee verb (never/always/cannot/enforced/only) in deployer-facing docs traces to enforcing code or a test. Enforce-or-don't-write | S | SEMI (grep in review; CI-able) | [L-005](LESSONS.md#l-005) |
| PC-05 | Supply chain floor: exact version pins, committed lockfile + frozen installs, SHA-pinned actions, minimum release-age gate (7 days; 15 for anything with network egress or publish rights) | S, I | HARD (CI) — inconsistent across repos, standardization pending | ecosystem practice |
| PC-06 | Residuals ledger present and machine-readable where possible; known gaps are named, never silent | S | AUDIT | [L-007](LESSONS.md#l-007) |
| PC-07 | Closed positive sets at trust boundaries: boundary decisions specified and implemented as allowlists; any deny-list at a boundary is a review finding by default | S, I | SEMI (critique class + review lens; lint heuristic plannable) | [L-001](LESSONS.md#l-001), [L-002](LESSONS.md#l-002) |
| PC-08 | Stage-artifact chain on T2/T3 paths: implementation PRs require spec + critique + acceptance manifest on base branch | S, I | HARD (process-guard) | [L-001](LESSONS.md#l-001) |
| PC-09 | Acceptance freeze: hash manifest over acceptance tests, recomputed every PR; edits red, activation-file changes green | S, I | HARD (process-guard) | [L-001](LESSONS.md#l-001) |
| PC-10 | Mixed-diff guard: src/** + test/acceptance/** in one diff fails unless the contract changed in the same PR | S, I | HARD (process-guard) | [L-001](LESSONS.md#l-001) |
| PC-11 | CI exists in-repo and runs the repo's full verify (typecheck, tests, build) on every PR; branch protection requires it | S, I | HARD (platform) | [L-004](LESSONS.md#l-004) |
| PC-12 | Tier declared in one machine-readable line; promotion triggers (new auth boundary, real data, published package, egress, external write access) flag mismatches | S, I, X | AUDIT | [L-008](LESSONS.md#l-008) |
| PC-13 | Author-identity split: committer on acceptance paths ≠ committer on src paths | S, I | SEMI (identity check + audit; forgeable by owner — named residual) | [L-001](LESSONS.md#l-001) |
| PC-14 | Review front-load: round 1 ships with the contract claims list, threat rows, and invariant checklist | S, I | PROMPT (template-enforced) + AUDIT | [L-005](LESSONS.md#l-005) |
| PC-15 | Review-round ceiling: >3 rounds on one PR is recorded as a process finding in the ledger | S, I | AUDIT | [L-005](LESSONS.md#l-005) |
| PC-16 | Integration depth: the real end-to-end flow (real entry point, real adapters/stores, real client where one exists) runs in CI before any done/release claim — green units alone are never "done" | S, I | HARD where suites exist; AUDIT for coverage breadth | [L-004](LESSONS.md#l-004) |
| PC-17 | Property/generative tests at parser and encoding boundaries (input parsing, redaction, token/scope handling, serialization round-trips) | S | NOT YET ENFORCED — backlog, targets named per repo | [L-002](LESSONS.md#l-002) |
| PC-18 | Mutation testing as periodic audit of test-suite honesty — scheduled report, never a CI gate | S | NOT YET ENFORCED — backlog | [L-001](LESSONS.md#l-001) |
| PC-19 | Prose honesty: process/verification docs describe only what exists; aspirational designs are explicitly marked as such | S, I | AUDIT | [L-007](LESSONS.md#l-007) |
| PC-20 | Orchestrator holds no enforcement: any agent-dispatching system is governed by the same enforcement plane it dispatches into | S | DESIGN RULE + AUDIT | [L-009](LESSONS.md#l-009) |
| PC-21 | Gates verify their own inputs: shared fixture/schema corpora are pinned from a single source of truth bumped atomically across all consumers; every consumer runs the full corpus or names its exclusions in the job | S | NOT YET ENFORCED — pin-consistency check plannable in CI | [L-010](LESSONS.md#l-010) |
| PC-22 | No live production credentials in working trees: prod keys and admin credentials live in a secret manager; local dev uses scoped non-prod credentials; gitignore is never the only control | S, I, X | AUDIT (periodic disk sweep) | [L-011](LESSONS.md#l-011) |
| PC-23 | AI-review gate injection hardening: reviewers read governance files from the base branch, never the PR tree; write-capable jobs never check out untrusted code; gate status comes from local artifacts, not posted comments; the PR's build config is never installed/executed by the reviewer | S | HARD where review gates exist — port with each rollout | harvest: SDK fleet review workflows |
| PC-24 | Docs-freshness automation: merges in source repos dispatch drift checks against a source-file→doc-page map; stale docs become tracked issues, not surprises | S | HARD in one pipeline — port pending | harvest: docs pipeline + agentic freshness auditor |
| PC-25 | Dangerous-change-class gates: destructive or non-compliant change classes (locking/destructive migrations, regulated identifiers) are blocked by default via lint/grep gates, with auditable inline override annotations | S, I | HARD where implemented — pattern portable per domain | harvest: migration-hazard test; privacy grep-gate |
| PC-26 | Meta-CI: workflow files are themselves linted (actionlint + parse check) on any change to CI config | S, I | HARD in two repos — port pending | harvest: workflow-sanity checks |
| PC-27 | Executable examples and artifacts as gates: demos run in CI against the public API; release binaries/packages are built and driven end-to-end before publish | S | HARD in two repos — port pending | harvest: demo smoke + binary smoke |
| PC-28 | Trusted publishing: OIDC-based registry publishing with provenance (no long-lived tokens); SBOM + signing for Tier S releases | S | HARD where publishing exists | harvest: fleet publish workflows |
| PC-29 | Dry-run as an additive deny-mutations overlay: agent/ops tools compose a deny-all-writes policy layer when in dry-run, rather than relying on code paths to remember | S, I | PATTERN — adopt per tool | harvest: replication-agent contracts |
| PC-30 | Justified allowlists: every entry in a sandbox/network/mount allowlist carries an inline justification; unjustified entries are review findings | S, I | SEMI (review lens; lintable) | harvest: scanner sandbox policy |
| PC-31 | Suppression expiry: every suppressed finding (CVE ignore, disabled lint at a boundary, advisory-only scan) carries a recheck date; the audit flags expired suppressions | S, I | AUDIT | harvest: fleet CVE-ignore rot |

## Enforcement legend

- **HARD** — required status check or platform rule; no agent, harness, or human merges around it.
- **SEMI** — mechanically checked but forgeable by the repo owner, or partially mechanized; residual is named and audited.
- **AUDIT** — verified by the scheduled audit run after the fact; drift is detected within one cycle, not prevented.
- **PROMPT** — enforced only through generated prompts; weakest tier, listed so the gap is visible.
- **NOT YET ENFORCED** — declared intent with a backlog entry; counts as a named gap in every audit until it lands.

## Adding an item

New items have exactly two legitimate origins: a `LESSONS.md` entry (an incident), or
a **harvested practice** — a mechanism already proven in one of the fleet's repos,
named in the Origin column (the 2026-07-09 founding harvest audited every repo in the
fleet and seeded PC-23 through PC-31 this way). Each item must name: the check, its
tier applicability, its current and target enforcement layer, and its origin. Items
without an origin story are suspect — checklist growth without incident pressure is
how process theater starts.
