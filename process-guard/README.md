# process-guard

The shared CI action that hard-enforces the artifact chain
([`OS.md`](../OS.md) §2). It reads git trees, diffs, and hashes — it cannot tell one
agent, harness, or human from another, which is the point. Zero runtime dependencies;
fail-closed on every error.

## What it decides, and from where

Every freeze decision is read from the **merge-base tree** via git plumbing — never the
PR-controlled working tree. A PR cannot alter the freeze by editing, deleting, or
rewriting the manifest or a test in its own diff. Content is hashed over **git blob
bytes** (not `readFileSync`), so line-ending filters and symlinks can't shift a hash.

## Checks

| Check | Rule | Baseline |
|---|---|---|
| `stage-artifact` | A PR touching a src path requires the frozen suite's manifest to already exist **on the base tree** (or an exempt marker on base). A **global** gate — it does not verify per-feature coverage. | PC-08 |
| `freeze-hash` | The committed manifest is self-consistent with HEAD (every mandatory test listed, every key a canonical regular blob hashing to its recorded value) and every base-manifest entry's content is unchanged vs base — unless the contract changed too. Deletions, symlink swaps, unlisted tests, and manifest deletion all fail. | PC-09 |
| `mixed-diff` | A src change and an effective-frozen test may not change in one PR unless the contract changed too (owner-reviewed path). | PC-10 |

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

## Usage

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
        # gate the guard's own code (or any extra implementation roots):
        src-paths: src/,process-guard/scripts/
```

For a T2 surface that must not be able to clear its own gate, also run the guard
**materialized from the base ref** against the PR (see this repo's `ci.yml`
`process-guard-trusted` job) and make it a required check. Fully closing
workflow-definition tampering needs a repository ruleset-required workflow.

**Onboarding a repo that predates the pipeline:** commit `.process-guard-exempt` at the
repo root **in its own PR, merged to the default branch first** — the marker is read
from the base tree, so a marker added in the same PR as a src change does **not** exempt
that PR. The marker is a named gap in every audit; exemption is visible, never silent.

## The acceptance author's flow

```bash
# after writing the suite (stage 4), with the tests staged:
node process-guard/scripts/generate-manifest.mjs test/acceptance
git add test/acceptance && git commit  # its own PR, merged before implementation
```

`generate-manifest.mjs` hashes the staged (index) blobs of the mandatory-matched tests,
preserves any pre-existing opt-in keys (aborting rather than silently dropping one),
and refuses non-regular blobs and symlinked output paths. The implementer activates
completed phases via `test/acceptance/phases.json` only — content changes to any frozen
test turn the required check red.

## Versioning

Releases are tagged (`vX.Y.Z`). Consumers pin the **commit SHA** with a `# vX.Y.Z`
comment — the SHA is the immutable, supply-chain-safe ref (never a moving tag), and the
comment lets an updater track the version. **Automate the bumps** rather than hand-pin:
point Renovate or Dependabot's `github-actions` ecosystem at this action and it opens
the re-pin PR on each release. Exempt this first-party action from any release-age floor
with a *scoped* rule (e.g. Renovate `matchPackageNames: ["/^acartag7\/engineering-os/"]`,
`minimumReleaseAge: "0"`) so hardening fixes propagate immediately — never a blanket
disable. This turns the batched SHA-bump sweep ([`OS.md`](../OS.md) §6) from a chore into
automation. A check is never weakened to make a repo green; the repo changes, or the
exemption is named.
