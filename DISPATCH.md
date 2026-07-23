# Start and Route Work

Use this page when starting a change. See [`ONBOARDING.md`](ONBOARDING.md) for
repository setup.

## 1. Set up each repository once

1. Copy `templates/agent-context-block.md` into both `CLAUDE.md` and `AGENTS.md`.
2. Add `process-guard` to CI and make it a required check.
3. Add a pre-commit hook that runs the same guard, then configure
   `git config core.hooksPath .githooks`.

CI and branch protection remain active even when an agent misses its instructions.

## 2. Choose the change route

Ask: **Does this change make a decision at a trust boundary?** Examples include login,
tokens, tenancy, redaction, network access, data writes, and parsing untrusted input.

- **T0:** mechanical change with no behavior change. Use a normal PR and CI.
- **T1:** behavior change outside a trust boundary. Use the pipeline by default. A
  skipped stage requires an exact `Process-Skip:` commit-message entry; audits count
  skips.
- **T2:** change at a trust boundary. Use the independent roles below.
- **T3:** any novel trust boundary being implemented for the first time, or a
  security-critical parser/state machine. Use multiple independent implementations
  and reviewers.
- **Docs:** for every promise such as `never`, `always`, or `cannot`, identify the
  enforcing control and a test.

Record the route:

```text
Route: <T0 | T1 | T2 | T3 | Docs>
Reason: <why this route applies>
Required evidence: <stages, tests, review, production evidence>
Evidence links: <fill before merge>
Acceptance-criteria version: <AC-n | not applicable>
```

Prompts and the monthly audit check this record; `process-guard` does not.

### When an experiment is needed

Write `specs/<feature>.discovery.md` with the question, owner, time/scope limit,
permitted environment, prohibited actions, experiment references, observations, and
exit decision. Do not use production credentials or mutations. Do not ship the
experimental code. Return to the contract stage after the decision is known, and pass
the discovery record to the critic.

## 3. Run T2/T3 roles in order

Do not run the acceptance-test author and implementer in the same model/harness.

| Order | Role | Template | Input | Output |
|---|---|---|---|---|
| 1 | Contract critic | `prompts/critique.md` | route, binding rules, background, discovery, threats | `specs/<feature>.critique.md` |
| 2 | Acceptance-test author, separate from implementer | `prompts/acceptance-author.md` | binding rules + critique | tests + manifest in their own PR |
| 3 | Implementer(s) | `prompts/implementer.md` | binding rules + frozen suite | one T2 implementation or 2–3 T3 candidates |
| 4 | Reviewer(s), different family from implementer(s) | `prompts/reviewer.md` | PR/candidates + rules + threats | verdict or blind T3 ranking |

### T2

Use one strong implementation. Run separate security, public-claims, and wiring reviews
with a different model family.

### T3

1. Give identical inputs to 2–3 strong implementers in separate worktrees.
2. Run the frozen suite against every candidate.
3. Blind-rank the candidates that pass.
4. Run two reviewer families across the security, claims, and wiring focus areas.
5. If a runner-up contains a useful idea, add it deliberately; do not reconstruct it
   from memory.

### Required stops

- **STOP — acceptance PR not merged:** Do not start implementation. The pipeline checks
  feature-specific sequencing; `process-guard` checks only that a global manifest
  exists on the base branch.
- **STOP — critic reports pending decisions:** The human decides, updates the contract,
  and runs critique again. Do not code through the gap.
- **STOP — review reaches three rounds:** Record what the contract or tests missed,
  repair that earlier stage, and continue from there. There is no fourth round.

## 4. Correct a frozen test rule

If a frozen test rule is wrong:

1. Stop implementation.
2. The contract owner records the reason, old/new criteria versions, and affected rule
   IDs on a correction branch.
3. Run critique again for those rules.
4. An acceptance-test author who is independent from the implementer adds only the
   affected tests and manifest on the same branch.
5. Merge the reviewed contract-and-test PR before implementation resumes.

`process-guard` checks the changed contract path and test hashes. Prompts and audits
check the reason, versions, authorship, and review. See
[`OS.md`](OS.md#correcting-frozen-acceptance-criteria).

## 5. Separate software checks from production approval

For production-changing systems, record the target, deployed revision, observed
preconditions, human authorization, stop conditions, rollback readiness, and observed
results. Keep this evidence outside the AI orchestrator. These checks are not yet
hard-enforced across every repository; each operational repository must add its own
runtime gates. See [`POLICY.md`](POLICY.md#production-mutation-overlay).

## 6. Use the prompt templates

- Claude Code: use the filled template as the task message.
- Codex: use the same template; `AGENTS.md` carries standing rules.
- Other tools: use the same versioned template.

Always load the template file. Never reconstruct the instructions from memory.

## 7. Learn from failures

When a defect escapes, review drags, or a gate is skipped:

1. Add the five abstract fields to `LESSONS.md`: What, Where, Caught by, Class, Became.
2. Turn the lesson into a guard check, baseline item, or critic question. Bump the
   changed version.
3. Apply the new check to governed repositories in one batch.
