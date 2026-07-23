---
name: pipeline
description: >
  Run one feature through spec, contract, critique, frozen acceptance tests,
  implementation, review, and merge. Detect the current stage from repository
  artifacts, dispatch the required roles, and stop at every human decision.
when_to_use: >
  "run the pipeline for <feature>", "dispatch the critic / tests / coder /
  reviewer", "next stage", or any request to advance a governed feature
  through the engineering-os process.
argument-hint: "<feature> [stage|status]"
arguments: [feature, stage]
---

<!-- v3.2.1 · removes repository-specific review metadata; behavior unchanged (LANG-6).
     v3.2.0 · rewrites agent-facing prose in plain language while preserving workflow
     code and gates (LANG-1..LANG-8).
     v3.1.1 · keeps status invocations read-only after exact-head review.
     v3.1.0 · adds routing, contract rules, bounded discovery, criteria correction,
     and production-evidence separation (PA-1..PA-7).
     v3.0.0 · workflow rewrite after the 2026-07-18 contract critique. -->

# Pipeline Helper

## Purpose

Detect the current stage and run one Workflow for the next stage. Follow every
instruction below. This helper coordinates the work; `process-guard`, required CI, and
branch protection enforce the hard repository checks.

## Before running a stage

### Read-only status

**STOP — status request:** Run only stage detection, print the found/missing table, and
stop. Do not change a routing record, spec, log, PR body, branch, or working-tree file.
A status request may inspect Git and remotes.

### 1. Confirm the route

Ask whether the change touches login, tokens, tenancy, redaction, network access, data
writes, or parsing untrusted input.

- **T0:** Tell the user to use a normal PR and CI, then stop.
- **T1:** Continue. A skipped stage requires an exact `Process-Skip:` commit-message
  entry; record the skip in the pipeline log.
- **T2/T3:** You may help the human write the spec and contract. **STOP before stage 3.**
  Do not dispatch critic, test author, implementer, or reviewer roles from this Claude
  Code session. Use `DISPATCH.md`; there is no override or partial mode.

Before continuing, write the route, reason, required evidence, evidence links, and
acceptance-criteria version in the spec or PR body. `process-guard` does not check this
record.

### 2. Load templates

Use `<plugin>/prompts/` first. If unavailable, use the engineering-os repository's
`prompts/` directory. **STOP if neither exists:** ask the user to reinstall the plugin.
Always load prompt files; never reconstruct them from memory.

### 3. Resolve the role map

The workflow code uses the field name `seats`; it contains this role map.

**Multi-model mode** — use when the configured role models are available:

```text
{critic: spec-critic, author: acceptance-author, coder: implementer,
 fixer: implementer, checker: general-purpose,
 reviewers: [independent-reviewer
 (+ integration-reviewer when wiring-heavy)]}
```

**Single-model, multiple-focus review mode** — use otherwise:

```text
{critic: eos-spec-critic, author: eos-acceptance-author,
 coder: eos-implementer, fixer: eos-implementer,
 checker: general-purpose,
 reviewers: [eos-reviewer × focus A, B, C]}
```

`checker` runs mechanical red/verification steps. Add a second wiring review for a
wiring-heavy change. In single-model mode, every role uses the same model but fresh
contexts and separate review focus areas; log
`mode: panel (same-family, lens-diverse)` for compatibility with existing logs.

Project or user agent files may replace a named role. Dispatch by role name; never set
a model in workflow code. If reviewer and implementer resolve to one model family,
record it in the log.

### 4. Record dispatches

After each Workflow returns, append one line to `docs/pipeline-log.md`:

```text
date · feature · stage · role → agent · mode · verdict · artifact
```

Create the file header when needed. Workflows do not write this log.

## Find the current stage

Run `git fetch origin <base>` before checking the base branch. The first missing
artifact is the current stage.

| # | Stage | Artifact proving it happened |
|---|---|---|
| 1 | spec | `specs/<feature>.md` |
| 2 | contract | a `## <feature>` section in `contracts.md` (or the repo's declared contract file), plus threat rows for T2+ |
| 3 | critique | `specs/<feature>.critique.md` whose LAST verdict line is `READY` (a NOT_READY file means stage 3 is still current) |
| 4 | tests | this feature's test IDs (from the critique's acceptance-test dispositions) present under `test/acceptance/` on base: check `git ls-tree -r origin/<base> -- test/acceptance/` for the feature's test files AND the manifest listing them — never "a manifest exists" |
| 5 | implement | PR from `feat/<feature>` touching the repo's src paths |
| 6 | review | `specs/<feature>.review.md` whose `REVIEWED:` SHA equals the CURRENT PR head (a stale SHA means stage 6 is still current) |
| 7 | merge | PR merged |

`/pipeline <feature> status` prints this table with found/missing and stops.

## Workflow inputs

Every Workflow below receives exactly these fields:

| Field | Value |
|---|---|
| `seats` | the role map resolved above (field name retained for code compatibility) |
| `filledTemplate` | the loaded prompt with route, binding rules, background, discovery record or `none`, tier, and threat rows; never the raw spec alone |
| `base` | the base branch name |
| `headSha` | current PR head (stage 6 only) |
| `reviewers` | `[{agentType, lens, template}]` per the mode (stage 6 only) |
| `fixPreamble` | the implementer template's fix-round header (stage 6 only) |
| `feature` | the feature slug (branch and path names derive from it) |
| `branch` | the PR branch under review (stage 6 only) |
| `pluginDir` | absolute path of this plugin's install dir (where scripts/ and prompts/ live) — resolve it when you resolve the template dir |

## Stage 1 · spec — human, no Workflow

Help the human write `specs/<feature>.md`. The human owns product decisions.

**STOP — experiment needed:** Write `specs/<feature>.discovery.md` with the question,
owner, time/scope limit, environment, prohibited actions, experiment references,
observations, and exit decision. Do not continue delivery until the decision is known.
Discovery code is not the delivery implementation.

## Stage 2 · contract — human + helper, no Workflow

Write the contract with the human. Start with the routing record and criteria version.
Then write binding rules with stable IDs, including allowed values and failure paths.
Put explanations and alternatives under `Background (not binding)`. Add threat rows for
T2/T3. The critic reviews binding rules, not the raw spec or background.

## Stage 3 · contract critique — Workflow

Load `critique.md`. Fill it with the route, binding rules, background, tier/threat rows,
and `specs/<feature>.discovery.md` or explicit `none`. The required output values remain
`contract-sentence | acceptance-test | accepted-residual`, and the `goodhart` field
must contain exactly three broken-but-contract-compliant examples:

```js
export const meta = {
  name: 'pipeline-critique',
  description: 'Adversarial contract critique for one feature',
  phases: [{ title: 'Critique' }],
}
const CRITIQUE_SCHEMA = {
  type: 'object',
  required: ['verdict', 'findings', 'goodhart', 'pending_decisions'],
  properties: {
    verdict: { type: 'string', enum: ['READY', 'NOT_READY'] },
    findings: { type: 'array', items: { type: 'object',
      required: ['silence', 'divergent_choices', 'severity', 'disposition', 'disposition_detail'],
      properties: {
        silence: {type:'string', description:'the contract silence, per the template'},
        divergent_choices: {type:'array', minItems:2, items:{type:'string'},
          description:'the two+ reasonable implementations the silence permits'},
        severity: {type:'string', enum:['P1','P2','P3']},
        disposition: {type:'string',
          enum:['contract-sentence','acceptance-test','accepted-residual']},
        disposition_detail: {type:'string',
          description:'proposed sentence | test id + one-line behavior | why acceptable + where recorded'} } } },
    goodhart: { type: 'array', minItems: 3, items: { type: 'object',
      required: ['defective_implementation', 'defect', 'permitted_by'],
      properties: { defective_implementation: {type:'string'},
        defect: {type:'string'}, permitted_by: {type:'string'} } } },
    pending_decisions: { type: 'array', items: { type: 'string' } },
  },
}
phase('Critique')
return await agent(args.filledTemplate,
  { agentType: args.seats.critic, label: 'critic', schema: CRITIQUE_SCHEMA })
```

Save the result as `specs/<feature>.critique.md`. Its last line must be `READY` or
`NOT_READY`; stage detection reads that line.

- **STOP — `NOT_READY` or pending decisions:** Show the decisions to the human. Update
  the binding contract rules and run critique again.
- Apply every `contract-sentence` finding with the human before continuing.
- For T2/T3, if there are no `acceptance-test` findings, require the critic's explicit
  checklist evidence from the prompt. Do not accept an unexplained zero.

## Stage 4 · acceptance tests — Workflow in a worktree

Start only when critique ends in `READY`. Load `acceptance-author.md` with the binding
rules and critique findings. Every `acceptance-test` finding must map to a test ID:

```js
export const meta = {
  name: 'pipeline-acceptance',
  description: 'Author frozen acceptance suite, generate manifest, prove red',
  phases: [{ title: 'Author' }, { title: 'Prove red' }],
}
phase('Author')
const authored = await agent(args.filledTemplate + `
After writing the tests, generate the manifest with the vendored generator:
node ${args.pluginDir}/scripts/generate-manifest.mjs
Commit tests + manifest on branch test/${args.feature} and PUSH the branch
(git push -u origin test/${args.feature}) — your worktree is pruned when you
finish; only pushed work survives for verification. Do not populate
test/acceptance/phases.json — the implementer flips phases on.`, {
  agentType: args.seats.author, label: 'test-author',
  isolation: 'worktree',   // isolates WRITES + branch state; it can still read the repo
  schema: { type:'object', required:['verdict','test_ids','branch'],
    properties: { verdict:{type:'string',enum:['DONE','BLOCKED']},
      blocked_reason:{type:'string'}, branch:{type:'string'},
      test_ids:{type:'array',items:{type:'string'}} } },
})
if (!authored || authored.verdict === 'BLOCKED') return { authored }
phase('Prove red')
// runs in the MAIN checkout against the pushed branch — a sibling agent's
// worktree is pruned when it finishes and is never accessible here
const red = await agent(
  `git fetch origin && check out origin/${authored.branch} in a temp worktree
   of the MAIN repo (git worktree add, detached at the REMOTE ref — the
   author's local worktree is gone; never trust a stale local branch). Run the test suite with activation forced on
   for the new suite against UNCHANGED src. Red requires >=1 executed FAILING
   test — a crash, import error, or zero executed tests is failed_infra,
   never red. Scope-check the diff vs origin/${args.base}: normal mode touches only
   test/acceptance/**; correction mode may also contain the contract owner's earlier
   contract commit, but the acceptance author's commits must touch only acceptance
   paths. Clean up the worktree. Report exactly.`,
  { agentType: args.seats.checker, label: 'red-check',
    schema: { type:'object', required:['status','executed','failing','scope_clean'],
      properties: { status:{type:'string',enum:['red','green','failed_infra']},
        executed:{type:'number'}, failing:{type:'number'},
        failing_ids:{type:'array',items:{type:'string'}},
        scope_clean:{type:'boolean'} } } })
return { authored, red }
```

Open the `test/<feature>` PR only when all three checks pass:

1. `red.status === 'red'`;
2. `scope_clean === true`;
3. every critique `acceptance-test` finding has a matching test ID.

Compare the finding/test-ID lists yourself; CI does not perform that per-feature check.
Tell the human to merge the test PR, then stop. If authoring is `BLOCKED`, return to the
contract.

## Stage 5 · implementation — Workflow

Start only when this feature's tests and manifest are on the base branch. The global
`stage-artifact` check does not prove feature-specific coverage. Load `implementer.md`
with the binding rules and frozen-suite path:

```js
export const meta = {
  name: 'pipeline-implement',
  description: 'Implement against the frozen suite, verify, scope-check',
  phases: [{ title: 'Implement' }, { title: 'Verify' }],
}
phase('Implement')
const impl = await agent(args.filledTemplate + `
Commit on branch feat/${args.feature} and PUSH it (git push -u origin
feat/${args.feature}) — your worktree is pruned when you finish; only pushed
work survives for verification.`, {
  agentType: args.seats.coder, label: 'coder', isolation: 'worktree',
  schema: { type:'object', required:['verdict','branch'],
    properties: { verdict:{type:'string',enum:['DONE','BLOCKED']},
      blocked_reason:{type:'string'}, branch:{type:'string'},
      commit:{type:'string'} } },
})
if (!impl || impl.verdict === 'BLOCKED') return { impl }
phase('Verify')
const check = await agent(
  `git fetch origin; create a temp worktree at origin/${impl.branch} (git
   worktree add, detached at the REMOTE ref), run the repo verify commands there (package scripts / CI config) and
   report real exit codes — never trust prior claims. Then run:
   git diff --name-only --no-renames origin/${args.base}...origin/${impl.branch}
   and confirm no path is under test/acceptance/ except phases.json.
   Clean up the worktree. Report both results exactly.`,
  { agentType: args.seats.checker, label: 'verify+scope',
    schema: { type:'object', required:['verify_green','scope_clean'],
      properties: { verify_green:{type:'boolean'}, scope_clean:{type:'boolean'},
        detail:{type:'string'} } } })
return { impl, check }
```

- **STOP — implementer reports a wrong test:** Start the versioned correction process.
  The contract owner commits the corrected rule and runs critique again. The independent
  test author adds only affected tests and the manifest. Merge that PR before resuming.
  Never patch around disputed criteria.
- Open `feat/<feature>` only when `verify_green` and `scope_clean` are both true.
- If `process-guard` fails, give the exact output to one fix pass. If it still fails,
  show the failure to the human.

## Stage 6 · review — Workflow, maximum three rounds

Start only when the PR is open and CI is green. Build `args.reviewers` from the chosen
mode. In single-model mode, run separate security, claims, and wiring focus areas (the
code retains the field name `lens`). Give every reviewer the binding claims and threat
rows in round 1. Required verdicts are `pass | warn | fail`; P1/P2 block, P3 may be
recorded, and `CLEAN` is required:

```js
export const meta = {
  name: 'pipeline-review',
  description: 'Independent review, bounded fix rounds (PC-15: stop at 3)',
  phases: [{ title: 'Review' }, { title: 'Fix' }],
}
const REVIEW_SCHEMA = { type:'object',
  required:['verdict','findings','clean','reviewed_sha'],
  properties: { verdict:{type:'string',enum:['pass','warn','fail']},
    findings:{type:'array',items:{type:'object',
      required:['severity','file_line','title','detail'],
      properties:{severity:{type:'string',enum:['P1','P2','P3']},
        file_line:{type:'string'}, title:{type:'string'}, detail:{type:'string'}}}},
    clean:{type:'array',items:{type:'string'}},
    reviewed_sha:{type:'string'} } }
const dedupe = (findings) => {
  const seen = new Map()
  for (const f of findings) {
    const key = (f.file_line.split(':')[0] + '|' +
      f.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 60))
    const prev = seen.get(key)
    const rank = { P1: 0, P2: 1, P3: 2 }
    if (!prev || rank[f.severity] < rank[prev.severity]) seen.set(key, f)
  }
  return [...seen.values()]
}
const review = (sha, round) => parallel(
  args.reviewers.map((r, i) => () =>
    agent(r.template.replace('<SHA>', sha),
      { agentType: r.agentType, label: `review:${r.lens ?? i}:r${round}`,
        phase: 'Review', schema: REVIEW_SCHEMA })))
let sha = args.headSha
for (let round = 1; round <= 3; round++) {
  let verdicts = (await review(sha, round)).filter(Boolean)
  if (verdicts.length < args.reviewers.length) {
    log(`round ${round}: reviewer lost — re-running the round once`)
    verdicts = (await review(sha, round)).filter(Boolean)
    if (verdicts.length < args.reviewers.length)
      return { outcome: 'reviewer-lost', got: verdicts.length, round }
  }
  const wrongSha = verdicts.filter(v => v.reviewed_sha !== sha)
  if (wrongSha.length) return { outcome: 'stale-review', wrongSha, expected: sha, round }
  const serious = dedupe(verdicts.flatMap(v => v.findings)
    .filter(f => f.severity !== 'P3'))
  // template rule: P1/P2 block regardless of verdict; fail with zero serious
  // findings is a contradiction, never an empty fix round
  const anyFail = verdicts.some(v => v.verdict === 'fail')
  if (anyFail && serious.length === 0)
    return { outcome: 'contradiction', verdicts, round }
  if (serious.length === 0)   // pass or warn-with-P3s: gate opens, P3s recorded
    return { outcome: 'pass', verdicts, round, sha,
             p3_ledger: dedupe(verdicts.flatMap(v => v.findings)
               .filter(f => f.severity === 'P3')) }
  if (round === 3) return { outcome: 'spec-gap', verdicts, round, serious }
  log(`round ${round}: ${serious.length} serious finding(s) → fix round`)
  const fix = await agent(
    `${args.fixPreamble}\nFix ALL of these findings in one pass on branch
     ${args.branch}, then re-read the full diff before finishing (one complete
     pass, not increments), commit and PUSH the branch. Sweep for sibling
     instances of each finding:\n` +
    serious.map(f => `- [${f.severity}] ${f.file_line} ${f.title}: ${f.detail}`).join('\n'),
    { agentType: args.seats.fixer, label: `fix:r${round}`, phase: 'Fix',
      isolation: 'worktree',
      schema: { type:'object', required:['commit'],
        properties:{ commit:{type:'string'} } } })
  if (!fix) return { outcome: 'fix-failed', round }
  sha = fix.commit
}
```

Handle the Workflow result:

- **`pass`:** Write `specs/<feature>.review.md` with verdicts, `CLEAN` lists, P3 ledger,
  and `REVIEWED: <final sha>` as the last line. Push any fixes and continue. A later
  push makes this review stale.
- **`spec-gap`:** Draft the five-field `LESSONS.md` entry and return to contract or
  critique. There is no fourth review round.
- **`contradiction`, `stale-review`, or `reviewer-lost`:** Reject the result and show
  the exact disagreement to the human. Do not continue with partial evidence.

## Stage 7 · merge — human only

Show the verdict, number of rounds, P3 ledger, and degraded checks. For a production
change, report software verification separately from target, preconditions,
authorization, stop conditions, rollback, and observed results. This pipeline does not
authorize a live action. The human decides whether to merge.

## After a defect escapes

Draft a `LESSONS.md` entry with `What`, `Where`, `Caught by`, `Class`, and `Became`.
Propose which guard, baseline check, or critic question should change. The human
approves the lesson and enforcement level.
