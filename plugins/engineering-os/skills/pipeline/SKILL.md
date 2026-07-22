---
name: pipeline
description: >
  Drive one feature through the engineering-os pipeline (spec → contract →
  critique → frozen acceptance tests → implement → review → merge) as Workflow
  orchestrations over the seat agents — no manual prompt pasting. Detects the
  current stage from repo artifacts and stops at every human gate.
when_to_use: >
  "run the pipeline for <feature>", "dispatch the critic / tests / coder /
  reviewer", "next stage", or any request to advance a governed feature
  through the engineering-os process.
argument-hint: "<feature> [stage|status]"
arguments: [feature, stage]
---

<!-- v3.1.0 · adds visible routing, compact invariant contracts, bounded discovery,
     versioned criteria correction, and runtime-evidence separation (PA-1..PA-7).
     v3.0.0 · workflow rewrite after the 2026-07-18 contract critique. -->

# Pipeline driver (workflow edition)

You are the Layer-2 driver for the engineering-os pipeline. You detect the
current stage from artifacts, then launch ONE Workflow per stage segment. You
are advisory by design: the walls are process-guard in CI and branch
protection — never you or the workflow. Nothing below enforces; it catches
mistakes early and makes the compliant path the lazy path.

## Stage 0 — every invocation, before anything

1. **Tier.** Ask/confirm: does this change touch a trust boundary (logins,
   tokens, tenancy, redaction, egress, parsers over untrusted input)?
   - T0 mechanical → say "pipeline is overkill, normal PR" and stop.
   - T1 → proceed. A stage may be skipped only with a `Process-Skip:` trailer
     on the relevant commit; record the skip in the log line.
   - **T2/T3 → refuse every dispatch and point at DISPATCH.md §2.** Seats
     inside one Claude Code process do not satisfy T2/T3 harness separation;
     there is no override flag and no partial mode. The only stages you may
     help with are the two HUMAN stages (1 spec, 2 contract — you co-write,
     nothing is dispatched); from stage 3 on, every seat including the critic
     is dispatched per DISPATCH.md outside this process.
   Before continuing, write the POLICY routing record (tier, reason, required
   evidence, eventual evidence links, acceptance-criteria version) into the spec or
   PR body. This driver records it; `process-guard` does not enforce it.
2. **Templates.** Resolve template dir: `<plugin>/prompts/` first (vendored,
   with source SHA header), else the engineering-os repo's `prompts/` if the
   user has it. Neither → stop: "templates unavailable; reinstall the plugin."
   Never improvise a seat prompt from memory (O-5).
3. **Seats.** Resolve the seat map once and echo it in your first status line:
   - **Routed mode** — the routed seats' models resolve in this session
     (gateway up + authenticated; if unsure, ask):
     `{critic: spec-critic, author: acceptance-author, coder: implementer,
       fixer: implementer, checker: general-purpose,
       reviewers: [independent-reviewer
       (+ integration-reviewer when wiring-heavy)]}`
   - **Panel mode** — otherwise:
     `{critic: eos-spec-critic, author: eos-acceptance-author,
       coder: eos-implementer, fixer: eos-implementer,
       checker: general-purpose,
       reviewers: [eos-reviewer × lens A, B, C]}`
     (`checker` runs the mechanical verify/red steps — it is deliberately a
     plain harness agent, not a seat; shadowable like any name.)
     Lenses are the template's own A/B/C set; add a second pass of lens C for
     wiring-heavy changes. Panel size note: POLICY.md asks one independent
     reviewer for T1 — the A/B/C panel EXCEEDS that on purpose because
     same-family review needs the lens spread to de-correlate; a driver
     choice, recorded, not a POLICY requirement.
     All seats share the session model: fresh context is real, family
     diversity is NOT — log `mode: panel (same-family, lens-diverse)`.
   - Users may shadow any seat name with their own agent file (project/user
     agents beat plugin agents); dispatch by NAME, never set `model` in
     scripts. If the user's shadow puts reviewer and coder in one family,
     note it in the log line when you know it — recorded, never blocking.
4. **Log.** Append one line per dispatch to `docs/pipeline-log.md`
   (create with a header if missing): `date · feature · stage · seat →
   agent · mode · verdict · artifact`. Do this yourself after each workflow
   returns — workflows don't write the log.

## Stage detection (first missing artifact = current stage)

Run `git fetch origin <base>` before base-branch checks.

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

## The args contract (every workflow below receives exactly this)

| args field | Filled by you with |
|---|---|
| `seats` | the resolved seat map from stage 0 |
| `filledTemplate` | the stage's template with its declared blanks filled (contract section — never the raw spec — plus tier/threat rows) |
| `base` | the base branch name |
| `headSha` | current PR head (stage 6 only) |
| `reviewers` | `[{agentType, lens, template}]` per the mode (stage 6 only) |
| `fixPreamble` | the implementer template's fix-round header (stage 6 only) |
| `feature` | the feature slug (branch and path names derive from it) |
| `branch` | the PR branch under review (stage 6 only) |
| `pluginDir` | absolute path of this plugin's install dir (where scripts/ and prompts/ live) — resolve it when you resolve the template dir |

## Stage 1 · spec — human, no workflow

Help the user draft `specs/<feature>.md` interactively (the one stage where
the driver co-writes; the human owns it). If a decision needs an experiment first,
record a bounded discovery question/owner/time-or-scope bound/environment/
prohibited-actions/exit decision and STOP delivery. Discovery code never becomes the delivery implementation; return to
this stage after the decision is known.

## Stage 2 · contract — human + driver, no workflow

Draft the `contracts.md` section WITH the user from the spec. Start with the routing
record and acceptance-criteria version, then stable-ID normative invariants: concrete
behavior, closed sets, and failure paths. Put explanation and alternatives under an
explicitly non-normative rationale heading; threat rows for T2+ (which you'll have
refused to orchestrate further anyway — the contract is still worth writing here).
The critic needs a compact binding surface to attack; the spec and rationale are not it.

## Stage 3 · critique — workflow

Fill `critique.md` from the template dir with the CONTRACT section + tier.
Schema mirrors the template's output contract verbatim — dispositions are
`contract-sentence | acceptance-test | accepted-residual`, and the Goodhart
pass is mandatory:

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

Write `specs/<feature>.critique.md` from the result, ENDING with the verdict
line (`READY` / `NOT_READY`) — stage detection reads it. `pending_decisions`
non-empty or NOT_READY → present the decisions, STOP; the user updates the
CONTRACT, re-run. `contract-sentence` dispositions → apply them to
contracts.md with the user before proceeding. A T2/T3 critique with zero
acceptance-test dispositions is presumptively lazy (template rule) — say so.

## Stage 4 · acceptance tests — workflow (worktree)

Gate: critique READY. Fill `acceptance-author.md` with the contract + the
critique's acceptance-test dispositions (every one must map to a test ID):

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
   never red. Also verify the diff vs origin/${args.base} touches only
   test/acceptance/** (the manifest included). Clean up the worktree. Report exactly.`,
  { agentType: args.seats.checker, label: 'red-check',
    schema: { type:'object', required:['status','executed','failing','scope_clean'],
      properties: { status:{type:'string',enum:['red','green','failed_infra']},
        executed:{type:'number'}, failing:{type:'number'},
        failing_ids:{type:'array',items:{type:'string'}},
        scope_clean:{type:'boolean'} } } })
return { authored, red }
```

`red.status === 'red'` AND `scope_clean` AND every acceptance-test disposition
has a matching test ID (diff the two lists YOURSELF — no CI check does this;
the template's coverage rule is driver-checked, Layer 2) → open the suite PR
(`test/<feature>`), tell the user to merge it, STOP. BLOCKED → contract gap,
back to the user.

## Stage 5 · implement — workflow

Gate: this feature's tests + manifest on base (stage-detection row 4 — CI's
stage-artifact only checks that A manifest exists; the per-feature check is
yours). Fill `implementer.md` with the contract + frozen-suite pointer:

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

BLOCKED ("a test is wrong") → stop implementation and run OS.md's versioned criteria
correction: the contract owner commits the incremented/superseding contract and
re-critiques affected invariants; the independent acceptance author then adds only the
affected tests + manifest on that correction branch. Merge that PR before resuming. Never patch around disputed criteria. Both true → open PR `feat/<feature>`;
process-guard runs on its own. Guard red → one fix pass with the exact failing output,
then surface.

## Stage 6 · review — workflow (template-faithful verdicts, bounded rounds)

Gate: PR open, CI green. Build `args.reviewers` per the mode (lens A/B/C from
the template in panel mode; front-load = contract promises + threat rows,
round 1, PC-14). Verdicts follow the TEMPLATE: `pass | warn | fail`, P1/P2
block, P3 may ship recorded; `CLEAN` list required:

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

Returns:
- `pass` → write `specs/<feature>.review.md`: verdicts, `CLEAN` lists,
  `REVIEWED: <final sha>` as the last line (stage detection compares it to
  the PR head — any later push makes the review stale by construction), plus
  the P3 ledger. Push fixes; go to stage 7.
- `spec-gap` → PC-15: draft the LESSONS.md entry, route to stage 2/3. Never
  round 4.
- `contradiction` / `stale-review` / `reviewer-lost` → fail closed, show the
  user exactly what disagreed.

## Stage 7 · merge — human

Present verdict summary, rounds, P3 ledger, degradations. For production mutations,
report software-revision verification separately from the repository's per-run target,
precondition, authorization, stop, rollback, and postcondition evidence; never imply
that this pipeline authorizes a live action. The user merges. Never you.

## After an escape

Bug shipped through the pipeline → draft the five-line LESSONS.md entry
(What/Where/Caught by/Class/Became) and propose the enforcement layer for the
new check. The human decides.
