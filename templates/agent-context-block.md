# Agent Context Block

Copy the block below into each governed repository's `AGENTS.md` and `CLAUDE.md`.

```markdown
## This repository uses Engineering OS

tier: <S | I | X>
verify: <one repository-owned command>
real entrypoint: <command, service check, or library smoke test>
reference: https://github.com/acartag7/engineering-os

Repository rules:

- Use plain, easy English. Use technical terms only when accuracy needs them and
  explain them the first time. Keep exact code names and commands exact.
- Keep one pull request to one clear rule that one reviewer can understand. Around
  300 changed lines is a warning to check the cut, not an automatic rejection.
- Never compress code or make a mechanical file split to satisfy a line target.
- Resolve open decisions in the contract before coding when the effective profile or
  route requires a contract.
- Use one implementer. The implementer writes code and normal tests together.
- Use an independent test author before implementation when strict routing or the
  configured independent-test coverage requires it.
- For a bug fix, prove the new test fails when the fix is removed.
- Run the repository's declared verify command and real entrypoint before claiming
  completion. Report actual output; never report green from memory.
- Include a language-appropriate linter or static analyzer in the verify command.
- Use the profile-selected final reviewer on the exact final commit. Basic uses owner
  review, or CI for T0; standard and strict use a fresh independent reviewer. Any
  later push makes that review stale.
- P1 and P2 review findings block. The configured final substantive review round
  stops the change; three is the maximum. Fix the contract or cut a smaller slice.
- After a defect, sweep sibling paths before requesting review again.
- Never weaken a check to get green. Never push directly to a protected branch.
- Security and sensitive-data decisions fail closed, use allowlists, validate
  untrusted values before side effects, and cover every mutable state and exit path.
- Reject duplicated credential or identity headers at every HTTP boundary. Use closed
  error reason-code types. Every written security guarantee points to a test.
- Keep root `BRIEF.md` current when architecture, modules, or run/test commands change.

Enforcement note: required CI and branch protection make the configured verify
command a hard gate. All remaining rules are prompt and audit rules unless this
repository names its own mechanical check for them.
```
