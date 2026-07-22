# Monthly Audit — agent prompt v1.1 (R-1..R-4)

You are running the monthly Engineering OS audit. Read
`~/project/engineering-os/ROUTINES.md` (R-1 through R-4) and `BASELINE.md` first —
they define exactly what to check. This prompt tells you how to execute.

## Setup

1. Governed repos = every repo under `~/project` whose `CLAUDE.md` or `AGENTS.md`
   declares a `tier:` line. List them first. If none: report "no governed repos"
   and stop.
2. Lookback = since the previous audit report (find the newest file in
   `~/project/engineering-os/audits/`); if none exists, use 3 months.
3. Fan out one subagent per governed repo for R-1/R-2; run R-3/R-4 yourself.

## Execution notes per routine

- **R-1 (conformance):** use `gh api repos/{owner}/{repo}/branches/{branch}/protection`
  for required checks; `git log --since` + diff scans for promotion triggers;
  check `.process-guard-exempt` age via `git log -1 --format=%ci -- .process-guard-exempt`
  and parse its owner/reason/created/review_by/removal_condition fields.
- **R-2 (outcomes + review burn):** `gh pr list --state merged --search "merged:>DATE"`,
  then per PR count review→push cycles from `gh pr view --json reviews,commits`.
  Cross-check every >3-round PR against LESSONS.md entries. Read routing records,
  critique/test/review artifacts, CI results, and new LESSONS entries to report stage
  yield; use `unknown` when the catch stage is not evidenced. Check criteria-version
  changes and discovery boundaries exactly as R-2 defines them.
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
3. **R-2 table** — repo | merged PRs | median/worst rounds | skips | routing violations |
   caught at critique/acceptance/CI/review | escaped/unknown | criteria/discovery violations.
4. **R-3 list** — each drifted file/pin, current vs canonical.
5. **R-4 list** — each out-of-compliance ledger item + one-line proposed action.
6. **Proposed sweeps** — batched fixes grouped by kind (one group = one review
   pass for the operator). Do NOT apply fixes; propose only.

Rules for you: read-only except the report file. No fix commits. Abstract any
identifying details if a finding gets proposed as a public LESSONS entry. If a
check can't be run (missing gh auth, private repo, no remote), say so explicitly
in the report — never silently skip (that's PC-02 applied to yourself).

## Changelog

- **v1.1** — extended R-1 exemption lifecycle checks and R-2 outcome/stage-yield,
  routing, discovery, and criteria-correction reporting (practical-process gap PA-5 /
  PA-6).
- **v1.0** — initial R-1..R-4 monthly bundle.
