# Routines

The recurring jobs that keep this OS honest. Each one is run by an agent; the human
reads one short report. Every routine states its **lookback window** and the **exact
checks** — a routine that "reviews things generally" finds nothing.

**First run note:** the first execution of each routine uses a 3-month lookback to
build the baseline. After that, the window is "since the last run."

The runnable prompt for the monthly bundle is in
[`routines/monthly-audit-prompt.md`](routines/monthly-audit-prompt.md). Run it with
any agent that has disk + `gh` access, from `~/project`:

```
claude -p "$(cat engineering-os/routines/monthly-audit-prompt.md)"
```

---

## R-1 · Repo conformance audit — monthly

**Why:** rules drift silently; this catches drift within a month instead of never.
**Lookback:** since last run.
**For every governed repo, check exactly:**

1. Tier is declared, and nothing happened this month that requires promotion:
   new login/auth code, new published package, new network egress, new personal
   data handling (scan the month's merged diffs for these).
2. CI exists and is required: protected branch requires the verify job and
   `process-guard`; the guard's pinned SHA is the current release.
3. Exempt markers (`.process-guard-exempt`) still present → validate `owner`,
   `reason`, `created`, `review_by`, and `removal_condition`; list each as a named
   gap with its age. Missing fields, passed review dates, or satisfied removal
   conditions are findings. An exemption older than 2 audits gets escalated.
4. Supply chain floor: lockfile committed, exact pins, frozen-lockfile install in
   CI, all GitHub Actions pinned by full SHA.
5. Secret-history lint and anti-silent-skip present where the tier requires them
   (PC-01, PC-02).
6. Prose honesty spot-check (PC-19): any doc claiming a tool/check exists that
   doesn't (grep guarantee verbs in docs changed this month against code).

**Output:** one line per repo — `CONFORMANT` or `GAPS: PC-xx, PC-yy (ages)`.

## R-2 · Delivery outcomes and review burn — monthly

**Why:** process value is defects caught before escape, not artifacts produced. Review
rounds remain a paid, shared budget; rising burn means contracts or gates are weakening
upstream.
**Lookback:** PRs merged since last run.
**Check exactly:**

1. Rounds per merged PR (review event → fix push → re-review = one round).
   Median and worst. Every PR over 3 rounds must have a `LESSONS.md` entry — if it
   doesn't, that's the finding.
2. `Process-Skip:` trailer count per repo. A rising skip rate is a finding.
3. Red merges: any PR merged while a required check was failing (possible in
   degraded mode on private repos — this is the honesty check for that mode).
4. Acceptance-suite changes: every change to `test/acceptance/**` or its manifest
   happened in a PR that also changed the contract. Anything else = guard bypass,
   investigate immediately. Verify the coverage map includes every normative invariant
   and critique `acceptance-test` disposition. For a criterion correction, verify the
   correction reason, superseded/new versions, affected invariant IDs, re-critique,
   correction-specific review, and that implementation stopped until it merged.
5. Author identity: committer on acceptance paths differed from committer on src
   paths for each slice (PC-13's semi-check).
6. Routing honesty: each PR has route, reason, required evidence, and final evidence
   links; flag a lower route than the changed boundary required.
7. Stage yield: count defects or unsafe ambiguities caught by critique, acceptance
   red proof, CI, and review; separately count escaped defects from new `LESSONS.md`
   entries plus false-green/silent-skip incidents. Unknown catch stage is reported as
   unknown, never guessed.
8. Discovery boundary: verify each discovery record has question, owner, time-or-scope
   bound, permitted environment, prohibited actions, and exit decision. Flag any
   experiment merged or deployed as delivery, production mutation/credentials, or
   delivery started without returning to the contract stage.
9. Contract shape: new or changed contracts have stable normative invariant IDs,
   supporting rationale is explicitly non-normative, and the criteria version matches
   the routing record.

Artifact/file/test counts are conformance facts, not success metrics. A large suite or
many review comments is not scored as process value by itself.

**Output:** table per repo: PRs, median/worst rounds, skips, routing violations,
stage-yield counts (critique / acceptance / CI / review / escaped / unknown),
false-green/silent-skip count, criteria churn after coding began, and
criteria/coverage-map/discovery/contract-shape violations.

## R-3 · Drift sync check — monthly

**Why:** the same rules live in several places (global agent files, repo context
blocks, guard pins, fixture pins) and every copy drifts — this already happened
twice (global CLAUDE.md vs AGENTS.md; SDK fixture pins).
**Lookback:** current state, compared to the canonical versions in this repo.
**Check exactly:**

1. `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md` contain the same Engineering OS
   rule set (compare rule-by-rule against `templates/agent-context-block.md`'s
   list, not word-by-word).
2. Every governed repo's `CLAUDE.md`/`AGENTS.md` carries the current context-block
   rules.
3. All repos pin the same `process-guard` SHA (the latest release).
4. Shared-corpus pins (PC-21): every consumer of a shared fixture/schema repo pins
   the same commit, and every consumer's CI runs the full corpus or names its
   exclusions in the job itself.
5. Prompt template versions: any local copies of `prompts/*` older than this
   repo's current versions.

**Output:** list of drifted files/pins with the two versions. Fixes are a batched
sweep (one kind of fix across all repos, one review pass).

## R-4 · Ledger follow-through — monthly

**Why:** a lesson that never became a check is a lesson that will repeat.
**Lookback:** whole ledger, every run.
**Check exactly:**

1. Every `LESSONS.md` entry's "Became" items actually exist (the PC item, the
   prompt version, the guard check).
2. Every `NOT YET ENFORCED` baseline item: has it moved in the last 2 audits? If
   not, either schedule it or downgrade it honestly to an accepted risk in
   `OS.md` — no permanent limbo.
3. Suppression expiry (PC-31): every ignored CVE / disabled lint / advisory-only
   scan — is the recheck date set, and has it passed? Has a patched version
   shipped that makes the ignore obsolete?

**Output:** items out of compliance, each with a proposed action (one line).

## R-5 · Deep pass — quarterly

**Why:** some checks are too heavy or too slow-moving for monthly.
**Lookback:** the quarter.
**Check exactly:**

1. Publishing trust: registry publisher configs (PyPI/npm org, trusted publishing,
   2FA, workflow names) match what the repos expect — configs drift when orgs are
   renamed (this happened once).
2. Mutation-testing report (PC-18) on Tier-S repos: break code on purpose, count
   how many mutants the tests kill. Report the score; never gate on it.
3. Threat-model freshness: each Tier-S threat model was either updated this
   quarter or explicitly re-confirmed current; every adversarial test class maps
   to a threat row and vice versa.
4. Dependency ledger adherence: spot-check deps added this quarter against the
   release-age rule (7 days; 15 for publish/egress).

**Output:** short memo, one section per item.

## R-6 · Per incident — not scheduled

Triggered whenever a bug, near-miss, or dragged review happens. Steps are in
[`DISPATCH.md`](DISPATCH.md) §4: five abstract lines in `LESSONS.md` → becomes a
check or critique question → version bump → batched sweep. Target: less than a day
from incident to check.

---

## Who runs what

| Routine | Runner | Human cost |
|---|---|---|
| R-1..R-4 (monthly bundle) | one agent run, one prompt | read ~1 page of tables, approve proposed fixes |
| R-5 (quarterly) | one agent run | read a short memo |
| R-6 (per incident) | the agent that caught it drafts; human approves | ~2 minutes |

Schedule suggestion: monthly bundle on the 1st, quarterly pass in the first week of
Jan/Apr/Jul/Oct. Don't start the schedule before at least one repo is onboarded —
auditing zero governed repos produces a report that says "nothing is governed,"
which you already know.
