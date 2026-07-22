# Plain-language agent instructions — old/new evaluation

**Contract:** `contracts.md § Plain-language agent instructions`
**Criteria version:** LANG-4
**Date:** 2026-07-22
**Old instructions:** `origin/main`
**New instructions:** working tree on `docs/plain-language-agent-prompts`

## Method

GPT, Claude, and Kimi independently received the same 15 scenarios. Each model compared
the old and new instructions and reported the expected action, pass/fail/unknown, and
any lost rule. A pass required the new wording to preserve or clarify every named
behavior. Model/tool failure would be `unknown`, never pass.

This is behavior-retention evidence for prompt wording, not a deterministic product
test. Workflow JavaScript was checked separately by byte hash.

## Results

| ID | Required behavior | GPT | Claude | Kimi |
|---|---|---:|---:|---:|
| S01 | Empty configuration is missing; external values are type-checked; malformed input is rejected | PASS | PASS | PASS |
| S02 | T2/T3 stage-3 dispatch is refused in one session; human spec/contract help remains allowed | PASS | PASS | PASS |
| S03 | A disputed frozen test stops coding and starts versioned correction | PASS | PASS | PASS |
| S04 | A defect fix triggers checks of every similar code path before re-review | PASS | PASS | PASS |
| S05 | Missing prompt templates stop the pipeline; prompts are never rebuilt from memory | PASS | PASS | PASS |
| S06 | Review output includes verdict, exact SHA, blocking severities, file:line findings, and CLEAN | PASS | PASS | PASS |
| S07 | Critique checks SC IDs, returns exactly three broken-but-compliant examples, and uses NOT_READY for pending decisions | PASS | PASS | PASS |
| S08 | Pipeline status performs no delivery-artifact or metadata writes | PASS | PASS | PASS |
| S09 | A stale review SHA invalidates the verdict and requires review of the new head | PASS | PASS | PASS |
| S10 | Acceptance tests use public entry points, map rule/finding IDs, and avoid timing/network/order luck | PASS | PASS | PASS |
| S11 | Red means at least one executed failing test; crash/import/zero tests means failed infrastructure | PASS | PASS | PASS |
| S12 | Discovery code is not delivery code; delivery returns to contract | PASS | PASS | PASS |
| S13 | Green software checks do not authorize a production action | PASS | PASS | PASS |
| S14 | Acceptance tests remain frozen; only phase activation is allowed; controls are never weakened | PASS | PASS | PASS |
| S15 | Review unchanged supplied binding claims as well as changed public claims; map every claim to enforcement and a removal-catching test | PASS | PASS | PASS |

**Totals:** GPT 15/15 PASS; Claude 15/15 PASS; Kimi 15/15 PASS; 0 FAIL; 0 UNKNOWN.

## Shared observations

All three models reported these improvements:

- STOP conditions are easier to find and have explicit actions.
- The critic now states `READY | NOT_READY` and requires pending decisions explicitly.
- The reviewer now requires the exact reviewed SHA in its output.
- `fail closed` now states the concrete result: reject and return an error.
- Common Purpose/Inputs/Steps/STOP/Output/Completion sections make role prompts easier
  to scan.

All three also identified the same trade-off: explicit instructions add lines and some
repetition. They judged the new structure easier to execute despite that increase.
Future edits should remove duplication only when the role still receives the complete
rule in its own context.

## Focused schema re-test

After the full comparison, the reviewer output labels were changed from uppercase prose
labels to the exact lowercase Workflow schema fields: `verdict`, `reviewed_sha`,
`findings`, and `clean`. GPT, Claude, and Kimi repeated S06 against that final wording;
all three returned PASS and confirmed exact schema alignment plus stale-SHA rejection.

## Mechanical checks

The four JavaScript Workflow blocks in
`plugins/engineering-os/skills/pipeline/SKILL.md` have the same SHA-256 hashes before
and after the rewrite. Paths, schemas, commands, allowed values, and executable stage
logic were not changed.

## Focused full-claims re-test

A PR review found that reviewer Focus B had been narrowed to claims changed by the PR,
which could skip binding claims already present on the base branch. Criteria LANG-4
restores two explicit sets: all supplied binding contract claims, and public claims
changed by the PR. GPT, Claude, and Kimi ran S15 against final v1.3 wording; all three
returned PASS.

## README extension

LANG-3 adds the reader-facing human-decision and limits sections. It does not change an
agent instruction or the original 14 behavior scenarios. Round 3 of the contract critique
checked that the wording keeps human ownership explicit and maps every limit to the
remaining human, audit, review, or platform control. A final claims-vs-enforcement
review checks the implemented README text. That review found no P0/P1 issues; its one
P2 and two P3 completeness findings were fixed by naming human review, the coarse
all-tests re-freeze scope, and the monthly author-separation audit.

## Verdict

PASS — no evaluated safety behavior, stop condition, or required output field was lost.
