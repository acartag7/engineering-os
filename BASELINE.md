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

## Enforcement legend

- **HARD** — required status check or platform rule; no agent, harness, or human merges around it.
- **SEMI** — mechanically checked but forgeable by the repo owner, or partially mechanized; residual is named and audited.
- **AUDIT** — verified by the scheduled audit run after the fact; drift is detected within one cycle, not prevented.
- **PROMPT** — enforced only through generated prompts; weakest tier, listed so the gap is visible.
- **NOT YET ENFORCED** — declared intent with a backlog entry; counts as a named gap in every audit until it lands.

## Adding an item

New items come only from `LESSONS.md` entries. Each must name: the check, its tier
applicability, its current and target enforcement layer, and the lesson that created
it. Items without an origin story are suspect — checklist growth without incident
pressure is how process theater starts.
