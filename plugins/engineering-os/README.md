# engineering-os plugin

The `/pipeline` helper drives one small change through the solo Engineering OS path:
contract, one fresh critique, optional acceptance challenge, one implementation with
tests, repository-owned verification, one exact-head review, and owner merge.

It removes manual prompt copying. It does not replace required CI or branch
protection.

## Install

```text
/plugin marketplace add acartag7/engineering-os
/plugin install engineering-os@engineering-os
```

## What it uses

- `skills/pipeline` — stage detection and dispatch.
- `prompts/` — copies of the canonical repository prompts; CI checks exact parity.
- `agents/` — routed seats plus routing-free fallbacks.

The normal path uses one critic, one implementer, and one reviewer. The acceptance
challenger runs only when the owner marks the slice as unusually dangerous. There are
no default panels, competing implementations, or frozen-test stage.

Each project declares its own verify command and real entrypoint in `AGENTS.md` and
`CLAUDE.md`. The plugin runs those commands; it does not assume TypeScript, `pnpm`,
`src/`, or `test/acceptance/`.

The verify command includes the linter or static analyzer that fits that language.
The project also keeps a root `BRIEF.md`; architecture, module, and command changes
update it in the same pull request.

Fresh reviewer context is required. A different model family is preferred. When only
one model provider is available, the fallback reviewer remains a separate fresh seat
and the limitation is reported honestly.

The plugin never merges by itself. The owner sees the exact head, CI, verification,
and review result, then decides.
