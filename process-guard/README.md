# process-guard

The shared CI action that hard-enforces the artifact chain
([`OS.md`](../OS.md) §2). It reads diffs, files, and hashes — it cannot tell one
agent, harness, or human from another, which is the point.

## Checks (v0.1)

| Check | Rule | Baseline item |
|---|---|---|
| `stage-artifact` | A PR touching `src/**` requires `acceptance.manifest.json` on the base branch — the frozen suite must exist before implementation begins | PC-08 |
| `freeze-hash` | Every acceptance test file must hash-match the committed manifest; edits, deletions, and unlisted additions all fail. Activation via `phases.json` is exempt | PC-09 |
| `mixed-diff` | `src/**` and acceptance tests changing in one PR fails, unless the contract changed in the same PR (owner-reviewed path) | PC-10 |

Planned next (ported from repos where they already run): secret-history lint (PC-01),
anti-silent-skip (PC-02), author-identity split (PC-13).

## Usage

```yaml
# .github/workflows/ci.yml — make this job a required status check
process-guard:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@<sha>
      with: { fetch-depth: 0 }        # merge-base needs history
    - uses: acartag7/engineering-os/process-guard@<pinned-sha>
      with:
        base-ref: origin/${{ github.base_ref }}
```

**Onboarding a repo that predates the pipeline:** commit a `.process-guard-exempt`
marker at the repo root to disable only the stage-artifact check until the first
acceptance suite lands. The marker's existence is a named gap in every audit —
exemption is visible, never silent.

## The acceptance author's flow

```bash
# after writing the suite (stage 4):
node process-guard/scripts/generate-manifest.mjs test/acceptance
git add test/acceptance && git commit  # its own PR, merged before implementation
```

The implementer activates completed phases by editing `test/acceptance/phases.json`
only — content changes to any test file turn the required check red on every
subsequent PR.

## Versioning

Consumers pin by commit SHA. New checks arrive as minor versions and propagate by a
batched SHA-bump sweep across all repos ([`OS.md`](../OS.md) §6). A check is never
weakened to make a repo green; the repo changes, or the exemption is named.
