# engineering-os plugin

The pipeline as a Claude Code plugin: the `/pipeline` driver skill plus
routing-free seat agents. Install it and one command drives a feature through
spec → critique → frozen acceptance tests → implementation → review — with the
enforcement staying where it always was: process-guard in CI and branch
protection. The plugin is Layer 2; deleting it removes convenience, never
safety.

## Install

From the marketplace manifest at the repo root:

```
/plugin marketplace add acartag7/engineering-os
/plugin install engineering-os@engineering-os
```

The plugin is self-contained: it vendors the prompt templates (`prompts/`,
with source SHA headers) and the manifest generator (`scripts/`), so it works
in repos that don't have the engineering-os repo cloned. The CI wall is still
per-repo setup: wire `process-guard` and branch protection per ONBOARDING.md —
the plugin never substitutes for it.

## What's inside

- `skills/pipeline` — the driver. `/pipeline <feature>` detects the current
  stage from repo artifacts and runs the next segment as a Workflow
  orchestration, stopping at every human gate.
- `prompts/`, `scripts/` — vendored seat templates + manifest generator
  (edit the repo originals; re-vendor on change).
- `agents/` — BOTH seat sets, so this is the only plugin you install:
  - routed seats (`spec-critic`, `acceptance-author`, `implementer`,
    `independent-reviewer`, `integration-reviewer`) carrying cross-family
    model routing (Opus critic, Sol author, GLM coder, Grok reviewer, Terra
    wiring);
  - routing-free seats (`eos-*`) for single-subscription setups.

## Seat names are the interface — bring your own models

Agent identity in Claude Code comes only from `name`, and a definition closer
to your working directory wins. So the five routed seat files in this plugin
are the **maintainer's reference routing**, not a requirement:

- **You have different models?** Shadow any seat: copy its file into your
  project's `.claude/agents/` (or `~/.claude/agents/`), keep the `name` and
  body, change the `model:` line to whatever your gateway resolves. The
  `/pipeline` skill dispatches by seat name and never hardcodes models.
- **You have no extra models?** Do nothing — the skill falls back to panel
  mode (below).
- Keep the five seat names stable: `spec-critic`, `acceptance-author`,
  `implementer`, `independent-reviewer`, `integration-reviewer`. They are the
  contract between the skill and the routing.

What holds for every installation regardless of models: fresh context per
seat, the artifact gates, process-guard, and same-family review being recorded
as a degradation rather than hidden. Cross-family review is preferred, never
required. Honesty notes: seat write scopes are checked by DIFF after each
attempt (and by process-guard in CI), not enforced by tools while the seat
works; worktree isolation isolates writes and branch state — a seat can still
READ the whole repo. T2/T3 changes are refused by the driver: seats inside one
Claude Code process do not satisfy T2/T3 harness separation (DISPATCH.md §2 is
the path).

## Two modes

1. **Routed** (preferred): a running, authenticated
  [model gateway](https://github.com/acartag7/claude-code-model-gateway)
  makes the routed seats real — the test author, implementer, and reviewer
  genuinely run on different model families. The gateway repo remains the
  infrastructure (CLIProxyAPI setup, doctor, launch) and the routing truth
  (models.yaml); the agent frontmatter here mirrors it BY HAND until the
  gateway's generator targets this directory — when models.yaml changes,
  update these files in the same change.
2. **Panel** (no gateway, single subscription): the `eos-*` seats run on the
  session model. Family diversity is honestly unavailable, so stage-6 review
  becomes a lens-diverse panel — independent fresh-context reviewers running
  the reviewer template's own lenses (A security & insecure defaults,
  B claims vs. enforcement, C wiring & integration), merged and deduped,
  any-serious-blocks. Recorded as a degradation on every log line, never
  silent.

## Boundaries (read before relying on it)

- Role instructions live in this repo's versioned `prompts/*.md` templates;
  agents carry only posture and tool scope. The skill fills templates — it
  never improvises seat prompts.
- All seats share one Claude Code process: cross-model can be real (routed
  mode), cross-harness is not. For T2/T3 changes where the process demands a
  truly separate harness, follow `DISPATCH.md` instead.
- The skill enforces nothing. process-guard + branch protection remain the
  walls; the skill just makes the compliant path the lazy path.
