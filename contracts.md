# Contracts

## Solo, language-neutral workflow (T2)

**Routing record**

- **Route:** T2 — changes the process used to review security-sensitive work and the
  CI contract used to onboard repositories.
- **Reason:** replace a TypeScript-shaped, freeze-first workflow with one bounded
  solo-owner path and a repository-owned language-neutral verify command.
- **Required evidence:** `specs/solo-language-neutral-workflow.md`, process-policy
  tests, real Go fixture, optional guard suite, full-diff review, exact-head Fable 5
  review.
- **Evidence links:** filled in the replacement pull request.

**Normative invariants**

- **SLW-1 through SLW-19** are binding as written in
  `specs/solo-language-neutral-workflow.md`.
- CES-9, CES-10, and CES-23 supersede SLW-3's former fixed-profile requirement. The
  effective configurable profile now decides whether contract and critique are
  required.
- CES-11 supersedes SLW-5: strict T2/T3 work requires an independent test author
  before implementation; the old optional challenger wording no longer governs.
- The repository `verify` check is HARD when branch protection requires it.
- Slice size, work-in-progress, round-three stop, plain language, independent-test
  routing, and exact-head review are PROMPT + AUDIT until a repository adds
  mechanical checks.
- `process-guard` remains optional and retains its own T2 contract below.

**Supporting rationale (non-normative)**

The normal path optimizes the scarce resource: one owner's attention. Independent
judgment remains, but default panels, competing implementations, frozen-suite
ceremony, and language-specific paths do not.

## Configurable Engineering OS skill (T2)

**Routing record**

- **Route:** T2 — the skill recommends and records security-sensitive workflow rules.
- **Contract:** `specs/configurable-engineering-os-skill.md`.
- **Required evidence:** the complete evidence list in
  `specs/configurable-engineering-os-skill.md`; this section does not narrow it.

**Normative invariants**

- **CES-1 through CES-32**, including the lettered sibling rules, are binding as
  written in the contract.
- The skill asks and explains; it does not enforce merges.
- Repository verification, CI, and branch protection remain the hard walls.
- Configuration may increase strictness but cannot lower a route's safety floor.
- Configuration validation is HARD when its validator runs in required CI.
- Question flow, recommendation honesty, role independence, safe-write behavior,
  migration sequencing, status behavior, plain language, and exact-head blocking are
  PROMPT + AUDIT until a repository adds mechanical enforcement.

## process-guard hardening (T2)

Origin: a rushed hardening attempt was found by independent review to leave several
fail-open paths. This contract governs the re-derived fix. Repeated critique found
weak test proof, unsafe parsing and file handling, incomplete recovery paths, and an
unclear result vocabulary. This is the reviewed contract that folds those classes in.

`process-guard` gates only repositories that explicitly opt into hash-frozen tests.
For those repositories, the **acceptance suite is the executable contract**; this
prose pins the model, mechanics, reason-code vocabulary, and test classification. The
pre-fix guard is the reviewed base version of `process-guard/scripts/check.mjs`;
"pre-fix" always means that version.

---

### D0 — Decision A (refined): the freeze boundary is a FIXED basename predicate

The freeze covers files under the acceptance directory whose **basename** matches a
**fixed, built-in predicate** — NOT a configurable glob (a glob needs a parser over
untrusted filenames → violates SC-8 and zero-dep; a *configurable* boundary is itself
a bypass — a PR points its workflow at a no-match pattern and unfreezes everything).

- **Predicate.** Frozen iff `nfc(basename)` ends with one of a fixed suffix set:
  `.test.mjs .test.js .test.cjs .test.ts .test.mts .test.cts .test.jsx .test.tsx`
  and the `.spec.` equivalents. `SUFFIXES.some(s => name.endsWith(s))` — no glob, no
  regex, no parser. Subdir-agnostic (basename only). Not PR-configurable.
- **Single source (a shared MODULE).** The predicate + suffix set live in ONE new
  module `process-guard/scripts/freeze-set.mjs`, imported by `check.mjs` and
  `generate-manifest.mjs`. A shared function, not a shared string.
- **Opt-in freeze.** A non-matching file MAY be listed; the guard hash-checks every
  listed key. The predicate defines the *mandatory* set; the manifest may be a
  superset. `acceptance.manifest.json` and `phases.json` are NEVER valid keys.
- **Effective frozen set** = `mandatoryMatched ∪ explicitlyListedOptional`. Editing a
  non-frozen fixture/README is not a freeze event.
- **Residual risk (named).** Frozen test vs non-frozen fixture: mitigated by
  self-contained tests + opt-in freeze + audit. See *Accepted risks*.

### D1 — Canonical byte source: git blob bytes, addressed by exact git path

All hashing is over **git blob bytes** (`git cat-file blob <rev>:<path>` for the guard;
`git cat-file blob :<path>` = the staged index blob for the generator), never
`readFileSync` of the working tree. This closes CRLF/`autocrlf`/smudge differentials,
symlink dereferencing, and working-tree trust in one move.

- Only **regular file blobs** (git mode `100644`/`100755`) are hashable. Any matched
  or listed path whose mode is a symlink (`120000`), gitlink, or tree is rejected
  fail-closed (guard and generator), by reading modes from `git ls-tree`, never
  `statSync`.
- **Blobs are addressed by the exact byte path from `git ls-tree -z`**, never by an
  NFC-normalized key. (git is byte-exact: reading `HEAD:<NFC-key>` when the tree
  committed the path in NFD returns not-found → a phantom-key wedge on a legitimate
  suite.) NFC is used ONLY for set-membership comparison (below), never as a
  `cat-file` argument.

### D2 — Sourcing invariant + the base-manifest presence probe

Every decision about *whether the freeze applies*, *which files are frozen on base*,
and *their frozen hashes* reads from the **merge-base tree** via git plumbing, never
the working tree (`existsSync`/`readFileSync` of a manifest or test are banned here).

Base-manifest presence is a **two-step probe** (`git cat-file -e` cannot be used — it
returns 128 for BOTH absent-path and bad-ref, so it cannot tell absence from error):

1. Resolve the base commit: `git rev-parse --verify <mergeBase>^{commit}`. Failure =
   git/config error → fail-closed (`git-error`).
2. `git ls-tree -z --full-tree <mergeBase> -- <MANIFEST>`: nonzero exit = error →
   fail-closed; zero exit + an entry = **present**; zero exit + empty output =
   **cleanly absent** (introduction path). A transient error is never read as "absent
   → introduction" (that would skip enforcement).

### D3 — Manifest schema (parse, don't validate) + NFC collision

After `JSON.parse`, validate into a typed shape before any use; any deviation → a
clean `✗ freeze-hash: <reason>` verdict (no raw stack, no echoed input):

- top-level plain object; `version` an enumerated known value (unknown version =
  deny);
- `files` a plain object (reject array/string/number/null/missing);
- own-enumerable keys only; reject `__proto__`/`constructor`/`prototype`;
- each key a **canonical relative path**: NFC, POSIX `/`, relative, no empty/`.`/`..`
  segments, not absolute, byte-identical to its canonical form (reject `a/../b`,
  `./b`, `sub//b`, backslashes, absolute, resolves-outside); `acceptance.manifest.json`
  and `phases.json` are not valid keys;
- each value matches `/^[0-9a-f]{64}$/`.
- **NFC collision** (guard AND generator): if two distinct byte paths under the
  acceptance tree NFC-normalize to the same key, reject fail-closed (`nfc-collision`)
  before hashing — never silently keep one and drop the other.
- **Malformed manifest on base is recoverable** (bounds the rollout wedge when
  hardening a previously-permissive guard): a schema-invalid base manifest is
  fail-closed, but a PR that lands a schema-valid HEAD manifest AND changes a contract
  file re-establishes the suite (base freeze comparison skipped for that PR; HEAD
  self-consistency + ≥1 matched test still required). The pass verdict is `re-frozen`
  (contract-gated re-establishment — not `introduced`, which is reserved for a cleanly
  absent base per D2).

### D4 — Reason-code vocabulary (the acceptance ↔ implementer contract)

Verdict lines: `✓ <check>: <reason-code> [fields]` or `✗ <check>: <reason-code>
[fields]`. Filenames in fields are NFC, control-chars escaped (`\xNN`), and bounded
(first few + a count). **Acceptance tests assert on `<check>` + `<reason-code>` (+ the
specific filename only where load-bearing), never full prose.** The implementer MUST
emit exactly these codes. Formatters never throw.

- `process-guard` (guard-level, emitted before any per-check verdict and aborts the
  run): `config-invalid` (fail — a blank/invalid PG_* value, e.g. empty
  `PG_SRC_PATHS` or `PG_ACCEPTANCE_DIR`), `git-error` (fail — ANY git failure:
  unresolvable base ref, the D2 probe erroring, maxBuffer overflow). A git failure
  means the guard cannot trust any result, so it fails closed guard-wide, not under a
  single check.
- `stage-artifact`: `manifest-on-base` (pass, contains `global`), `exempt-on-base`
  (pass, contains `global`), `no-src` (pass/skip), `missing-on-base` (fail).
  None contain the substring `R-2`.
- `freeze-hash`: `intact` (pass), `introduced` (pass), `re-frozen` (pass, contract),
  `no-suite` (pass), `edited` (fail), `deleted` (fail), `unlisted` (fail),
  `unlisted-on-base` (fail), `phantom-key` (fail), `manifest-deleted` (fail),
  `manifest-malformed` (fail), `key-unsafe` (fail), `symlink` (fail),
  `nfc-collision` (fail), `empty-suite` (fail).
- `mixed-diff`: `clean` (pass), `reviewed` (pass, contract), `unreviewed` (fail).

---

### PG-H1 — exemption is read from the base, never the working tree

`stage-artifact` decides `.process-guard-exempt` from the merge-base tree
(`git ls-tree`/`cat-file` on the base), not the working tree. A PR adding the marker
in its own diff does NOT exempt itself.

- Negative (bypass-delta): base has no manifest, no marker; PR touches src AND adds
  `.process-guard-exempt`. Pre-fix: passes. Fixed: `stage-artifact` fails
  (`missing-on-base`).
- Positive: marker on base + src change → passes (`exempt-on-base`). Prevents
  over-blocking legitimate onboarding.
- Onboarding order (README): the marker lands in its own merged PR before any src PR.

### PG-H2 — completeness = HEAD self-consistency (unconditional), recoverable

The manifest a PR commits must describe the PR's own tree over the mandatory set;
never pardoned by contract-unlock (unlock re-freezes *listed* tests, never launders a
structural hole):

- Every mandatory-matched regular blob on the **HEAD** tree (`git ls-tree -z -r HEAD --
  <ACC_DIR>`, matched by basename, regular mode) is a key in the **HEAD** manifest
  (else `unlisted`).
- Every HEAD manifest key names an existing regular blob on HEAD (else `phantom-key`),
  is canonical (D3), and its recorded hash == `sha256(git blob HEAD:<exact-path>)`
  (else `edited`). Opt-in keys are hash-checked identically.
- **Base holes are unconditional fails, but recoverable and non-launderable.** A
  mandatory-matched blob on the *base* tree absent from the *base* manifest: if present
  on HEAD it must be registered in the HEAD manifest at exactly
  `sha256(git blob <mergeBase>:<path>)` AND its HEAD blob must equal its base blob —
  registration freezes EXISTING content, it may not smuggle an edit (editing the orphan
  needs the contract path). If absent on HEAD → `unlisted-on-base` (unfrozen deletion).
  Recovery: a manifest-only registration PR (no contract) clears the hole; the repo is
  never permanently wedged.

- Negative (bypass-delta): base manifest lists `a.test.mjs`; base tree also has an
  unlisted matched `b.test.mjs`; PR deletes `b.test.mjs` AND changes the contract.
  Pre-fix: passes. Fixed: `freeze-hash: unlisted-on-base b.test.mjs`, despite the
  contract.
- Negative (fixed-only): PR edits base-hole `b.test.mjs` AND registers it at the new
  HEAD hash, no contract → fails (content ≠ base blob).
- Positive (fixed-only): manifest-only registration at the base hash, unchanged
  content, no contract → passes.

### PG-H2b — frozen content changes only via the reviewed contract path

For every key in the **base** manifest (matched AND opt-in), the HEAD blob bytes must
equal the base blob bytes — compared **blob-to-blob**
(`sha256(git blob <mergeBase>:<key>)` vs `sha256(git blob HEAD:<key>)`), NOT against
the base manifest's recorded value (a stale base value must not wedge unrelated PRs). A
base key whose HEAD blob differs = `edited`; a base key absent from the HEAD manifest =
unfreeze (`deleted`); either fails **unless the PR changes a contract file**. Removing
an opt-in key is equally a freeze change (closes silent-unfreeze). On the unlock path,
HEAD self-consistency (PG-H2) still holds — a contract touch cannot ship a stale hash
or an omitted new matched file.

- Negative (bypass-delta, base-sourcing discriminator): base freezes `a.test.mjs`; PR
  rewrites BOTH `a.test.mjs` and its manifest entry to a self-consistent NEW hash, no
  contract. Pre-fix (working-tree manifest): internally consistent → passes. Fixed
  (base blob ≠ HEAD blob, no unlock): `freeze-hash: edited a.test.mjs`.
- Negative (fixed-only): PR edits `a.test.mjs`, ADDS matched `c.test.mjs` left OUT of
  the regenerated manifest, changes the contract. Fixed: `unlisted c.test.mjs` despite
  the contract.
- Positive (fixed-only): edit `a.test.mjs` + complete regenerated manifest + contract
  change → `re-frozen`.

### PG-H5 — deleting the manifest is a violation, not "no suite, green"

If the manifest is present on base it must be present on HEAD; deleting it fails
**unconditionally** (`manifest-deleted`).

- Negative (bypass-delta): base has manifest + suite; PR deletes the manifest only.
  Pre-fix: passes (`no-suite`). Fixed: `freeze-hash: manifest-deleted`.
- Sibling (fixed-only regression): PR deletes the whole acceptance dir (manifest +
  tests) → `manifest-deleted` (pre-fix already fails this via a different branch, so it
  is a regression pin asserting the DISTINCT fixed reason code, not a bypass-delta).

### PG-H6 — first introduction is the reviewed path; git errors fail-closed

When there is **cleanly no manifest on base** (D2), a PR introducing the suite takes
the reviewed path: schema-valid HEAD manifest, HEAD self-consistency (PG-H2), and **≥1
mandatory-matched test** (an empty `{files:{}}` is rejected `empty-suite`, so it cannot
permanently satisfy `stage-artifact` with no test). Freeze enforcement (PG-H2b) begins
next PR. `stage-artifact` still requires the manifest ON BASE for a src PR — so a
src+suite-in-one-PR still fails stage-artifact; the suite PR precedes the impl PR.

- Negative (bypass-delta): same rewrite-both discriminator as PG-H2b (canonical TOCTOU
  pin).
- Negative (fixed-only): base has no manifest; PR introduces `{version:1,files:{}}`
  with no matched test → `empty-suite`.
- Negative (fixed-only): base-manifest probe git error (bad base ref / forced non-zero
  `ls-tree`) → `process-guard: git-error`, NOT the introduction path.

### PG-H7 — input hardening at the trust boundary

1. **NUL-delimited git output** — every `--name-only`/`ls-tree` uses `-z`, read as
   bytes; invalid-UTF-8 paths rejected fail-closed.
   - Negative (bypass-delta): PR ADDS an unlisted mandatory-matched file whose name has
     a non-ASCII byte, no contract. Pre-fix (quoted path fails `startsWith`) → unlisted
     check skips it → passes. Fixed (`-z`) → `unlisted`. (Sibling: newline-in-name.)
2. **`--no-renames`** on the diff.
   - Negative (bypass-delta): base has `src/a.ts`, **no manifest on base, no exempt
     marker**; PR renames `src/a.ts` → `vendor/a.ts` only. Pre-fix (rename collapse →
     `touchesSrc` false) → passes; Fixed (`touchesSrc` true, no manifest on base) →
     `stage-artifact: missing-on-base`. (The no-manifest-on-base configuration is the
     discriminator — with a manifest on base, stage-artifact passes either way.)
3. **Path-scoped, bounded git.** `ls-tree --full-tree ... -- <path>` for manifest/marker
   probes; frozen-set enumeration scoped `-- <ACC_DIR>`; explicit `maxBuffer` on every
   git call; any git error/overflow → `process-guard: git-error` verdict + exit 1; no
   `catch` converts a git error into a pass. (Determinism/fail-closed; fixed-only
   assertion on the verdict + non-zero.)
4. **Key sandbox + schema** (D3) before any blob read.
   - Negative (bypass-delta): manifest key `../../README.md` (a real in-repo file
     OUTSIDE the acceptance dir) with README's correct sha256. Pre-fix (`join` resolves
     inside the repo, file exists, hash matches) → `freeze-hash` PASSES having read
     outside the suite. Fixed: `key-unsafe` at parse time, **no read outside the
     acceptance dir** (asserted via canary).
   - Negative (fixed-only): a listed key whose git mode is a symlink → `symlink`.
5. **Config validation + trailing-slash normalization.** Validate PG_* before any side
   effect: `PG_ACCEPTANCE_DIR` non-empty, canonical, trailing slashes stripped;
   `PG_SRC_PATHS` ≥1 non-empty prefix; contract paths non-empty.
   - Negative (bypass-delta): `PG_ACCEPTANCE_DIR="test/acceptance/"`; PR adds an
     unlisted matched file. Pre-fix (`startsWith("…//")` false) → passes; Fixed → fails.
   - Negative (fixed-only): `PG_SRC_PATHS=""` → `process-guard: config-invalid`,
     fail-closed (not "every PR touches src").
6. **NFC for comparison only** (D1): normalize paths NFC for set-membership; read/hash
   blobs by exact git path. Reject NFC collisions (D3).
   - Edge (fixed-only): commit a file in NFD, list its NFC key → the guard matches by
     NFC, reads the blob by the NFD git path, passes (proves blob-read-by-actual-path).
   - Edge (fixed-only): tree with both NFC and NFD spellings → `nfc-collision`.
7. **Log-injection-safe output.** Fixed reason codes + bounded, escaped fields; raw
   filenames never interpolated unescaped/unbounded.
   - Negative (fixed-only): a newline/control-char filename is rejected with exactly one
     escaped verdict line and no forged `✓`/`✗` line.

### PG-H4 — the global stage-artifact limit is stated honestly, on every pass path

Every `stage-artifact` pass message (`manifest-on-base` AND `exempt-on-base`) contains
`global`, points at the named accepted risk, and does NOT contain `R-2`. A no-src run
emits `no-src`.

- Test (output-delta): both pass paths contain `global` and not `R-2` (`R-2` kept as an
  explicit forbidden substring — regression against the intermediate bad message).

### PG-H3 — the re-freeze invariant [DEFERRED — out of scope]

Contract-unlock stays coarse: ANY contract-path touch unlocks a re-freeze of listed
tests. Deferred; backstop R-2 clause 4 (audits `test/acceptance/**` changes vs same-PR
contract changes — R-2's correct use, NOT per-feature coverage). No test. Named in
*Accepted risks*.

### PG-H8 — the guard gates its own code (self-gating), with a named platform residual

- **Wire src-paths.** This repo's `.github/workflows/ci.yml` sets `src-paths` to
  include `process-guard/scripts/`.
- **Trusted-bootstrap job.** A required CI job runs the guard **materialized from the
  base ref** (`git archive origin/<base> process-guard/scripts | tar -x`) against the
  PR checkout, so a tampered HEAD `check.mjs` cannot clear its own gate. Runs alongside
  the HEAD `uses: ./process-guard` job (which also runs the acceptance suite).
- **Merge order** (avoids self-block): the suite+manifest+contract PR lands FIRST while
  `src-paths` is still default (it touches no guard code → `touchesSrc` false →
  passes); `src-paths` wiring + the guard change land in the SECOND PR, once the
  manifest is on base.
- **Fixture test:** a fixture repo with `PG_SRC_PATHS` covering the guard path; a PR
  editing that path with no manifest on base → `stage-artifact: missing-on-base`.
- **Named residual (accepted risk + follow-up).** The trusted-bootstrap closes guard
  CODE tampering, NOT CI-WORKFLOW-DEFINITION tampering — the job lives in PR-controlled
  `ci.yml`, so a PR could neuter it while keeping the required status name. Fully
  closing this needs a layer-0 control (a repository **ruleset-required workflow**
  sourced from a trusted ref, or an external App check), a GitHub configuration action,
  not an in-repo file. Configured as a post-merge follow-up.

### mixed-diff over the effective frozen set

`touchesAcceptance` = touching an **effective-frozen** file (matched or opt-in listed),
NOT any acceptance-dir file.

- Positive (fixed-only): `src` + a non-frozen fixture, no contract → `clean`.
- Negative (fixed-only regression): `src` + a frozen test edit, no contract →
  `unreviewed` (pre-fix also fails this; regression pin).

---

### Acceptance-test authoring: classify every row

The **frozen suite asserts FIXED behaviour** against the guard under test, resolved
from `PG_CHECK_PATH` (default: the repo's `process-guard/scripts/check.mjs`). It does
NOT compare against a moving reference — the base branch eventually becomes the fixed
guard, so freezing a comparison against it would self-break. Every
row asserts exit code AND `<check>: <reason-code>` (D4) against the repo guard.

Red-then-green is verified **once, by the author, out of band** (not frozen into CI):
run the suite with `PG_CHECK_PATH` pointed at the **pinned pre-fix** `check.mjs`
(materialised from the pre-fix commit `bec7a2b` into a temp path, NOT `origin/main`),
and confirm every BYPASS-DELTA row FAILS there (proving it's a real discriminator, not
tautological). Report the table. Classify every row:

- **BYPASS-DELTA** — against the FIXED guard: non-zero + reason code (asserted in the
  frozen suite); against the PINNED pre-fix guard: exit 0 / no reason code (author's
  one-time check). These PIN the hardening. Rows: H1, H2 (unlisted-under-contract),
  H2b/H6 (rewrite-both), H7.1 (non-ASCII unlisted add), H7.2 (rename-out, no base
  manifest), H7.4 (traversal read-outside), H7.5 (trailing-slash unlisted add), H5
  (manifest-only deletion).
- **OUTPUT-DELTA** — same exit code, different message. Assert the fixed message. H4.
- **FIXED-ONLY / REGRESSION** — assert the fixed reason code + exit only; do NOT assert
  pre-fix behaviour. Rows: whole-dir delete, git-error, empty-suite intro,
  malformed-manifest clean verdict, `{files:123}` freezes-nothing, symlink key,
  edit-plus-register, base-hole registration positive, NFC blob-read, NFC-collision,
  non-hex hash, log-injection filename, blank PG_SRC_PATHS, src+fixture passes,
  src+frozen fails, malformed-base recovery, H8 self-gating fixture.
- **FIXED-ONLY regression rows added after independent review** (each pins a reproduced
  bypass — see addenda A1–A7): empty-base steady-state (base `{files:{}}` + a src PR →
  `stage-artifact: manifest-on-base` but overall exit 1 via `freeze-hash: empty-suite`);
  re-freeze-to-empty (delete all tests + `{files:{}}` + contract → `empty-suite`, not
  `re-frozen`); unlisted matched symlink (add `x.test.mjs` as a 120000 entry, unlisted
  → `symlink`); opt-in / whole-tree NFC collision (two byte-distinct non-matched paths
  colliding under ACC → `nfc-collision`); non-canonical `PG_ACCEPTANCE_DIR`
  (`test/acceptance/../void` → `process-guard: config-invalid`); over-broad
  `PG_SRC_PATHS` (`src` must NOT gate `srcfoo/…`); C1/NEL control in a filename
  (escaped, exactly one verdict line, no forged `✓/✗`). Author the collision rows with
  `core.precomposeunicode=false` set in the fixture repo so they materialize on macOS
  too (also fixes the existing NFC-collision row's 25/26-on-darwin flake).

Every test strips inherited `PG_*` from env, setting only what the fixture needs; the
fail-closed-on-error case asserts a clean `✗ freeze-hash: manifest-malformed` verdict
(no raw stack), not merely non-zero.

### Review-hardening addenda (fold into the clauses)

A cross-family review reproduced several exit-0 bypasses a green suite had laundered.
These tighten the clauses above; each gets a fixed-only regression row.

- **A1 — an empty suite is never "intact".** PG-H6/D4: `empty-suite` fires on EVERY
  manifest-present path with zero mandatory-matched regular tests — introduction,
  steady-state, AND contract re-freeze. The guard never emits `intact`/`re-frozen`
  when `headMatched.size === 0`. (Closes a `{files:{}}` base, or a reviewed re-freeze
  that wipes the suite, permanently passing src PRs.)
- **A2 — non-regular matched/listed entries fail closed.** D1/PG-H7.4: enumerate the
  acceptance tree at ALL modes. Any entry whose basename is frozen (mandatory) OR that
  is a manifest key, whose git mode is not a regular blob (100644/100755), fails
  `symlink` — on HEAD and base, before any blob read; never silently skipped.
- **A3 — NFC collision over the whole tree, both trees, both scripts.** D3/PG-H7.6:
  detect NFC-key collisions across EVERY raw entry under the acceptance dir (matched,
  opt-in, fixture, any mode) on BOTH HEAD and base, before building any normalized map
  or hashing → `nfc-collision`. The generator does the same over the whole staged tree.
- **A4 — canonical config.** PG-H7.5: validate `PG_ACCEPTANCE_DIR` with one canonical
  POSIX-relative routine — reject empty, `.`/`..` segments, duplicate `//`, non-NFC,
  backslash, absolute — before any git call → `config-invalid`. `PG_SRC_PATHS`
  prefixes match on a segment boundary (`f === p` or `f.startsWith(p + "/")`), so `src`
  does not match `srcfoo/`.
- **A5 — no git error becomes a pass.** PG-H7.3: read+schema-parse the HEAD manifest
  ONCE via the fail-closed git helper; share it between mixed-diff and freeze-hash. No
  catch converts a git failure into an empty key set or a pass verdict.
- **A6 — escape all control/format/separator code points.** D4/PG-H7.7: `fmtField`
  escapes every C0/C1 control, DEL, line/paragraph separator (U+2028/U+2029), NEL
  (U+0085), and bidi/format control by code point — not only C0+DEL — so no filename
  forges a verdict line.
- **A7 — key bytes.** D3: `keySafe` rejects any key containing a control byte
  (`[\x00-\x1f\x7f]`).
- **A8 — internal errors labeled honestly.** D4: an unexpected non-git throw aborts
  `✗ process-guard: internal` + exit 1 (fail-closed); `git-error` is git failures only.
- **A9 — generator filesystem trust.** The generator rejects a symlinked
  acceptance directory or any symlinked ancestor of the manifest output path (not only
  the final component); `headManifestKeys` aborts on any git/decode/schema error (never
  silently drops opt-in keys).
- **A10 — CI enforces the suite + self-gating.** PG-H8/Deliverables: CI runs the
  acceptance suite; `src-paths` + trusted-bootstrap are wired in the guard PR.
- **A11 — a structurally-corrupt BASE is recoverable, not a wedge.**
  The A2/A3/D3 base-side checks must not permanently wedge the repo. HEAD structural
  checks stay UNCONDITIONAL (a PR can never commit a symlink, NFC collision, or empty
  suite). But a PRE-EXISTING corrupt base — a matched/listed symlink, an NFC collision,
  or a malformed manifest ON THE BASE tree — is repaired by a reviewed re-establishment:
  once HEAD is proven structurally clean, a PR that also changes a contract emits
  `re-frozen` and skips the untrustworthy base comparison; without a contract change it
  fails closed (`symlink`/`nfc-collision`/`manifest-malformed`) pointing at the repair
  path. The generator shares the guard's `canonicalRelDir` for `PG_ACCEPTANCE_DIR` (no
  `..`/`.`/`//`/non-NFC path can redirect the manifest write). Regression: base carries
  a matched symlink; a PR removing it WITH a contract change passes `re-frozen`, the
  same PR WITHOUT a contract fails `symlink`.

### Deliverables (mirror + surface)

- `process-guard/scripts/freeze-set.mjs` (predicate + suffix set), imported by
  `check.mjs` and `generate-manifest.mjs`.
- `generate-manifest.mjs`: hash only mandatory-matched regular blobs (staged index
  blob) by default; preserve pre-existing opt-in keys read from the **HEAD** manifest
  (abort, don't silently drop, if an opt-in target is missing/non-regular); reject
  symlinks; NFC keys with collision check; write the manifest no-follow/atomically
  (reject a symlinked output path).
- `action.yml`: no new freeze input (predicate fixed); document it. `README`: rewrite
  checks table + onboarding order (exempt-from-base), freeze predicate, base sourcing,
  fail-closed errors, and the engineering-os `src-paths` dogfood example.

### Accepted risks (named, not hidden)

- **Fixture-weakening (boundary A).** Self-contained tests + opt-in freeze + audit.
- **stage-artifact is global, not per-feature.** Surfaced in the pass message; audited;
  not attributed to R-2.
- **Contract-unlock is coarse (PG-H3).** Backstop R-2 clause 4. No stronger binding
  claimed in docs.
- **First-introduction can smuggle a weak-but-nonempty suite.** Owner-reviewed intro;
  guard enforces ≥1 matched test + self-consistency.
- **phases.json activation reversal.** Outside the freeze; named gap (no runner yet);
  audit backstop.
- **CI-workflow-definition tampering (PG-H8).** Closed only by a platform
  ruleset-required workflow; configured as a post-merge follow-up.
- **Malformed/incomplete base is recoverable, not permanent** — via the registration /
  reviewed-re-establishment PRs (PG-H2 / D3).
