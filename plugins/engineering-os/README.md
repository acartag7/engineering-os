# engineering-os plugin

The plugin ships the configurable Engineering OS skill for Claude Code. It can
onboard a repository, explain or change its workflow, migrate the old process, start
one change, and report read-only status.

## Install

```text
/plugin marketplace add acartag7/engineering-os
/plugin install engineering-os@engineering-os
```

Then ask:

```text
Use the engineering-os skill to onboard this repository and explain every recommendation.
```

## What it uses

- `skills/engineering-os` — exact copy of the canonical skill, references, starter
  configuration, and deterministic validator;
- `skills/pipeline` — compatibility forwarder for old `/pipeline` requests;
- `prompts/` — canonical role prompts with byte-parity checks;
- `agents/` — optional routed seats and routing-free fallbacks.

Multi-agent seats are optional. A named human or fresh AI session can fill an
independent role. The normal recommended profile is standard. T2 and T3 always use
strict, which adds an independent test author before one implementation.

Each project owns its verify command and real entrypoint. The skill does not assume a
language, package manager, source directory, or test layout. It never merges by
itself. Required CI and branch protection remain the walls; the owner decides.

**Enforcement: route selection, providers, and required roles are prompt guidance
plus pull-request evidence and monthly audit. Configuration validation and repository
verification are hard only when required by branch protection; no fleet-wide check
enforces the complete workflow.**
