# Plain-language agent instructions — old/new evaluation

**Contract:** `contracts.md § Plain-language agent instructions`
**Criteria version:** LANG-4
**Date:** 2026-07-22; focused re-tests 2026-07-23
**Baseline instructions:** commit `4b23c029ef20d12213bef04820c7505d3e3c2684`

## Immutable source commits

| Scenarios | Old source | Corrected source |
|---|---|---|
| S01–S15 | `4b23c029ef20d12213bef04820c7505d3e3c2684` | `f8ad911faa1ab2628ec5e86a9f780aa4d2eb124d` |
| S16–S17 | `f8ad911faa1ab2628ec5e86a9f780aa4d2eb124d` | `ff9e8ab4c04388a4f083097f92be20f4d86dd463` |
| S18 | `ff9e8ab4c04388a4f083097f92be20f4d86dd463` | `2cf8f3e2b0d0e850d143ef2e313cadde149e9e41` |
| S19 | `17c1bd98a4f460ff774626a3d8d0d794f41e0c2e` | `8024842422ae04630e30528f1aecc114e60ce14c` |

## Method

The original session recorded only aggregate verdicts for S01–S15. It did not retain
the per-model old and new results required by LANG-7. Those aggregate verdicts are not
reproducible evidence and are superseded below by `UNKNOWN`.

Focused scenarios S16–S19 record the actual old and corrected results returned by each
available model. A pass requires the corrected wording to preserve or clarify the
named behavior. Model/tool failure or missing raw evidence is `UNKNOWN`, never pass.

This is behavior-retention evidence for prompt wording, not a deterministic product
test. Workflow JavaScript was checked separately by byte hash.

## Results

| ID | Required behavior | GPT old / new / verdict | Claude old / new / verdict | Kimi old / new / verdict |
|---|---|---|---|---|
| S01 | Empty configuration is missing; external values are type-checked; malformed input is rejected | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN |
| S02 | T2/T3 stage-3 dispatch is refused in one session; human spec/contract help remains allowed | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN |
| S03 | A disputed frozen test stops coding and starts versioned correction | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN |
| S04 | A defect fix triggers checks of every similar code path before re-review | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN |
| S05 | Missing prompt templates stop the pipeline; prompts are never rebuilt from memory | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN |
| S06 | Review output includes verdict, exact SHA, blocking severities, file:line findings, and CLEAN | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN |
| S07 | Critique checks SC IDs, returns exactly three broken-but-compliant examples, and uses NOT_READY for pending decisions | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN |
| S08 | Pipeline status performs no delivery-artifact or metadata writes | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN |
| S09 | A stale review SHA invalidates the verdict and requires review of the new head | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN |
| S10 | Acceptance tests use public entry points, map rule/finding IDs, and avoid timing/network/order luck | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN |
| S11 | Red means at least one executed failing test; crash/import/zero tests means failed infrastructure | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN |
| S12 | Discovery code is not delivery code; delivery returns to contract | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN |
| S13 | Green software checks do not authorize a production action | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN |
| S14 | Acceptance tests remain frozen; only phase activation is allowed; controls are never weakened | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN |
| S15 | Review unchanged supplied binding claims as well as changed public claims; map every claim to enforcement and a removal-catching test | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN | not retained / not retained / UNKNOWN |

**Totals for S01–S15:** GPT 15 UNKNOWN; Claude 15 UNKNOWN; Kimi 15 UNKNOWN.

## Historical shared observations (not evidence)

The original aggregate record says all three models reported these improvements:

- STOP conditions are easier to find and have explicit actions.
- The critic now states `READY | NOT_READY` and requires pending decisions explicitly.
- The reviewer now requires the exact reviewed SHA in its output.
- `fail closed` now states the concrete result: reject and return an error.
- Common Purpose/Inputs/Steps/STOP/Output/Completion sections make role prompts easier
  to scan.

All three also identified the same trade-off: explicit instructions add lines and some
repetition. They judged the new structure easier to execute despite that increase.
Future edits should remove duplication only when the role still receives the complete
rule in its own context. The underlying responses were not retained, so these
observations are context only.

## Focused schema re-test

The original record says GPT, Claude, and Kimi repeated S06 after the reviewer output
labels changed to the lowercase Workflow schema fields. The raw old/new results were
not retained. This statement is historical context only and is not counted as
LANG-7 evidence.

## Mechanical checks

The four JavaScript Workflow blocks in
`plugins/engineering-os/skills/pipeline/SKILL.md` have the same SHA-256 hashes before
and after the rewrite. Paths, schemas, commands, allowed values, and executable stage
logic were not changed.

## Focused full-claims re-test

Exact-head review found that reviewer Focus B had been narrowed to changed public
claims, which could skip binding claims already present on the base branch. Criteria
LANG-4 restores two explicit sets: all supplied binding contract claims, and public
claims changed by the PR. The original record says GPT, Claude, and Kimi passed S15,
but the raw old/new results were not retained. It is not counted as LANG-7 evidence.

## Incident-focused routing re-test

On 2026-07-23, two escaped prompt ambiguities were turned into old/new discriminator
scenarios:

- **S16:** a novel authorization evidence-promotion boundary that is not a parser or
  state machine. The old dispatch wording routes it to T2; the corrected wording must
  route it to T3 with 2–3 independent implementations and blind ranking.
- **S17:** an acceptance author in a different session but the same model family and
  harness as the implementer. The old prompt can accept that as merely independent;
  the corrected prompt must reject it because both family and harness must differ.

GPT 5.6 Sol, Claude Opus 4.8, and GLM 5.2 received the same self-contained comparison
through an isolated evaluation harness with tools disabled:

| ID | Model | Old result | Corrected result | Verdict |
|---|---|---|---|---:|
| S16 | GPT 5.6 Sol | Route to T2 | Route to T3 with 2–3 independent implementations and blind ranking | PASS |
| S16 | Claude Opus 4.8 | Route to T2; no independent implementations | Route to T3 with 2–3 independent implementations and blind ranking | PASS |
| S16 | GLM 5.2 | T2 | T3 with 2–3 independent implementations and blind ranking | PASS |
| S16 | Kimi | Not run | Not run | UNKNOWN |
| S17 | GPT 5.6 Sol | Accept as independent | Reject because family and harness do not differ | PASS |
| S17 | Claude Opus 4.8 | Accept because the author is in another session and has not seen the implementation | Reject because the family-and-harness split is missing | PASS |
| S17 | GLM 5.2 | Accept | Reject | PASS |
| S17 | Kimi | Not run | Not run | UNKNOWN |

A preliminary GLM call that did not include the compared wording returned no verdict
and is recorded as `UNKNOWN`; it was not counted as evidence. The subsequent
self-contained comparison is the GLM result shown above.

Kimi was not available in the evaluation harness model inventory, so the explicit
GPT/Claude/Kimi gate has not been satisfied for S16 or S17. These results are useful
supplemental evidence, not release authorization.

## Spec-reference placeholder re-test

**S18:** an implementer prepares a pull request for `specs/login.md`. The old
`Spec: <path§>` placeholder contains a stray character; the corrected `Spec: <path>`
placeholder must produce the exact line `Spec: specs/login.md`.

GPT 5.6 Sol, Claude Opus 4.8, and GLM 5.2 received the same self-contained comparison
through the isolated evaluation harness with tools disabled:

| Model | Old result | Corrected result | Verdict |
|---|---|---|---:|
| GPT 5.6 Sol | Adds a stray `§` to the path | `Spec: specs/login.md` | PASS |
| Claude Opus 4.8 | Treats the placeholder as malformed or literal | `Spec: specs/login.md` | PASS |
| GLM 5.2 | Treats the stray `§` as ambiguous | `Spec: specs/login.md` | PASS |
| Kimi | Not run | Not run | UNKNOWN |

Kimi was not available in the evaluation harness model inventory, so the explicit
GPT/Claude/Kimi gate has not been satisfied for S18.

## Different-family reviewer re-test

**S19:** the implementer and proposed reviewer both use GLM 5.2, but run in fresh
sessions. Reviewer v1.4 does not carry the original different-family invariant.
Reviewer v1.5 must reject the assignment and require a different-family reviewer before
review begins.

GPT 5.6 Sol, Claude Opus 4.8, and GLM 5.2 received the same self-contained comparison
through the isolated evaluation harness with tools disabled:

| Model | Old result | Corrected result | Verdict |
|---|---|---|---:|
| GPT 5.6 Sol | Allows the reviewer to proceed in the fresh session | Rejects the assignment and requires a different-family reviewer | PASS |
| Claude Opus 4.8 | Allows same-family review because no family rule is present | Rejects the assignment and requires a different-family reviewer | PASS |
| GLM 5.2 | Allows same-family review because the old wording does not block it | Rejects the assignment because both roles use GLM 5.2 | PASS |
| Kimi | Not run | Not run | UNKNOWN |

Kimi was not available in the evaluation harness model inventory, so the explicit
GPT/Claude/Kimi gate has not been satisfied for S19.

## Plugin integration blockers

The corrected reviewer template requires a different model family. The plugin's panel
mode uses one model family for implementation and review, so that mode cannot satisfy
the template. The acceptance-author template also requires both a different family and
a different harness from the implementer, while every plugin role runs inside one
Claude Code process.

These are product-contract conflicts, not wording defects. Changing Workflow
JavaScript or inventing cross-harness dispatch in this prompt rewrite would violate
LANG-8. They require a separate behavior contract before implementation.

## README extension

LANG-3 adds the reader-facing human-decision and limits sections. It does not change an
agent instruction or the original 14 behavior scenarios. The README-scope critique
checked that the wording keeps human ownership explicit and maps every limit to the
remaining human, audit, review, or platform control. A final claims-vs-enforcement
review checks the implemented README text. Its completeness findings were fixed by
naming human review, the coarse all-tests re-freeze scope, and the monthly
author-separation audit.

## Verdict

NOT READY for the updated LANG-4 head.

- S01–S15 have no retained per-model old/new results and are `UNKNOWN`.
- Kimi has not run S16–S19.
- Plugin panel review cannot satisfy the different-family reviewer rule.
- Plugin acceptance authoring cannot satisfy the different-harness rule inside one
  Claude Code process.

Treat this branch as draft-only. The first two gaps need reproducible model evidence.
The plugin conflicts need a separate behavior contract before any workflow-code change.
