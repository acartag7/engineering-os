# Lessons Ledger

Every defect, near-miss, or audit gap becomes an entry here, and every entry becomes
or updates a check (a `BASELINE.md` item, a `process-guard` rule, or a silence class
in [`prompts/critique.md`](prompts/critique.md)). Entries are class-level and
sanitized: no private-repo internals, no third-party names.

Format — five lines: **What** happened, **Where** (class of repo), **Caught by**,
**Class** of defect, **Became** (the check/rule it produced).

---

## L-001 — Green tests laundered a trust-boundary defect <a name="l-001"></a>

- **What:** Parallel implementations of the same spec all reported success. One still
  shipped a malformed-input path that promoted an unverified claim to a confirmed
  fact because a deny list was used where the contract required an allowlist. Its
  self-authored suite was green.
- **Where:** internal application, trust-boundary state machine.
- **Caught by:** independent adversarial review (a different model reading the code
  against the spec) — not by any test suite.
- **Class:** insecure default at a trust boundary; self-authored tests cannot indict
  their own implementation; quality divergence traced to spec silence.
- **Became:** PC-07 through PC-10, PC-13, PC-18; a fresh critic before code; regression
  proof; and an exact-head reviewer independent from the implementer.

## L-002 — Round-trip re-parsing widened a permission ceiling <a name="l-002"></a>

- **What:** Space-joined permission-scope claims only round-trip safely if each entry
  is a single token; a composite entry re-split at verification time and could widen a
  granted ceiling (resurrecting prior grants). A sibling input path (deployer-supplied
  catalog) had the same shape and was initially left unvalidated.
- **Where:** an authorization/token layer in a security-critical service.
- **Caught by:** independent review (P1 finding); hand-written test cases had missed it.
- **Class:** representation/round-trip invariant unstated; sibling instance nearly
  forgotten after the fix.
- **Became:** PC-07, PC-17 (property tests at parser boundaries); critique silence
  classes: round-trip invariants; the sibling-sweep rule in review discipline.

## L-003 — Secrets survive in git history after the code is fixed <a name="l-003"></a>

- **What:** Redaction/secret-hygiene guarantees can hold in HEAD while the secret
  remains reachable in history; a planted-secret corpus plus a history-scanning test
  made the guarantee real and keeps it real.
- **Where:** transcript-handling tool.
- **Caught by:** deliberate adversarial self-test design (trust-gate corpus).
- **Class:** guarantee scoped to the wrong surface (working tree vs. full history).
- **Became:** PC-01 — portable to every repo; one of the two cheapest
  highest-value checks in the entire baseline.

## L-004 — Wiring bugs shipped past green unit tests <a name="l-004"></a>

- **What:** Several defects — an auth branch that never created its state directory,
  startup routed to the wrong flow, a config value silently dropped — shipped through
  a large, unit-heavy suite. All were wiring-level: each component was correct,
  their composition wasn't.
- **Where:** a security-critical service, startup and wiring layer.
- **Caught by:** independent review and human inspection; later closed with real
  end-to-end integration tests (full flow through the real entry point, real spawn).
- **Class:** integration depth; unit tests cannot see composition.
- **Became:** PC-11, PC-16; critique silence class: composition/wiring.

## L-005 — Documentation claims drifted from enforcement, twice <a name="l-005"></a>

- **What:** Deployer-facing docs shipped guarantee sentences with no enforcing code
  (false preconditions, success-path-only recipes). The class was flagged, fixed — and
  recurred in the same repo one release later. Root cause of the survivor: reviewers
  were scoped to code defects and never handed the claims to check, so reviews found
  wrong code but not missing code.
- **Where:** a security-critical project's user-facing docs.
- **Caught by:** independent review, second time only via an explicit claims pass.
- **Class:** docs are security surface; absences only surface in invariant-driven
  review; prose lessons decay.
- **Became:** PC-04 (enforce-or-don't-write + guarantee-verb grep), PC-14 (review
  front-load), PC-15 (round ceiling); critique silence class: deny-side completeness.

## L-006 — Green because it skipped <a name="l-006"></a>

- **What:** Env-gated test suites (service containers, real browser) can silently
  skip when the environment is missing and report green. Separately, a CI guard keyed
  on the ambient `CI` variable instead of an explicit opt-in broke an unrelated
  release pipeline that ran tests without services.
- **Where:** two repos independently.
- **Caught by:** design review in one; a failed release run in the other.
- **Class:** silent skip = false green; guards keyed on ambient environment.
- **Became:** PC-02 (assert-the-suite-ran, explicit opt-in variables) — the second of
  the two cheapest portable checks.

## L-007 — Verification docs described a harness that didn't exist <a name="l-007"></a>

- **What:** A verification design doc listed nine harness helpers; two existed. The
  doc admitted "intended design" in its status section, but nothing distinguished
  aspiration from reality at the point of reading — in a repo whose own rules forbid
  docs ahead of implementation.
- **Where:** the most process-mature repo in the fleet — which is the point.
- **Caught by:** cross-repo audit (this OS's founding audit).
- **Class:** aspirational drift; prose has no enforcement layer.
- **Became:** PC-19; the OS drain rule (every rule tagged with its enforcement layer;
  "not yet enforced" is an explicit state, not an omission).

## L-008 — Lessons never propagated across repos <a name="l-008"></a>

- **What:** The founding audit found every repo had independently evolved one
  gold-standard practice the others lacked — threat-model gates here, history-lint
  there, claims-vs-enforcement elsewhere. No lesson had ever traveled. Process parity
  was being maintained by memory, violating the fleet's own "parity by fixture, not by
  memory" rule.
- **Where:** the whole fleet.
- **Caught by:** cross-repo audit.
- **Class:** propagation failure; per-repo process evolution without a shared baseline.
- **Became:** this repository — the baseline, the ledger, the shared guard action, the
  monthly audit, PC-12.

## L-009 — The orchestrator held enforcement state and couldn't be trusted with it <a name="l-009"></a>

- **What:** An agent-dispatching factory kept enforcement-adjacent responsibilities
  (evidence records, approval state) inside the same runtime that dispatched the
  agents. Its evidence writes were non-transactional; its dispatcher and queue could
  disagree after a denial; agents could reach the factory's own database from their
  worktrees; the host environment leaked into agent processes.
- **Where:** internal orchestration layer.
- **Caught by:** dogfooding incidents + the founding audit; resolved by decision to
  rebuild with orchestration and enforcement as separate planes.
- **Class:** enforcement inside an LLM-driven system is not enforcement.
- **Became:** PC-20 and OS principle 2, which keeps enforcement outside the agent
  runner.

## L-010 — Shared fixture-corpus pins diverged across consumers <a name="l-010"></a>

- **What:** Three SDKs enforce cross-implementation parity via one shared fixture
  corpus, each CI pinning the corpus by commit. The pins drifted: the reference SDK
  pinned one commit, the other two a different one — so "all parity checks green"
  proved agreement against different corpora. Separately, one SDK's parity job ran
  only a subset of fixture classes under the same job name as the full run.
- **Where:** multi-SDK product fleet — the repos where "parity by fixture" was invented.
- **Caught by:** fleet harvest audit (2026-07-09).
- **Class:** the parity mechanism itself had no conformance check; job names implied
  coverage they didn't deliver.
- **Became:** PC-21 — gates must verify their own inputs (corpus version consistency,
  coverage breadth, atomic pin bumps).

## L-011 — The before-picture: twin libraries, parity by memory <a name="l-011"></a>

- **What:** An early pair of sibling libraries shared an interface but not a contract
  or fixture set. A rushed port changed validation behavior with nothing to detect it.
  The package that parsed untrusted input also had unpinned runtime dependencies and
  no lockfile, followed by a risky same-day dependency jump.
- **Where:** an early project pair (retrospective).
- **Caught by:** fleet harvest audit — kept as the dated "before" evidence.
- **Class:** none of the baseline was innate; every item was learned. This entry is
  the evolution axis the ledger measures against.
- **Became:** validation of PC-05, PC-08, PC-21; the founding-harvest origin note in
  BASELINE.md.

## L-012 — Review was used as spec discovery <a name="l-012"></a>

- **What:** A pull-request audit found repeated review rounds were discovering parser
  edge cases, contract decisions that remained open, and missing guards. The reviewer
  was doing design work that should have finished before coding. Small changes could
  cost more review than larger changes when the subsystem and contract were harder.
- **Where:** security-critical parsing and network-boundary work.
- **Caught by:** pull-request history audit after the owner noticed review capacity
  being consumed without convergence.
- **Class:** review verifying → review discovering. Wrong tool chosen at design time;
  contracts shipped to implementers with open decisions.
- **Became:** critique v1.1 (SC-8: no hand-rolled parsers over untrusted input
  without a bounded contract; SC-9: contracts with pending decisions or out-of-repo
  references are not implementable), PC-15 (continuing after the configured final
  review round is a recorded process failure), and the review-stance line: review
  verifies, it never discovers.

## L-013 — The prompt said it and the code still shipped wrong <a name="l-013"></a>

- **What:** A pull-request audit found code violating security rules that were already
  explicit in its implementation prompt. Closed contracts converged quickly; contracts
  with gaps caused repeated review. Missing sibling sweeps and an unnecessary parser
  made the cycle worse.
- **Where:** an identity boundary in a security-critical service.
- **Caught by:** pull-request history audit.
- **Class:** prompts are guidance, not enforcement — even correct, explicit prompts
  get ignored under implementation pressure. Only a failing test binds the rule.
- **Became:** confirmation that prompt text is advisory and a required rule needs a
  failing test or other repository check; the implementer fail-closed checklist;
  sibling sweeps before re-review; and SC-8 against unnecessary hand-written parsers.

## L-014 — The freeze-gate shipped a fail-open, and a green suite hid more <a name="l-014"></a>

- **What:** A shared test-freeze gate treated a missing definition as no suite and
  passed, so removing the thing that enforced the freeze could disable it. A later
  green suite still missed related malformed-tree and configuration paths that could
  weaken the decision.
- **Where:** shared CI guard tooling.
- **Caught by:** contract-first critique found the shipped class; independent
  adversarial review found siblings after the suite was green.
- **Class:** fail-open at a trust boundary; change-controlled state was trusted from
  the wrong revision; a self-passing suite could not prove its own completeness.
- **Became:** a re-derived guard (base-tree sourcing, git-blob hashing, fail-closed
  config/git/schema/symlink/collision handling, empty-suite rejection) with its own
  frozen acceptance suite carrying a regression row per reproduced bypass; the guard
  now gates its own code via a base-materialized trusted-bootstrap job; strengthens
  PC-08, PC-09, PC-10, PC-23.

## L-015 — The safety process became the delivery failure <a name="l-015"></a>

- **What:** A security-sensitive change was run through oversized tasks, a mandatory
  separately authored frozen suite, repeated review, and multi-model comparison. The
  process consumed the owner's attention and review capacity while required stage
  artifacts were absent and lower-level checks still reported green. The process
  mechanics became more visible than whether one small user-facing change worked.
- **Where:** a security-critical library and the shared process repository that was
  meant to govern it.
- **Caught by:** the solo owner auditing the complete delivery history after the work
  failed as a usable process, not by the process's own stop rules.
- **Class:** oversized work plus manual ceremony; advisory steps presented as a
  pipeline; language- and directory-specific assumptions treated as universal.
- **Became:** one bounded slice under a configured basic, standard, or strict profile;
  a fresh critic and reviewer where standard or strict requires them; one implementer
  writing code and tests; one repository-owned language-neutral verify command; a
  stop at the configured final review round, with three as the maximum; optional
  independent tests where routing or configured coverage requires them; and
  `process-guard` moved from default onboarding to an explicit optional tool. Updates
  PC-08 through PC-15.

## L-016 — A costly safety rule created its own bypass <a name="l-016"></a>

- **What:** A frozen contract was useful, but even a small amendment required a
  separate ceremony. Work routed around it. In another form of the same failure, a
  soft file-length signal was treated as a hard target and produced compressed lines
  and mechanical file splits that were harder to review than the original code.
- **Where:** shared delivery rules used across security-sensitive repositories.
- **Caught by:** fleet audit and owner review of the code produced under the rules.
- **Class:** a proxy measure became more important than the safety outcome; the safe
  path cost more than the bypass.
- **Became:** a one-pull-request amendment lane for small frozen-contract changes,
  frozen tests limited to externally visible behavior, and an explicit anti-code-golf
  review rule; strengthens PC-08.

## L-017 — Trust rules existed in prose but not at the boundary <a name="l-017"></a>

- **What:** A fleet audit found duplicated trust-boundary metadata ambiguity without a
  standing rejection test, error reason codes that could accept arbitrary strings,
  static checks missing from some required verification paths, and security promises
  that did not name the test proving them.
- **Where:** several public and security-sensitive project boundaries.
- **Caught by:** a cross-project source and test audit.
- **Class:** advisory security rules without a local mechanical rejection.
- **Became:** language-appropriate static checks in `verify`, duplicate-metadata
  rejection tests, closed error-code types, and test-backed security claims; adds
  PC-32 through PC-34 and strengthens PC-04.

## L-018 — The owner could not re-orient from the repository <a name="l-018"></a>

- **What:** Project documentation explained individual commands and features, but no
  short artifact showed why a project exists, how one real action crosses its files,
  which areas are sharp, and what milestone comes next. That understanding decayed
  between work sessions.
- **Where:** the governed project fleet.
- **Caught by:** owner review during a fleet audit.
- **Class:** repository knowledge depended on memory and scattered documents.
- **Became:** the root `BRIEF.md` template, onboarding step, reviewer check, and
  monthly freshness audit; adds PC-35.

## L-019 — The process was fixed when the projects and teams were not <a name="l-019"></a>

- **What:** The written workflow assumed one agent-runner shape and one fixed set of
  roles. A person onboarding a different language or working without multi-agent
  seats had to translate the process by hand and could not see the cost or protection
  changed by each choice.
- **Where:** shared repository onboarding and delivery guidance.
- **Caught by:** owner review before onboarding a new language and by an independent
  test-author pass over the proposed replacement.
- **Class:** hidden process defaults; discoverability and configurability were treated
  as documentation problems instead of part of the workflow.
- **Became:** an inference-driven Engineering OS skill, validated project
  configuration, basic/standard/strict profiles with non-bypassable risk floors,
  provider-neutral independent roles, strict pre-implementation tests, and a
  two-phase migration path; adds PC-36 through PC-38 and updates PC-13.

## L-020 — Green checks hid unread review findings <a name="l-020"></a>

- **What:** A change was treated as ready after repository checks and an independent
  review passed, while actionable inline review feedback was still unread. The status
  check looked only at headline results and did not fetch the complete thread state.
- **Where:** shared public delivery workflow.
- **Caught by:** owner follow-up after the readiness claim.
- **Class:** incomplete review inventory presented as complete evidence.
- **Became:** current-head paginated thread checks after every push and before readiness,
  a reviewer prompt that names unresolved actionable threads, and PC-39.
