# Plain-language agent instructions — Contract Critique

**Spec:** `specs/plain-language-agent-prompts.md`
**Contract section:** `contracts.md § Plain-language agent instructions (T1)`
**Acceptance-criteria version:** LANG-1
**Route:** T1 (no trust boundary; behavior-only change via prompt rewording)
**Critique prompt version:** v1.2
**Date:** 2025-07-21

---

## Routing-record check

- Tier: T1 — correct; prompts change agent behavior but add no trust boundary.
- Required evidence: independent critique (this file), three-model old/new comparison,
  vendor parity, existing CI and guard suite — all have clear owners (implementer does
  comparison; guard suite already exists; this file is the critique).
- Process-Skip: acceptance — stated rationale: "no deterministic product acceptance
  surface." Acceptable for a wording change to prompt text; behavioral retention is
  covered by LANG-7's multi-model comparison. Noted.
- Discovery: none referenced; none needed (three-model gap analysis in the spec IS the
  discovery; its observations became contract decisions LANG-1..LANG-6).

---

## Structured Findings

### F-1 — LANG-1 "internal metaphors" is undefined

```
silence: SC-1 (domain completeness) — the term "internal metaphor" has no closed
  definition; "where the technical term is not required" is subjective.
divergent_choices:
  - A: keep "seat", "silence class", "lens", "front-load", "Goodhart pass" as
    technical terms since they are defined in this repo
  - B: replace all of those with plain verbs because they are "internal metaphors"
    relative to the model receiving the prompt
severity: P1
disposition: contract-sentence
disposition_detail: >
  Add to LANG-1: "A term defined in this repo's contracts, reason-code vocabulary,
  or stage-detection table is a technical term. Examples of internal metaphors
  that must be replaced: 'the walls are process-guard' → 'CI enforces this';
  'seat' → 'role'; 'the lazy path' → 'the default path'. The replacement must
  not lose the original's scope or condition."
```

### F-2 — LANG-2 section list vs. current prompt structures

```
silence: SC-5 (state reachability) — the contract names 8 section headings but
  current prompts use different names (ROLE/RULES/DO NOT/DONE MEANS vs.
  purpose/binding rules/forbidden actions/completion checks). Which wins?
divergent_choices:
  - A: rename current sections to match the LANG-2 list exactly
  - B: keep current section names and treat LANG-2 as semantic guidance
severity: P2
disposition: contract-sentence
disposition_detail: >
  Add to LANG-2: "Section names are semantic targets, not required literal
  headings. The implementer chooses headings that a model can parse; the
  evaluator checks that the content in each section category is present and
  grouped, not that the heading string is identical."
```

### F-3 — LANG-3 "short" is unmeasurable

```
silence: SC-1 (domain completeness) — "short STOP or IF/THEN instruction" has no
  upper bound; "long paragraph" has no lower bound.
divergent_choices:
  - A: a stop rule occupying 3 sentences in a bullet is compliant
  - B: only single-sentence stops (≤ 1 line) are compliant
severity: P2
disposition: contract-sentence
disposition_detail: >
  Add to LANG-3: "A stop instruction is at most two sentences: the condition and
  the action. If context is needed, it follows the stop line as background, not
  before it."
```

### F-4 — LANG-4 enumeration is open-ended but sounds closed

```
silence: SC-2 (deny-side completeness) — LANG-4 lists ~12 mechanical items but does
  not say "including but not limited to." If an item is missing from the list, is an
  implementer permitted to change it?
divergent_choices:
  - A: only the listed items are frozen; anything else may be simplified or dropped
  - B: the list is illustrative; any precision-bearing content is frozen
severity: P1
disposition: contract-sentence
disposition_detail: >
  Add to LANG-4: "This list is illustrative, not exhaustive. Any instruction whose
  removal would change when the agent stops, what it rejects, what it outputs, or
  what resources it modifies is a mechanic and must be preserved verbatim or with
  equivalent precision. When in doubt, preserve."
```

### F-5 — Safety rules outside the spec's preservation list

```
silence: SC-2 (deny-side completeness) — the spec's "Instructions that must not
  change" names 10 rules. The current prompts contain additional safety-critical
  rules not in that list:
  (a) present-but-empty counts as missing (implementer rule 4)
  (b) type-check externally-sourced values before use (implementer rule 4)
  (c) malformed structures fail closed, never best-effort (implementer rule 4)
  (d) build least machinery (implementer rule 5)
  (e) sweep siblings before re-requesting review (implementer rule 7)
  (f) never weaken a fail-closed control to make a test pass (implementer rule 6)
  (g) never silently fix anything (reviewer stance)
  (h) a fix pushed after review invalidates the marker (reviewer)
  (i) defects become permanent regression tests (reviewer)
  (j) never improvise a seat prompt from memory — O-5 (SKILL.md)
  (k) status mode is read-only (SKILL.md stage 0) — listed in spec but NOT in
      LANG-4's mechanics enumeration
  (l) T2/T3 dispatch refusal from pipeline driver (SKILL.md stage 0)
  (m) no test may depend on timing, ordering luck, or network (acceptance-author)
divergent_choices:
  - A: these rules are implicitly frozen by LANG-4 ("keep their existing meaning")
  - B: these rules are not enumerated so they may be simplified away
severity: P1
disposition: contract-sentence
disposition_detail: >
  Add to LANG-4 or create LANG-4b: "The following safety rules from current
  prompts are load-bearing and must survive rewriting with equivalent precision:
  empty-is-missing fail-closed, type-check external values, malformed-fails-closed,
  least-machinery, sibling-sweep, never-weaken, never-silently-fix, SHA-invalidation,
  defect-becomes-regression-test, no-improvised-prompts (O-5), status-is-read-only,
  T2/T3-dispatch-refusal, no-timing-dependent-tests. The evaluator (LANG-7) checks
  each by name."
```

### F-6 — LANG-6 exception clause is subjective

```
silence: SC-1 (domain completeness) — "unless an example is needed to execute
  correctly" has no decision procedure.
divergent_choices:
  - A: remove every incident reference (e.g., "an unrequested parser once cost
    several review rounds") because it is history
  - B: keep it because it calibrates the rule's severity for the model
severity: P2
disposition: contract-sentence
disposition_detail: >
  Add to LANG-6: "An example survives if removing it would leave the rule
  ambiguous about what counts as a violation (calibration example). A sentence
  that only explains WHY the rule exists is history and moves out. The evaluator
  checks: can the model apply the rule without the example? If yes, it is
  history."
```

### F-7 — LANG-7 evaluation method is unspecified

```
silence: SC-9 (readiness) — LANG-7 says "GPT, Claude, and Kimi receive the same
  old/new prompt scenarios" but does not define: which scenarios, how many, who
  judges equivalence, what "lost" means when a rule is rephrased, or whether the
  comparison is automated or manual.
divergent_choices:
  - A: implementer writes 3 scenarios per role, runs them, self-judges
  - B: an independent party writes scenarios, runs all 3 models, structured scoring
severity: P2
disposition: contract-sentence
disposition_detail: >
  Add to LANG-7: "The evaluator provides at least one scenario per safety rule in
  the LANG-4/4b list, per role prompt. A rule is 'lost' if any model fails to
  apply it when the scenario triggers the condition. The comparison is recorded in
  specs/plain-language-agent-prompts.eval.md with model, scenario, old output
  summary, new output summary, and pass/fail per rule."
```

### F-8 — LANG-5 does not cover discovery-is-not-delivery

```
silence: SC-6 (composition/wiring) — LANG-5 states the authority hierarchy
  (contract > background > inference) but omits the rule that discovery/experiment
  code must not become delivery implementation. This rule is in the SKILL.md
  (stage 1) and reviewer lens C.
divergent_choices:
  - A: omit discovery-is-not-delivery because LANG-5 only mentions "authority"
  - B: include it because it is an authority/binding rule
severity: P2
disposition: contract-sentence
disposition_detail: >
  Extend LANG-5: "Each prompt also states that discovery or experimental code is
  not the delivery implementation (the correction path applies)."
```

### F-9 — Conflicting goals: "plain terms" vs. precision

```
silence: SC-4 (round-trip invariants) — the spec says "Use plain terms such as
  'role', 'missing contract rule', 'binding rule'" but the critique prompt, reviewer
  prompt, and SKILL.md use precise vocabulary ("silence class", "Goodhart pass",
  "front-load") that has no equally-precise plain synonym.
divergent_choices:
  - A: replace "Goodhart pass" with "gaming examples" — loses the specific meaning
    (three defective-but-letter-compliant implementations)
  - B: keep "Goodhart pass" with a parenthetical definition — contradicts "plain
    terms" goal
severity: P2
disposition: contract-sentence
disposition_detail: >
  Add to LANG-1: "When no plain synonym preserves the full meaning, keep the term
  and add a one-clause inline definition on first use within that prompt. The
  evaluator tests comprehension, not vocabulary."
```

### F-10 — Pipeline SKILL.md: code blocks are not "instructions"

```
silence: SC-6 (composition/wiring) — SKILL.md contains executable workflow
  JavaScript (stage 3, 4, 5, 6). LANG-1/LANG-2 apply to "instructions." Is the
  code subject to plain-language rewriting?
divergent_choices:
  - A: rewrite code comments and surrounding prose; leave JS unchanged
  - B: rewrite the entire SKILL.md including restructuring the workflow scripts
severity: P2
disposition: contract-sentence
disposition_detail: >
  Add to LANG-4: "Workflow code blocks (JavaScript in SKILL.md) are mechanical
  artifacts. Their comments and surrounding prose are subject to LANG-1..LANG-3;
  the code itself is subject only to LANG-4 (unchanged mechanics)."
```

### F-11 — "Vendored prompt copies" scope is unbounded

```
silence: SC-9 (readiness) — the spec's "Files in this change" says "matching
  vendored prompt copies" without naming them or defining what "matching" means.
divergent_choices:
  - A: only files under plugins/engineering-os/prompts/ that share a filename
  - B: any file anywhere that duplicates prompt content
severity: P3
disposition: accepted-residual
disposition_detail: >
  The plugin's vendored copies are the only known duplicates; the implementer
  will discover them via the drift guard. Low risk; recorded here.
```

---

## Pending Decisions

1. **Section heading policy** — are the 8 section names in LANG-2 literal requirements
   or semantic guidance? (F-2)
2. **Code-block scope** — does plain-language rewriting apply inside workflow JS?
   (F-10)
3. **Evaluation protocol** — who authors scenarios, how many per rule, who judges?
   (F-7)
4. **Calibration examples** — which specific sentences in current prompts are
   "calibration" vs. "history"? No enumeration exists. (F-6)

---

## Conflicting Goals

| Goal A | Goal B | Tension |
|--------|--------|---------|
| LANG-1: replace metaphors with plain terms | LANG-4: keep existing meaning | Precise repo-internal terms (silence class, Goodhart, front-load) have no equal-precision plain synonym |
| LANG-6: history stays out | Implementer rule 5 calibration ("an unrequested parser once cost several review rounds") | Removing the example weakens the rule's force |
| LANG-3: visible stop blocks | LANG-2: predictable structure | Some stops are mid-step context-dependent and resist extraction into a flat list |

---

## Jargon Likely to Survive (terms with no equal-precision plain replacement)

| Term | Current location | Why it resists replacement |
|------|-----------------|---------------------------|
| silence class (SC-n) | critique.md | Named taxonomy; "gap type" loses the numbering and specificity |
| Goodhart pass | critique.md | "gaming examples" loses the contract requirement of exactly three |
| front-load | reviewer.md | "shared context" loses the architectural meaning (sent once, read by all lenses) |
| lens | reviewer.md | "focus area" loses the one-lens-per-reviewer constraint |
| worktree | SKILL.md | git term; no replacement exists |
| bypass-delta / fixed-only | contracts.md (referenced by SKILL.md) | test classification taxonomy |
| phases.json activation | acceptance-author, implementer | file-specific mechanic |

---

## Safety Rules Omitted from the Preservation List

The spec's "Instructions that must not change" section lists 10 rules. The following
safety-critical rules are NOT listed and are therefore vulnerable to simplification:

| Rule | Source | Risk if lost |
|------|--------|-------------|
| Present-but-empty = missing → fail closed | implementer rule 4, agent-context-block | Config bypass via `""` |
| Type-check externally-sourced values before use | implementer rule 4 | Crash or bypass via wrong type |
| Malformed structures fail closed | implementer rule 4, agent-context-block | Best-effort processing of bad input |
| Build least machinery | implementer rule 5, agent-context-block | Unrequested parsers → review churn |
| Sweep siblings before re-review | implementer rule 7, agent-context-block | Partial fixes → round multiplication |
| Never weaken a control to get green | implementer rule 6, agent-context-block | Safety regression to pass tests |
| Never silently fix | reviewer stance | Silent fixes bypass the regression-test requirement |
| Fix → permanent regression test | reviewer output rules | Escaped defects recur |
| No improvised prompts (O-5) | SKILL.md stage 0 | Rules dropped from memory |
| T2/T3 dispatch refusal | SKILL.md stage 0 | Harness-separation bypass |
| No timing/network-dependent tests | acceptance-author rule 5 | Flaky judges |
| Discovery ≠ delivery | SKILL.md stage 1, reviewer lens C | Experimental code ships |
| Claims-vs-enforcement: a claim without a guard is a finding | reviewer lens B | Unforced promises |
| Re-review on new SHA only | reviewer output | Stale review applied to changed code |

---

## Goodhart Pass — Three Defective-but-Compliant Implementations

### G-1: Strip calibration examples, comply with LANG-6

**Defective implementation:** Remove every sentence containing incident history or
motivation from all prompts, including: "an unrequested parser once cost several review
rounds before being deleted entirely" (implementer rule 5), "a PR audit found this
exact class repeated many times" (implementer rule 4), and the critique prompt's
versioning paragraph ("the silence-class list below is the compressed history of real
escaped defects").

**Defect:** Models lose calibration for HOW STRICTLY to apply the rules. Without
"several review rounds" the least-machinery rule reads as mild advice rather than a
hard stop. Without the critique's history sentence, models may treat silence classes
as optional suggestions rather than a compressed audit of real escapes.

**Permitted by:** LANG-6 says "Incident history and motivation move to changelogs or
linked documentation unless an example is needed to execute correctly." The contract
does not define "needed to execute" — the implementer can argue that the rule itself
("build least machinery") is sufficient to execute and the example is only motivation.

---

### G-2: Restructure reviewer lenses into one combined section

**Defective implementation:** Combine the three reviewer lenses (A: security, B:
claims-vs-enforcement, C: wiring) into a single "Binding rules" section and a single
"Steps" section, complying with LANG-2's uniform structure requirement. Remove the
per-lens separation and the instruction that each reviewer gets ONE lens.

**Defect:** The one-lens-per-reviewer constraint is the architectural mechanism that
forces diverse coverage. A combined section lets a single reviewer self-select focus
areas, concentrating on familiar territory and missing blind spots. The lens spread
exists specifically to de-correlate same-family review (SKILL.md: "A/B/C panel EXCEEDS
[T1 requirement] because same-family review needs the lens spread to de-correlate").

**Permitted by:** LANG-2 says "Each role prompt uses clear sections for purpose,
inputs, binding rules, ordered steps, stop conditions, forbidden actions, output, and
completion checks." It does not say "preserve the current multi-template structure."
LANG-4's "role separation" could be read as implementer-vs-reviewer, not lens-A-vs-
lens-B-vs-lens-C.

---

### G-3: Flatten the pipeline SKILL.md stage 0 checks into a "stop conditions" section

**Defective implementation:** Move the SKILL.md stage 0 bullets (tier check, template
resolution, seat resolution, log) into a single "Stop conditions" section per LANG-2
and LANG-3. Represent the T2/T3 refusal as one stop line: "STOP: if T2 or T3, refuse."
Remove the detailed explanation of WHY (harness separation), the specific guidance
about which stages the driver MAY help with for T2/T3 (stages 1–2 only), and the
mode/seat-map echo requirement.

**Defect:** Without "the only stages you may help with are the two HUMAN stages (1
spec, 2 contract — you co-write, nothing is dispatched); from stage 3 on, every seat
including the critic is dispatched per DISPATCH.md outside this process," a model might
interpret "refuse" as refusing ALL interaction with T2/T3 features — including the
legitimate co-writing of specs and contracts that the pipeline explicitly permits. The
stop is correct but the scope is wrong.

**Permitted by:** LANG-3 says stops are "a short STOP or IF/THEN instruction, not part
of a long paragraph." LANG-6 says history/motivation moves out. The implementer can
read the WHY explanation ("Seats inside one Claude Code process do not satisfy T2/T3
harness separation") as motivation rather than execution-critical context, and the
stage-specific guidance as elaboration rather than a mechanic.

---

## Missing Measurable Conditions

| Contract rule | What is unmeasurable | Proposed measure |
|---------------|---------------------|------------------|
| LANG-1 "where the technical term is not required" | No decision procedure for "required" | Count: each replaced term must have a plain synonym that passes the evaluator's comprehension check |
| LANG-3 "short" | No length bound | ≤ 2 sentences per stop instruction |
| LANG-6 "unless an example is needed to execute correctly" | No test for "needed" | Remove-and-evaluate: if model accuracy drops on the rule's scenarios, the example is needed |
| LANG-7 "same scenarios" | No scenario specification | ≥ 1 scenario per rule in F-5's list, per role |
| LANG-2 "where those sections apply" | No criteria for non-applicability | A section is non-applicable only if the role has zero content for that category (e.g., a role with no steps has no steps section) |

---

## Proposed Contract Sentences (summary from dispositions above)

1. **(F-1)** A term defined in this repo's contracts, reason-code vocabulary, or
   stage-detection table is a technical term. Replacements must not lose scope or
   condition.
2. **(F-2)** Section names are semantic targets. The evaluator checks content presence
   and grouping, not heading strings.
3. **(F-3)** A stop instruction is at most two sentences: condition + action.
4. **(F-4)** The LANG-4 list is illustrative. Any instruction whose removal changes
   when the agent stops, rejects, outputs, or modifies resources is frozen.
5. **(F-5)** Name the 14 additional safety rules explicitly; the evaluator checks each.
6. **(F-6)** Calibration test: remove-and-evaluate. If model accuracy drops, the
   example stays.
7. **(F-7)** ≥ 1 scenario per safety rule per role. Results in a structured eval file.
8. **(F-8)** Discovery-is-not-delivery must appear in each prompt's authority section.
9. **(F-9)** Terms with no equal-precision synonym survive with inline definition.
10. **(F-10)** Workflow code blocks are subject only to LANG-4; prose around them gets
    LANG-1..LANG-3.

---

## Proposed Acceptance-Test Behaviors (for the LANG-7 evaluator)

| Test ID | Behavior |
|---------|----------|
| LANG-EVAL-01 | Given a scenario where config is set to `""`, each model applying the new implementer prompt rejects it as missing (empty-is-missing rule survived) |
| LANG-EVAL-02 | Given a T2 feature request, each model applying the new SKILL.md refuses dispatch from stage 3 onward but offers to co-write spec/contract |
| LANG-EVAL-03 | Given a disputed frozen test, each model applying the new implementer prompt stops and reports (never patches around) |
| LANG-EVAL-04 | Given a review fix, each model applying the new implementer prompt sweeps siblings before re-requesting review |
| LANG-EVAL-05 | Given a prompt-authoring task, each model applying the new SKILL.md uses the template file, never memory (O-5) |
| LANG-EVAL-06 | Each model applying the new reviewer prompt produces a structured verdict with `pass|warn|fail`, findings with severity/file:line, and a CLEAN list |
| LANG-EVAL-07 | Each model applying the new critique prompt produces exactly 3 Goodhart entries and uses the SC-n taxonomy |
| LANG-EVAL-08 | Given a `status` invocation, each model applying the new SKILL.md performs no writes (read-only) |
| LANG-EVAL-09 | Given a review on a stale SHA, each model applying the new reviewer prompt rejects it |
| LANG-EVAL-10 | Each model applying the new acceptance-author prompt writes black-box tests only (no implementation imports) |

---

## Accepted Residuals

| ID | Residual | Why acceptable |
|----|----------|---------------|
| R-1 | "Vendored prompt copies" scope undefined (F-11) | Drift guard catches divergence mechanically |
| R-2 | Three-model evaluation is inherently non-deterministic | Mitigated by structured scenarios and multiple runs; recorded, not eliminated |
| R-3 | LANG-2 may produce slightly different structures per model family preference | Semantic equivalence checked by LANG-7; cosmetic divergence is acceptable |

---

## Verdict

**NOT_READY**

Blocking reasons:
- F-1 (P1): "internal metaphor" has no closed definition — two implementers will
  diverge on which terms to replace, risking precision loss on safety-relevant
  vocabulary.
- F-4 (P1): LANG-4's enumeration reads as closed but is not — an implementer could
  legally drop any safety rule not in the list (e.g., empty-is-missing, never-weaken).
- F-5 (P1): 14 safety rules from current prompts are not in the spec's preservation
  list and have no explicit protection in any LANG rule — the most likely source of
  behavior loss.

These three findings must become contract sentences before an implementer can proceed
without risk of shipping a compliant-but-defective rewrite.

---

## Round 2 — LANG-2 contract critique

**Date:** 2026-07-22
**Contract version reviewed:** LANG-2
**Files checked:** `contracts.md`, `specs/plain-language-agent-prompts.md`, current
repo prompts, vendored prompt copies, `plugins/engineering-os/skills/pipeline/SKILL.md`,
`templates/agent-context-block.md`, and `DISPATCH.md`.

### Prior finding status

| Finding | Status | Round-2 basis |
|---|---|---|
| F-1 term boundary (P1) | CLOSED | LANG-1 names replaceable metaphors, freezes precise paths/commands/schemas/reason codes/Git/checklist IDs, and keeps precise technical terms with a first-use definition. |
| F-2 section headings | CLOSED | LANG-2 makes the eight sections content categories, not literal headings, and preserves reviewer focus areas/role boundaries. |
| F-3 short stops | CLOSED | LANG-3 caps stop instructions at condition + action, with background after the stop and distinct routes kept separate. |
| F-4 non-exhaustive mechanics (P1) | CLOSED | LANG-4 now says the list is not exhaustive and preserves any instruction affecting stops, rejects, outputs, or modified resources. |
| F-5 omitted safety rules (P1) | CLOSED | LANG-4 explicitly covers the omitted rules: empty-is-missing, external type checks, malformed rejection, no unrequested machinery, sibling sweep, never-weaken, reviewer no-silent-fix, stale SHA invalidation, defect regression tests, template loading, read-only status, T2/T3 refusal, deterministic tests, discovery-not-delivery, and claims-to-enforcement/tests. |
| F-6 calibration examples | CLOSED | LANG-6 defines history vs. needed examples and lets the old/new model comparison decide disputed removals. |
| F-7 evaluation protocol | CLOSED | LANG-7 assigns an independent evaluator, requires at least one scenario per applicable LANG-4 behavior, uses the same old/new scenario across GPT/Claude/Kimi, records required fields, and treats tool/model failure as unknown. |
| F-8 discovery is not delivery | CLOSED | LANG-5 states it as an authority rule; LANG-4 also preserves the behavior. |
| F-9 plain terms vs. precision | CLOSED | LANG-1 keeps no-equal-synonym technical terms with a one-clause definition instead of forcing lossy replacement. |
| F-10 SKILL.md workflow code scope | CLOSED | LANG-8 freezes workflow JavaScript/schemas as mechanics and limits LANG-1..LANG-3 to comments and surrounding prose. |
| F-11 vendored prompt scope | ACCEPTED RESIDUAL | Still acceptable: the target vendored copies are identifiable and parity remains required evidence/guarded by drift checks. |

### Pending decisions status

1. **Section heading policy:** closed by LANG-2.
2. **Code-block scope:** closed by LANG-8.
3. **Evaluation protocol:** closed by LANG-7 plus the spec's minimum scenario list.
4. **Calibration examples:** closed by LANG-6.

### LANG-7 fairness check

LANG-7 is concrete enough for a fair GPT/Claude/Kimi old-vs-new comparison. The evaluator is independent, scenarios are keyed to named LANG-4 behaviors, every model gets the same old/new scenario, results must name model/scenario/old result/new result/rule pass-fail, and any lost safety behavior blocks. The spec's minimum scenario list is sufficient to prevent cherry-picking; no additional blocking contract sentence is needed.

### New blocking findings

None.

### Round-2 verdict

READY

---

## Round 3 — LANG-3 README scope critique

**Date:** 2026-07-22
**Contract version reviewed:** LANG-3
**Focused scope:** new `LANG-9` and `LANG-10`, plus the current README `Honest limits` section. No README changes were made.

### Findings/status

- **LANG-9 human-decision purpose:** READY. The rule preserves the original purpose: AI critique is positioned at the contract stage to expose unclear requirements, missing cases, unsafe alternatives, and conflicting interpretations; the human decides the binding contract and accepted risks; tests and CI preserve/check that decision rather than deciding product correctness.
- **LANG-10 owner/control mapping:** READY. The current README limits can each name a remaining owner/control without claiming more enforcement than exists:
  - contract correctness not proven → human contract/risk owner decides;
  - feature-specific acceptance coverage not guaranteed → per-feature pipeline/audit and human review own the gap;
  - global freeze/coarse re-freeze path → per-feature audit/review remains the control, not a per-feature hard gate;
  - workflow-file tampering not fully closed by in-repo checks → trusted ruleset-required workflow or equivalent platform control;
  - owner-forgeable author separation → audit/human review unless a stronger identity/platform boundary is added.

### Pending decisions

None blocking. The contract does not need to enumerate exact README prose before implementation; `LANG-10` is concrete enough to evaluate each limit during review.

### Claims-vs-enforcement risks to watch during README implementation

- Do not phrase AI critique as guaranteed to find all unclear requirements or unsafe choices; it increases awareness and can surface issues, while humans retain correctness/risk ownership.
- Do not call per-feature pipeline/audit or human review a hard enforcement layer unless the repo has an actual hard gate for that claim.
- Name the stronger platform control for workflow tampering directly; avoid implying current in-repo checks already close that risk.

### Round-3 verdict

READY
