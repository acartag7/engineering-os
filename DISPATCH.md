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

Ask one question: **does this touch a trust boundary?** (logins, tokens, tenancy,
redaction, network egress, data writebacks, parsers over untrusted input.)

- No, and it's mechanical (rename, dep bump) → **T0**: just do it. Normal PR + CI.
- No, but behavior changes → **T1**: pipeline is default-on; you may skip stages
  with a `Process-Skip:` trailer (the audit counts skips).
- Yes → **T2**. Parser over untrusted input, or a brand-new boundary → **T3**.
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

Stop the implementation. The contract owner increments the acceptance-criteria
version, names the superseded version and affected invariant IDs, and re-runs critique
for those invariants on a correction branch. The independent acceptance author then
adds only the affected tests + manifest to that same branch without editing the
contract. Merge the reviewed contract+acceptance PR before implementation resumes. The
mechanical freeze is HARD; the semantic/version/authorship checks are **PROMPT +
AUDIT**. See [`OS.md`](OS.md#correcting-frozen-acceptance-criteria).

For production mutations, also fill the runtime-evidence overlay from
[`POLICY.md`](POLICY.md#production-mutation-overlay). It is **NOT YET ENFORCED
fleetwide** and must not be presented as a HARD gate until the target repository wires
it outside the orchestrator.

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
