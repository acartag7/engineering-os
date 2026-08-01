# Engineering OS

**A small, honest delivery process for a solo developer using AI.**

Engineering OS gives one developer independent checks without pretending a second
human maintainer exists. It works with Go, Python, Rust, Java, TypeScript, and other
languages because each repository owns its verification command.

## The normal path

```text
Small contract
    ↓
One fresh critique
    ↓
One implementation with tests
    ↓
Run the repository's real verification command
    ↓
One fresh review of the exact final commit
    ↓
The owner decides and merges
```

The owner is the only required human. GitHub checks must pass, but GitHub does not
require approval from another human when there is no other maintainer.

## What this prevents

- Large tasks that turn review into design work.
- An implementer approving its own assumptions.
- Green unit tests hiding a broken installed command or service.
- A review becoming stale after another push.
- TypeScript-specific setup blocking a Go or Python repository.
- Review continuing for many rounds because nobody stops to fix the contract.

## The limits

- Aim for one clear rule per pull request. About 300 changed lines is a warning to
  re-check the cut, not an automatic rejection.
- Keep at most two pull requests in active review.
- Stop after the third substantive review round. Fix the contract or cut a smaller
  slice before continuing.
- Use one implementation. Multiple candidates are for explicit model evaluations,
  not normal delivery.
- Use a separate acceptance challenger only for unusually dangerous work. The
  challenger proposes a few hostile cases; it does not create a large frozen suite.

The slice, review-round, and work-in-progress limits are currently prompt and audit
rules. They are not yet fleet-wide CI checks.

## Language-neutral verification

Every governed repository exposes one command that CI and local development both run.
Examples:

| Project | Repository-owned command may run |
|---|---|
| Go | formatting, `go vet ./...`, `go test ./...`, `go build ./...`, real command smoke test |
| Python | formatter/linter, static checks, `pytest`, package or command smoke test |
| Rust | formatting, `clippy`, `cargo test`, build, binary smoke test |
| TypeScript | lint, type check, tests, build, installed command or application smoke test |

Engineering OS calls the repository command. It does not guess the language, package
manager, source directory, or test layout. See [`ONBOARDING.md`](ONBOARDING.md) for a
working Go example.

Each governed repository also keeps a short root `BRIEF.md`: what the project solves,
how one real action moves through it, its important paths, sharp edges, working
commands, and next milestone. This gives a solo owner a five-minute way back into the
project after time away.

## Optional frozen-test guard

[`process-guard`](process-guard/) remains available for repositories that deliberately
keep hash-frozen acceptance tests. It is not the default onboarding path. Its current
contract-change escape hatch is broad, so installing it is an explicit choice with a
named limitation.

## Where to go next

| Need | Read |
|---|---|
| The source-of-truth workflow | [`OS.md`](OS.md) |
| Start one change | [`DISPATCH.md`](DISPATCH.md) |
| Choose the risk level | [`POLICY.md`](POLICY.md) |
| Add a repository, including Go | [`ONBOARDING.md`](ONBOARDING.md) |
| Understand or create its five-minute map | [`templates/project-brief.md`](templates/project-brief.md) |
| Copy the agent rules | [`templates/agent-context-block.md`](templates/agent-context-block.md) |
| See every control and its origin | [`BASELINE.md`](BASELINE.md) and [`LESSONS.md`](LESSONS.md) |
| Use the optional Claude Code helper | [`plugins/engineering-os/`](plugins/engineering-os/) |

## Plain language

All project writing uses plain, easy English. Technical terms are used only when
accuracy needs them and are explained the first time. Exact code names and commands
stay exact.

## License

Apache-2.0.
