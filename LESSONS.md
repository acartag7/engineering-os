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
- **Where:** an authorization/token layer in a security-critical service.
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
- **Where:** an early project pair (retrospective).
- **Caught by:** fleet harvest audit — kept as the dated "before" evidence.
- **Class:** none of the baseline was innate; every item was learned. This entry is
  the evolution axis the ledger measures against.
- **Became:** validation of PC-05, PC-08, PC-21; the founding-harvest origin note in
  BASELINE.md.

## L-012 — Review used as spec discovery: one small PR, over a dozen rounds <a name="l-012"></a>

- **What:** A PR audit found the worst PRs took well over a dozen review rounds. Almost none of
  it was sloppy code: ~43% of findings were edge cases in a hand-rolled HTML/URL
  parser (each fix revealed the next broken input), ~28% were behavior the contract
  never specified (coding started while the design said "decisions pending" and
  pointed at a file in /tmp), ~24% were missing guards. The review bot's false-positive
  rate was ~0 — the reviewer was fine; the inputs to coding were not. ~93% of all
  findings were preventable before review. Round count tracked the subsystem
  (parsing, redaction), not the diff size: a small PR took the most rounds of all
  while one several times larger merged in a few.
- **Where:** two security-critical projects, parsing and network-egress code.
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
  whose rule was stated **verbatim in the implementation prompt** (how identities
  must be keyed, a mandatory security mode, a required token validation) — and the
  code violated all three. In the same repo, a natural experiment: a large PR whose
  spec section was locked in the contract beforehand merged in **one review round**;
  a comparable PR with a spec gap took **nearly twenty**. Two further round-multipliers: fixes that didn't sweep
  sibling code paths (one decision alone consumed several rounds as siblings resurfaced),
  and an implementer that **built a parser nobody asked for** and defended it for several
  rounds before the owner deleted it.
- **Where:** an identity/login layer in a security-critical service.
- **Caught by:** PR-history audit (2026-07-09).
- **Class:** prompts are guidance, not enforcement — even correct, explicit prompts
  get ignored under implementation pressure. Only a red test binds. ~85–90% of the
  audited findings were preventable before review.
- **Became:** confirmation that the acceptance-split is the only reliable carrier of
  stated requirements (a rule the prompt states must ALSO be a frozen test);
  implementer prompt v1.1 (standing fail-closed hygiene checklist — the same
  guard-class mistake repeated many times in one PR); sibling-sweep required before
  re-requesting review; SC-8 validated from the opposite direction (unnecessary
  hand-rolled parser, not just a risky one).

## L-014 — The freeze-gate shipped a fail-open, and a green suite hid more <a name="l-014"></a>

- **What:** A first hardening pass on the artifact-chain freeze-gate left a fail-open:
  deleting the manifest that *defines* the freeze read as "no suite, pass" — dissolving
  the freeze by removing the file that enforces it. A pinned consumer carried that
  released version. A re-derivation under contract-first discipline then produced a
  guard that passed its own frozen acceptance suite green — while cross-family
  adversarial review reproduced several more exit-0 bypasses the suite never exercised:
  an empty manifest that permanently satisfied the gate with no test; an unlisted
  test-shaped symlink read as intact; a Unicode-normalization collision that silently
  dropped a path; a non-canonical config value that selected an empty scope and
  disabled the freeze.
- **Where:** the shared CI freeze-gate that governs every repo (this OS's own tooling).
- **Caught by:** contract-first critique caught the shipped fail-open *before* code;
  cross-family adversarial review caught the rest *after* a green suite had laundered
  them — the same shape as [[l-001]] (self-passing tests cannot indict their own code).
- **Class:** fail-open at a trust boundary; working-tree state trusted for a freeze
  decision; a green suite is necessary, not sufficient. Every guard input is
  attacker-influenced and must be read from the base tree and hashed from git bytes.
- **Became:** a re-derived guard (base-tree sourcing, git-blob hashing, fail-closed
  config/git/schema/symlink/collision handling, empty-suite rejection) with its own
  frozen acceptance suite carrying a regression row per reproduced bypass; the guard
  now gates its own code via a base-materialized trusted-bootstrap job; strengthens
  PC-08, PC-09, PC-10, PC-23.

## L-015 — Clean test objects hid an unsafe security flag <a name="l-015"></a>

- **What:** A network safety check read a boolean from an ordinary object. The code
  accepted a value inherited from that object's parent as if the caller had supplied
  it. That inherited value could turn on a local-network exception.
- **Where:** an outbound-network boundary in a public security library.
- **Caught by:** a fresh review that changed the *shape* of the input instead of trying
  more values in the same normal object. The path was fixed before it was wired into a
  released flow.
- **Class:** the contract, tests, and earlier reviewers all asked whether the value was
  true or false. None asked where the value came from. Independent reviewers shared
  the same clean-object assumption.
- **Became:** PC-34 and critique question SC-10. Security flags must come from an
  explicitly allowed field source, and the negative tests must cover inherited or
  computed values where the language permits them.

## L-016 — A small fix grew into a new security subsystem <a name="l-016"></a>

- **What:** A bounded fix expanded into a repository-wide rule and a new shared helper.
  Each review round found more problems, mostly in code that the fix itself had added.
  The helper eventually repeated the same unsafe assumption it was meant to prevent.
- **Where:** an incident fix in a public security library.
- **Caught by:** the owner noticing that the diff and finding list grew every round
  instead of converging. The large change was closed without merging; the small fix
  shipped separately.
- **Class:** the task had no finish line. “Fix this known path” had silently become
  “make every object read safe everywhere,” without a contract defining which
  boundaries or behaviors belonged in the rule.
- **Became:** PC-15 and PC-35, the SC-8 scope check, and the R-2 monthly audit. Stop
  after three rounds—or earlier when the change grows every round. Ship the bounded
  incident fix alone. A new shared helper or new guarantee starts with its own contract
  and tests.

## L-017 — Missing review work looked like approval <a name="l-017"></a>

- **What:** One required reviewer could refuse, error, time out, be filtered, or return
  nothing. In the automated flow, that absence could look like “no findings.” The same
  incident also merged while the platform still wanted a review because the owner
  could bypass the normal approval rule.
- **Where:** the review and merge path for a public security project.
- **Caught by:** a manual check of the actual reviewer result and the platform's merge
  state, rather than trusting a green summary.
- **Class:** two gates proved only that the workflow continued, not that review
  happened. Silence is not approval, and a rule an administrator can skip is not a hard
  merge gate.
- **Became:** PC-32, PC-33, and the R-1 monthly audit. Required review applies to
  administrators, and every reviewer must return explicit completion evidence. Any
  refusal, error, timeout, filtering, fallback substitution, or empty result is red.

## L-018 — A clean consolidation silently lost old decisions <a name="l-018"></a>

- **What:** A consolidation replaced several source documents with one cleaner
  document. It read well and passed multiple internal reviews, but comparison against
  the pinned sources showed that required decisions had disappeared or changed.
- **Where:** a cross-project policy and memory consolidation.
- **Caught by:** a late source-to-replacement comparison, not by reviewing the new
  document on its own.
- **Class:** replacement review without parity; reviewers saw a plausible destination
  but never proved that it preserved the source.
- **Became:** PC-36 and critique question SC-11. Pin the source set, map every source
  decision forward, check the replacement backward, and restart when a source moves.

## L-019 — A regression test passed while the bug was still alive <a name="l-019"></a>

- **What:** A test described the reported failure and stayed green, but it exercised a
  nearby safe path instead of the broken one. The same test also passed on the old
  code.
- **Where:** an internal application at a security boundary.
- **Caught by:** running the claimed regression against the pinned broken revision.
- **Class:** tautological regression evidence; a green test proved nothing changed.
- **Became:** PC-37 and the implementer/reviewer counterfactual check. The regression
  must go red on the broken revision or with the fix reverted, then green with the fix.

## L-020 — Deleted code remained a shipped startup command <a name="l-020"></a>

- **What:** A source file was removed after its replacement landed, but a container
  startup command still named the deleted file. Code review and tests passed; the
  shipped container would have failed at startup.
- **Where:** a service with library, container, and deployment surfaces.
- **Caught by:** a whole-repository consumer search followed by reading the replacement
  and checking the packaged entry point.
- **Class:** deletion reviewed only inside the source tree; operational consumers were
  treated as unrelated.
- **Became:** PC-38 and the deletion/rename sweep in the implementer and reviewer
  prompts. Search calls, types, strings, dynamic imports, re-exports, barrels, test
  mocks, packages, CI, containers, deploy files, examples, and operations before
  removal.

## L-021 — Green flow returned an unusable result <a name="l-021"></a>

- **What:** A live flow returned a success status and plausible-looking content, but
  the content was an error page or unrelated response. Elsewhere, fixture-backed tests
  hid request-method and timeout failures that appeared only on the real network path.
- **Where:** public tools that fetch or display outside data.
- **Caught by:** running the exact candidate build with a named real input and reading
  the user-visible result.
- **Class:** ceremonial green; status, schema, mocks, and fixtures proved the pipeline
  moved, not that the user received value.
- **Became:** a stronger PC-16 plus acceptance-author and reviewer checks for the exact
  candidate, shipped entry point, named input, and asserted visible result.

## L-022 — The security proof leaked its own test secret <a name="l-022"></a>

- **What:** A proof package claimed sensitive text was absent from product output, but
  one submitted evidence file contained the planted test value in plain text.
- **Where:** a security verification bundle.
- **Caught by:** a literal scan of the staged proof files.
- **Class:** evidence treated as outside the security boundary; the proof contradicted
  the guarantee it was meant to demonstrate.
- **Became:** PC-39 and the staged-proof scan in the implementer and reviewer prompts.
  Synthetic sentinels are handled like secrets in submitted evidence; real credentials
  are rotated if exposed.

## L-023 — An evaluation graded itself <a name="l-023"></a>

- **What:** A comparison used labels derived from the same signal it was scoring, so
  the result mostly measured agreement with itself. A replacement method also lacked
  enough independent checking to support the product decision being made.
- **Where:** model and workflow evaluations used for product choices.
- **Caught by:** rebuilding the ground truth from independent evidence and reviewing
  the evaluation method, not just its result table.
- **Class:** circular ground truth and decision claims stronger than the evidence.
- **Became:** PC-40 and critique question SC-12. Decision-grade evaluations need
  independent labels, provenance, a pre-stated decision rule, and judge calibration;
  weaker results are labeled directional.

## L-024 — A fresh review received stale evidence <a name="l-024"></a>

- **What:** A review workflow built its evidence packet once. After a fixer pushed a
  new commit, the next reviewer received the new commit ID with the old visible-result
  and consumer-map evidence.
- **Where:** a Layer-2 review pipeline in a public process repository.
- **Caught by:** the final permitted review round, after the first plumbing fix looked
  complete and passed its checks.
- **Class:** evidence bound to a mutable workflow invocation instead of the immutable
  head and base that the reviewer actually judged.
- **Became:** PC-41, plugin contract R9, reviewer prompt v1.3, and the non-frozen
  pipeline regression. Rebuild evidence for every reviewed head/base pair and make a
  move on either side stale.
