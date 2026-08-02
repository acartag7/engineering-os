# Monthly Audit — agent prompt v2.3 (R-1..R-4)

You are running the monthly Engineering OS audit. Read
`~/project/engineering-os/ROUTINES.md` (R-1 through R-4) and `BASELINE.md` first —
they define exactly what to check. This prompt tells you how to execute.

## Setup

1. Governed repos = every repo under `~/project` whose `CLAUDE.md` or `AGENTS.md`
   declares a `tier:` line. List them first. If none: report "no governed repos"
   and stop.
2. Lookback = since the previous audit report (find the newest file in
   `~/project/engineering-os/audits/`); if none exists, use 3 months.
3. Inspect each governed repo independently for R-1/R-2. Use separate agents when the
   host supports them; otherwise process repositories one at a time with fresh evidence.

## Execution notes per routine

- **R-1 (conformance):** use `gh api repos/{owner}/{repo}/branches/{branch}/protection`
  for required checks; confirm the repository-owned `verify` command is required and
  exercises the real entrypoint; use `git log --since` + diff scans for promotion
  triggers. Audit `process-guard` pins only in repositories that opted into it.
  Confirm `BRIEF.md` exists, its map matches the tree, and its commands work. Confirm
  `verify` includes a language-appropriate static check. For changed security claims,
  trace guarantee words to tests; at HTTP boundaries check duplicate credential
  rejection and closed error-code types.
- **R-2 (outcomes + review burn):** `gh pr list --state merged --search "merged:>DATE"`,
  then per PR count review→push cycles from `gh pr view --json reviews,commits`.
  Cross-check every >3-round PR against LESSONS.md entries. Read routing records,
  critique/test/review artifacts, CI results, and new LESSONS entries to report stage
  yield; use `unknown` when the catch stage is not evidenced. Check the one-rule slice,
  regression counterfactual, real-entrypoint evidence, exact-head review SHA,
  round-three stop, two-PR work-in-progress limit, false greens, silent skips, and
  complete discovery records exactly as R-2 defines them. Fetch the paginated review
  threads and flag unread or unresolved actionable findings at the merged head.
  Check brief updates and line-cap-shaped code compression as R-2 defines them.
- **R-3 (drift):** compare rule PRESENCE, not exact wording. The canonical rule
  list is `templates/agent-context-block.md`. For pins: grep workflow files for
  the guard/fixture SHAs and compare across repos.
- **R-4 (ledger):** for each LESSONS entry, verify each "Became" artifact exists
  at its stated location and version.

## Output contract

Write the report to `~/project/engineering-os/audits/<YYYY-MM>.md` with exactly
these sections:

1. **Summary** — 5 lines max: repos audited, conformant count, total gaps, worst
   review-burn PR, escaped defects, drifted copies found.
2. **R-1 table** — repo | tier | verdict | gaps (PC ids + exemption ages/dates).
3. **R-2 table** — repo | merged PRs | median/worst rounds | routing violations |
   caught at critique/tests/CI/review | escaped/unknown | false greens/silent skips |
   stale review | missing regression proof | slice/review-limit violations.
4. **R-3 list** — each drifted file/pin, current vs canonical.
5. **R-4 list** — each out-of-compliance ledger item + one-line proposed action.
6. **Proposed sweeps** — batched fixes grouped by kind (one group = one review
   pass for the operator). Do NOT apply fixes; propose only.

Rules for you: read-only except the report file. No fix commits. Abstract any
identifying details if a finding gets proposed as a public LESSONS entry. If a
check can't be run (missing gh auth, private repo, no remote), say so explicitly
in the report — never silently skip (that's PC-02 applied to yourself).

## Changelog

- **v2.3** — added paginated current-head review-thread evidence after LESSONS.md
  L-020.
- **v2.2** — added configurable profiles, provider-instance evidence, strict
  pre-implementation test proof, safe migration checks, and a no-multi-agent fallback
  after LESSONS.md L-019.
- **v2.1** — added Project Brief freshness, language-appropriate static checks,
  test-backed trust claims, duplicate security-header rejection, closed error-code
  types, the anti-code-golf review check, and the Project Brief audit (LESSONS.md
  L-016 through L-018).
- **v2.0** — changed the audit to the solo, language-neutral workflow: required
  repository verify, real entrypoint, one-rule slice, regression proof, exact-head
  review, round-three stop, and optional `process-guard` (LESSONS.md L-015).
- **v1.1** — extended R-1 exemption lifecycle checks and R-2 outcome/stage-yield,
  routing, discovery, and criteria-correction reporting (practical-process gap PA-5 /
  PA-6).
- **v1.0** — initial R-1..R-4 monthly bundle.
