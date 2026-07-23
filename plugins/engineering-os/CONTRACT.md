# Plugin contract — engineering-os `/pipeline`

Status: v1.1 · 2026-07-24 · written AFTER the founding critique (process
failure recorded: the plugin was built before its contract; this document
encodes what that review discovered so the next review verifies).

## What the plugin is

The engineering-os pipeline as an installable Claude Code plugin: one driver
skill (`/pipeline`), nine seat agents (five routed, four eos-* panel), and — because an installed plugin must be
self-contained — vendored copies of the prompt templates and the manifest
generator. Layer-2 advisory throughout: process-guard CI + branch protection
remain the only walls, and every prose claim in the plugin must be honest
about that.

## Requirements (each traces to a confirmed finding cluster)

R1 — **Self-contained install.** The plugin ships `prompts/` (vendored copies
of the repo templates, with source SHA noted) and `scripts/generate-manifest.mjs`
(vendored from process-guard). The skill resolves templates plugin-relative
first, repo-relative second. A marketplace.json at repo root makes
`/plugin install` real. [installability P1s]

R2 — **Both modes work in every stage.** Seat names are never hardcoded in
workflow scripts; the skill resolves the full seat map (critic, author,
implementer, reviewers, fixer) once, passes it via `args.seats`, and panel
mode maps every seat to its `eos-*` fallback — including fix rounds. [panel P1s]

R3 — **Schemas are derived from the templates, verbatim.** Reviewer verdicts:
`pass | warn | fail` (+ `CLEAN` list; P1/P2 block, P3 may ship recorded — a
`warn` with zero P1/P2 passes the gate with a ledger note). Critique
dispositions: `contract-sentence | acceptance-test | accepted-residual`, plus
the mandatory Goodhart entries. No invented enums. [schema P1s]

R4 — **The contract stage exists.** Stage detection includes the `contracts.md`
section (OS.md step 2) between spec and critique; the critic, author, and
implementer receive the CONTRACT section (plus threat rows for T2+), never the
raw spec. [contract-stage P1]

R5 — **Per-feature artifacts.** Stage detection keys tests on the FEATURE's
test IDs present in the manifest on base (not "a manifest exists"); critique
completeness = the critique file's verdict line is READY (not file existence);
review markers embed the reviewed SHA and are validated against the PR head at
detection time. `git ls-tree -r origin/<base>` (with `-r`, fetch first). [detection P1s]

R6 — **Honest prose.** No claim of tool-enforced write scopes (scope is
checked by diff after the fact — say exactly that). Worktree isolation
isolates WRITES and branch state, not reads. T2/T3: the skill refuses with a
pointer to DISPATCH.md (single-harness seats do not satisfy T2/T3 separation);
`--force-t2` does not exist. Tier question is stage-0, recorded in the log
line. [overclaim P1s]

R7 — **Workflow-mechanics fixes.** Post-seat verification steps run in the
main checkout against the pushed branch (never assume access to another
agent's pruned worktree); fix rounds inherit worktree isolation; `dedupe`
keys on (file, normalized title); a `fail` verdict with zero P1/P2 findings is
surfaced as a contradiction, not an empty fix round; `reviewer-lost` re-runs
once then fails closed; panel lenses = the template's A/B/C (+ per-tier count
from POLICY.md), not an invented taxonomy. [mechanics P2s]

R8 — **Consistency sweep.** Stage numbering matches OS.md; agent descriptions
name the right stages and carry no `model-gateway:` references; plugin.json
describes the actual surface; the skill's own args contract (every `args.*`
field) is documented in one table. [advisory cluster]

R9 — **Review evidence reaches the reviewer.** Stage 6 collects a non-empty
structured packet containing routing and claims, threat rows, acceptance coverage,
the named user-visible proof, replacement-parity maps, and deletion/rename consumers.
An inapplicable field says why; it is never silently absent. The workflow injects the
current head SHA and the full packet into every lens on every round, and missing
evidence stops review before dispatch. [review-front-load P2]

## Out of scope (recorded)

T2/T3 orchestration (refused, not half-supported), cross-harness dispatch,
process-guard hardening (separate T2 slice — see LESSONS drafts), automatic
models.yaml → agent-frontmatter generation (follow-up in the gateway repo;
until then the mirror-by-hand note stays).
