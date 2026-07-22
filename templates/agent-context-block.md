# Agent Context Block

Copy the block below into each governed repository's `CLAUDE.md` and `AGENTS.md`.
Different tools read different files, so keep both. Set the repository tier.

```markdown
## Engineering OS rules

tier: <S | I | X>
Reference: https://github.com/acartag7/engineering-os

Follow every rule below. CI hard-enforces the frozen-test and repository checks; review
and audit check the remaining process rules.

- **Binding rules:** `contracts.md` defines required behavior. Background text cannot
  add requirements. Do not code through an open decision or an out-of-repo reference.
- **Frozen acceptance tests:** Do not edit frozen test files under
  `test/acceptance/`. The only implementer edit allowed there is activating a completed
  phase in `test/acceptance/phases.json`. If a test conflicts with the contract, STOP
  and start the contract-and-test correction process.
- **Trust boundaries:** Use explicit allowlists. Validate before side effects. Treat
  empty configuration as missing. Type-check external values. Reject malformed input;
  do not process it partially.
- **Keep the design small:** Do not add parsers, validators, abstractions, or helpers
  the contract does not require. If the simple design is insufficient, STOP and ask
  for a contract decision.
- **Check similar code:** After fixing a defect, check every similar code path before
  asking for re-review. Fix it or record why it is not affected.
- **Do not weaken controls:** Never weaken a safety check to make tests pass.
- **Git:** Use a feature branch. Never push to a protected branch. Use conventional
  commit subjects and include `Spec: <path>` in the PR.
- **Review:** Review confirms the contract. If review discovers a missing product
  decision, report a contract/spec gap instead of continuing a fix-until-green loop.
- **Production:** Green software tests do not authorize a production action. Keep
  per-run authorization and observed production evidence separate.
```
