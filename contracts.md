# Contracts

## process-guard hardening (T2)

Origin: the 2026-07-18 plugin critique confirmed four ways an honest-but-fallible
PR slips process-guard. This contract governs the fix. process-guard gates every
governed repo, so every clause has a negative test that fails against the
pre-fix guard.

### PG-H1 — exemption is read from the base, never the working tree

`stage-artifact` must decide the `.process-guard-exempt` exemption from the
merge-base tree, not the checked-out working tree. A PR that adds the marker in
its own diff does NOT exempt itself.

- Negative test: base has no manifest and no marker; PR touches a src path AND
  adds `.process-guard-exempt`. Pre-fix: passes. Required: `stage-artifact` fails.

### PG-H2 — the freeze is complete over the acceptance directory

The manifest must enumerate every acceptance test file present on the base tree
(excluding the manifest itself and the activation file). Any base-tree
acceptance file absent from the manifest is a freeze violation, and deleting
such an unlisted file does not pass.

- Negative test: base manifest lists `a.test.ts`; base tree also contains an
  unlisted `b.test.ts`; PR deletes `b.test.ts`. Pre-fix: passes. Required:
  `freeze-hash` fails naming the unlisted file.

### PG-H3 — the re-freeze invariant [DEFERRED — needs redesign]

Intended: an already-frozen test's content changes only in a PR that also
changes the contract, so a weakening is never silent. **Deferred from this
slice.** Building the fix surfaced that the freeze-hash check only reaches its
contract-unlock branch when the manifest is *inconsistent* with the tests —
when an author updates the test AND the manifest together (a test-only PR),
there is no mismatch and no contract requirement is enforced at all. A
"contract names the test" heuristic does not close that; the real fix is a
redesign of how re-freezes are gated (candidates: manifest is a
separately-reviewed artifact whose change requires an approving review pinned
to the contract diff; or the guard compares the base manifest to HEAD and
treats any downgrade as a violation). Until designed, R-2 audits every
`test/acceptance/**` change against a same-PR contract change (already a
routine check). Labelled a wish, not a wall.

### PG-H4 — the global stage-artifact limit is stated in output

`stage-artifact` remains a global check (manifest-exists-on-base); per-feature
coverage is not mechanized in CI. The guard's own pass message must say so, so
the limit is visible in every run rather than implied away. Audited monthly by
R-2.

- Test: on a passing stage-artifact run, output contains the word `global` and
  points at the monthly audit. (Assertion on message text.)

### Non-configurable invariants

- The guard gates its own code: consuming CI sets `PG_SRC_PATHS` to include
  `process-guard/scripts/` so a change to the guard is itself a src change under
  the stage-artifact/mixed-diff rules.
- All guard inputs derive from the merge-base or the PR diff — never from
  mutable working-tree state the PR controls (PG-H1 generalized).
