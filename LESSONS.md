# Lessons Ledger

Every defect, near-miss, or audit gap becomes an entry here, and every entry becomes
or updates a check (a `BASELINE.md` item, a `process-guard` rule, or a silence class
in [`prompts/critique.md`](prompts/critique.md)). Entries are class-level and
sanitized: no private-repo internals, no third-party names.

Format — five lines: **What** happened, **Where** (class of repo), **Caught by**,
**Class** of defect, **Became** (the check/rule it produced).

---

## L-001 — Green tests laundered a trust-boundary defect <a name="l-001"></a>

- **What:** Four independent model configs implemented the same spec in parallel. The
  weakest shipped a null-input path that promoted an unverified claim to a confirmed
  fact with a staged write — a blacklist predicate where the contract required an
  allowlist. Its self-authored suite (100+ tests) was green; all four configs
  self-reported APPROVE.
- **Where:** internal application, trust-boundary state machine.
- **Caught by:** independent adversarial review (a different model reading the code
  against the spec) — not by any test suite.
- **Class:** insecure default at a trust boundary; self-authored tests cannot indict
  their own implementation; quality divergence traced to spec silence.
- **Became:** the acceptance-split (stages 3–4 of the pipeline), PC-07, PC-08, PC-09,
  PC-10, PC-13, PC-18; critique silence classes: domain completeness, closed positive
  sets, Goodhart simulation.

## L-002 — Round-trip re-parsing widened a permission ceiling <a name="l-002"></a>

- **What:** Space-joined permission-scope claims only round-trip safely if each entry
  is a single token; a composite entry re-split at verification time and could widen a
  granted ceiling (resurrecting prior grants). A sibling input path (deployer-supplied
  catalog) had the same shape and was initially left unvalidated.
- **Where:** OAuth/token layer, security-critical OSS.
- **Caught by:** independent review (P1 finding); hand-written test cases had missed it.
- **Class:** representation/round-trip invariant unstated; sibling instance nearly
  forgotten after the fix.
- **Became:** PC-07, PC-17 (property tests at parser boundaries); critique silence
  classes: round-trip invariants; the sibling-sweep rule in review discipline (OS §5).

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
  a ~3,700-line, unit-heavy suite. All were wiring-level: each component was correct,
  their composition wasn't.
- **Where:** security-critical OSS, entry/startup layer.
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
- **Where:** security-critical OSS, docs/README surface.
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
- **Became:** PC-20, the two-plane rule (OS §4).

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

- **What:** An early pair of sibling libraries (same API, two languages, both
  published to public registries) built five months before this OS: no specs, no
  shared fixtures between the twins, a port written in about seventy minutes that
  changed validation behavior with nothing to detect it, unpinned runtime deps with no
  lockfile on the package that parses untrusted input, and a same-day three-major
  dependency bump.
- **Where:** early published OSS pair (retrospective).
- **Caught by:** fleet harvest audit — kept as the dated "before" evidence.
- **Class:** none of the baseline was innate; every item was learned. This entry is
  the evolution axis the ledger measures against.
- **Became:** validation of PC-05, PC-08, PC-21; the founding-harvest origin note in
  BASELINE.md.

## L-012 — Review used as spec discovery: 17 rounds on one small PR <a name="l-012"></a>

- **What:** A PR audit found the worst PRs took 13–17 review rounds. Almost none of
  it was sloppy code: ~43% of findings were edge cases in a hand-rolled HTML/URL
  parser (each fix revealed the next broken input), ~28% were behavior the contract
  never specified (coding started while the design said "decisions pending" and
  pointed at a file in /tmp), ~24% were missing guards. The review bot's false-positive
  rate was ~0 — the reviewer was fine; the inputs to coding were not. ~93% of all
  findings were preventable before review. Round count tracked the subsystem
  (parsing, redaction), not the diff size: an 8-file PR took 17 rounds while one
  three times larger merged in 3.
- **Where:** two security-critical OSS repos, parser/egress subsystems.
- **Caught by:** PR-history audit (2026-07-09), prompted by the operator noticing the
  review-round burn (and its real cost: a shared review quota).
- **Class:** review verifying → review discovering. Wrong tool chosen at design time;
  contracts shipped to implementers with open decisions.
- **Became:** critique v1.1 (SC-8: no hand-rolled parsers over untrusted input
  without a bounded contract; SC-9: contracts with pending decisions or out-of-repo
  references are not implementable), PC-15 (>3 rounds = process failure, recorded),
  and the review-stance line: review verifies, it never discovers.

## L-013 — The prompt already said it — and the code shipped wrong anyway <a name="l-013"></a>

- **What:** A PR audit in the most process-mature repo found three review findings
  whose rule was stated **verbatim in the implementation prompt** (key identities by
  issuer+subject, enforce PKCE S256, validate the token hash) — and the code violated
  all three. In the same repo, a natural experiment: a large PR whose spec section was
  locked in the contract beforehand merged in **1 review round**; a similar-sized PR
  with a spec gap took **~19**. Two further round-multipliers: fixes that didn't sweep
  sibling code paths (one decision alone consumed 5 rounds as siblings resurfaced),
  and an implementer that **built a parser nobody asked for** and defended it for 6
  rounds before the owner deleted it.
- **Where:** OAuth/identity layer, security-critical OSS.
- **Caught by:** PR-history audit (2026-07-09).
- **Class:** prompts are guidance, not enforcement — even correct, explicit prompts
  get ignored under implementation pressure. Only a red test binds. ~85–90% of the
  audited findings were preventable before review.
- **Became:** confirmation that the acceptance-split is the only reliable carrier of
  stated requirements (a rule the prompt states must ALSO be a frozen test);
  implementer prompt v1.1 (standing fail-closed hygiene checklist — the same
  guard-class mistake repeated ~6× in one PR); sibling-sweep required before
  re-requesting review; SC-8 validated from the opposite direction (unnecessary
  hand-rolled parser, not just a risky one).
