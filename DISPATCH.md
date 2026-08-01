# Dispatch Cheat Sheet

## Once per repository

1. Create root `BRIEF.md` from `templates/project-brief.md`.
2. Copy `templates/agent-context-block.md` into `AGENTS.md` and `CLAUDE.md`.
3. Define one repository-owned verification command, including the linter or static
   analyzer (a tool that inspects code without running it) that fits the language.
4. Make CI run that command in a required check named `verify`.
5. Protect `main`: pull requests and required checks only. For a solo owner, required
   human approvals stay at zero.

`process-guard` is optional. Add it only when the repository deliberately uses
hash-frozen acceptance tests and accepts its documented limitation.

## For every behavior-changing slice

### 0. Cut

State the one rule that changes, affected paths, dependencies, and exclusions. Around
300 changed lines is a warning to reconsider the cut. Keep no more than two pull
requests in active review.

### 1. Contract

Write what must happen, what must fail, every important input and exit path, and the
real entrypoint that will prove the work. Do not code while a decision remains open.

### 2. Critique

Give `prompts/critique.md` to one fresh AI critic. It finds missing decisions and
unsafe silences. The critic never implements the change.

T2 and T3 require this step. T1 uses it when behavior is not already clear.

### 3. Implement

Give `prompts/implementer.md` to one implementer with the contract, critique, exact
files, and repository verify command. The implementer writes code and normal tests.
It updates `BRIEF.md` when architecture, modules, or run/test commands change.

For a bug fix, prove the new test fails when the fix is removed.

For an unusually dangerous slice, first use `prompts/acceptance-author.md` as an
optional acceptance challenger. It proposes a small set of hostile cases; it does not
create a frozen suite or another implementation.

### 4. Verify

Run the repository-owned command and the real shipped entrypoint. Report the actual
commands and exit results. A type check or unit suite alone is not enough.

### 5. Review

Give `prompts/reviewer.md` to one fresh AI reviewer. Include the contract, threat
notes, full diff, verification evidence, and exact head SHA.

P1 and P2 findings block. Fix all findings in one pass, sweep siblings, rerun verify,
then review the new head. A third substantive round stops the change and sends it back
to the contract or cut.

### 6. Merge

The owner confirms:

- required CI is green;
- no unresolved P1 or P2 finding remains;
- the review names the current head SHA;
- the real entrypoint ran;
- the pull request still contains one reviewable slice.
- `BRIEF.md` is current when the project shape or commands changed.

Then the owner merges.

## When the process fails

Add one class-level entry to `LESSONS.md`: what happened, where, how it was found, the
defect class, and the check or rule it changed. Do not publish private repository
details or identifying incident numbers.
