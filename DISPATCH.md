# Dispatch Cheat Sheet

How to actually use this when starting a piece of work. One page, no theory.

## 0. Once per repo (setup — see ONBOARDING.md for the full list)

1. Copy the block from `templates/agent-context-block.md` into the repo's
   `CLAUDE.md` and `AGENTS.md`, set the tier.
2. Wire `process-guard` into CI and make it a required check.
3. Commit a `.githooks/pre-commit` that runs the guard locally; setup runs
   `git config core.hooksPath .githooks`.

After this, every agent in every tool hits the same walls, whether or not it reads
anything.

## 1. Every piece of work: decide the tier first

Ask one question: **does this decide who or what may access, change, or send sensitive
data?** Examples include login, tokens, tenant separation, redaction, network
connections, data writes, and parsers for untrusted input.

- No, and it's routine (rename, dependency update) → **T0**: normal PR + CI.
- No, but behavior changes → **T1**: pipeline is default-on; you may skip stages
  with a `Process-Skip:` trailer (the audit counts skips).
- Yes → **T2**. A parser for untrusted input, or brand-new security behavior →
  **T3**.
- Docs that make promises to users → run the claims check (every "never/always/
  cannot" must point at enforcing code).

Record the route before dispatching:

```text
Route: <T0 | T1 | T2 | T3 | Docs>
Reason: <why>
Required evidence: <stages, tests, review, runtime evidence>
Evidence links: <fill before merge>
Acceptance-criteria version: <AC-n | not applicable>
```

Then check that the task is ready:

- one clear rule rather than several unrelated rules;
- every affected code path can be listed;
- no important decision is still open;
- one reviewer can understand the whole change;
- the AI has a clear reason to stop.

Line count is only a warning. A rule used in several places may still be one clear
change, especially when much of the pull request is tests.

This record is **PROMPT + AUDIT**, not a `process-guard` check. If the route cannot be
decided without an experiment, use [`POLICY.md`](POLICY.md)'s bounded discovery lane,
write `specs/<feature>.discovery.md`, and pass it to the critic when delivery resumes;
do not let experimental code become the delivery implementation.

## 2. T2/T3: the four dispatches, in order

Each seat gets its template with the blanks filled. Different tools for different
seats — the test author must NOT be the coder's model/harness.

| Order | Seat | Template | Give it | It produces |
|---|---|---|---|---|
| 1 | Critic | `prompts/critique.md` | contract section + threat notes + tier | `specs/<feature>.critique.md` |
| 2 | Test author (different harness than coder) | `prompts/acceptance-author.md` | contract + critique findings | `test/acceptance/<phase>/` + manifest, merged as its own PR |
| 3 | Coder(s) | `prompts/implementer.md` | contract + pointer to frozen suite | one T2 implementation or 2–3 independent T3 candidates |
| 4 | Reviewer(s), different family from coder(s) | `prompts/reviewer.md` | the PR/candidates + contract claims + threat notes | T2 verdict or T3 blind ranking + verdicts |

T2 uses one implementation and a different-family review with parallel lenses. **T3
escalates the table:** dispatch 2–3 strongest implementers with identical inputs in
separate worktrees; let the frozen suite score first; blind-rank surviving candidates;
then run two reviewer families with the parallel security/claims/wiring lenses. Graft
runner-up ideas only deliberately, never from memory.

Rules of thumb:
- Don't dispatch step 3 until step 2's PR is merged. The driver checks per-feature
  sequencing; `process-guard` only proves a global manifest exists on base.
- If the critic returns "pending decisions" (SC-9): stop, decide, update the
  contract, re-run. Never code through it.
- If review goes past 3 rounds: stop pushing fixes. Write down what the spec was
  missing (`LESSONS.md`), fix the contract or suite, then continue.

### If a frozen criterion is wrong

Stop implementation. The owner increments the acceptance-criteria version, names the
old version and changed rule IDs, and asks for another review of those rules on a
correction branch. A test author other than the coder then changes only the affected
tests and their saved hashes. Merge that reviewed rule-and-test PR before coding
continues. `process-guard` checks the hashes. Prompts and later review currently check
the reason, version, separate authorship, and approval. See
[`OS.md`](OS.md#correcting-frozen-acceptance-criteria).

For a change that modifies live data, also record the before-and-after evidence listed
in [`POLICY.md`](POLICY.md#changes-to-live-data). This is **not yet a required check in
every repository**. Do not claim that CI enforces it unless the repository really has
that check.

## 3. Where the prompts go, per tool

- **Claude Code**: paste the filled template as the task message (repo CLAUDE.md
  carries the standing block).
- **Codex**: same, as the task prompt; AGENTS.md carries the standing block.
- **OpenCode / GLM**: same, as the session prompt.

The template text is the source of truth — never retype the rules from memory.
If you notice yourself writing a task prompt from scratch, stop and start from the
template; improvised prompts are how stated rules get dropped.

## 4. When something goes wrong anyway

A bug escaped, a review dragged, a gate was skipped:

1. Five lines in `LESSONS.md` (abstract — no identifying details).
2. Decide what it becomes: a guard check, a baseline item, or a new critique
   question. Bump the version of whatever changed.
3. Sweep the new check across repos in one batch.

That's the whole loop. The process gets smarter every time it fails; nothing
depends on anyone remembering.
