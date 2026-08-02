# process-guard

An optional CI action for repositories that deliberately use hash-frozen acceptance
tests. It is not the default Engineering OS onboarding path. The normal workflow uses
repository-owned tests, one language-neutral verify command, and independent
exact-head review.

This action reads git trees, diffs, and hashes. It has zero runtime dependencies and
fails closed on its configured inputs.

## Important limitation

A configured contract-path change permits the reviewed re-freeze path. The action can
prove that the contract file changed; it cannot prove that a human approved the
semantic change. See [issue #12](https://github.com/acartag7/engineering-os/issues/12).

## What it decides, and from where

Every freeze decision is read from the **merge-base tree** via git plumbing — never the
PR-controlled working tree. A PR cannot alter the freeze by editing, deleting, or
rewriting the manifest or a test in its own diff. Content is hashed over **git blob
bytes** (not `readFileSync`), so line-ending filters and symlinks can't shift a hash.

## Checks

| Check | Rule |
|---|---|
| `stage-artifact` | A PR touching a configured source path requires the frozen suite's manifest on the base tree, or an exemption on the base tree. This is a global check, not per-feature coverage. |
| `freeze-hash` | The manifest is valid and frozen files match their recorded hashes, unless the reviewed contract-change path is used. |
| `mixed-diff` | A configured source change and a frozen-test change cannot travel together unless the contract-change path is used. |

Guard-level aborts (before any check, exit 1): `process-guard: config-invalid <field>`
(a blank/invalid `PG_*`), `git-error` (any git failure), `internal` (any other throw).
All verdicts are `✓/✗ <check>: <reason-code> [field]` with filenames NFC-normalized,
control-escaped, and bounded — a crafted filename cannot forge a verdict line.

## The freeze boundary

The freeze covers files under the acceptance directory whose **basename** matches a
**fixed built-in predicate** (`.test.*` / `.spec.*` over a fixed extension set), defined
once in [`scripts/freeze-set.mjs`](scripts/freeze-set.mjs) and shared by the guard and
the generator. It is **not** a configurable glob — a PR-tunable pattern would itself be
a bypass. Fixtures, READMEs, `phases.json`, and the manifest are outside the freeze; a
non-matching file can be **opt-in** frozen by listing it in the manifest. A suite must
contain at least one matched test (an empty manifest never passes).

Freeze only behavior visible outside the implementation. A return value, rejection,
or user-visible state may belong here. File layout, helper names, and internal call
order do not. Freezing implementation details makes safe refactoring expensive and
encourages bypasses.

## Optional usage

```yaml
# .github/workflows/ci.yml — make this job a required status check
process-guard:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@<sha>
      with: { fetch-depth: 0 }        # merge-base needs history
    - uses: acartag7/engineering-os/process-guard@<sha> # v0.1.0
      with:
        base-ref: origin/${{ github.base_ref }}
        # Configure real source roots. Do not assume src/ for Go or other layouts.
        src-paths: cmd/,internal/,pkg/
```

For a T2 surface that must not be able to clear its own gate, also run the guard
**materialized from the base ref** against the PR (see this repo's `ci.yml`
`process-guard-trusted` job) and make it a required check. Fully closing
workflow-definition tampering needs a repository ruleset-required workflow.

**Onboarding a repo that predates the pipeline:** commit `.process-guard-exempt` at the
repo root **in its own PR, merged to the default branch first** — the marker is read
from the base tree, so a marker added in the same PR as a src change does **not** exempt
that PR. The marker is a named gap in every audit; exemption is visible, never silent.

## Small amendment flow

A small contract amendment may update the contract, code, affected frozen tests, and
manifest in one pull request. The pull request states what behavior changes, why, and
which frozen tests move. The guard still requires the configured contract path to
change and still checks the hashes. This is a faster review path, not a bypass.

```bash
# after updating the affected contract tests, with the tests staged:
node process-guard/scripts/generate-manifest.mjs test/acceptance
git add test/acceptance
```

`generate-manifest.mjs` hashes the staged (index) blobs of the mandatory-matched tests,
preserves any pre-existing opt-in keys (aborting rather than silently dropping one),
and refuses non-regular blobs and symlinked output paths. Without a configured
contract change, content changes to any frozen test turn the required check red.

## Versioning

Releases are tagged (`vX.Y.Z`). Consumers pin the **commit SHA** with a `# vX.Y.Z`
comment — the SHA is the immutable, supply-chain-safe ref (never a moving tag), and the
comment lets an updater track the version. **Automate the bumps** rather than hand-pin:
point Renovate or Dependabot's `github-actions` ecosystem at this action and it opens
the re-pin PR on each release. Exempt this first-party action from any release-age floor
with a *scoped* rule (e.g. Renovate `matchPackageNames: ["/^acartag7\/engineering-os/"]`,
`minimumReleaseAge: "0"`) so hardening fixes propagate immediately — never a blanket
disable. This turns the batched SHA-bump sweep
([`ROUTINES.md`](../ROUTINES.md), R-3) from a chore into automation. A check is never
weakened to make a repo green; the repo changes, or the exemption is named.
