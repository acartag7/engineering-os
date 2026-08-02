# Onboarding a repository

Use the `engineering-os` skill. It makes this process discoverable while you use it:
it inspects the repository, asks only unresolved questions, recommends defaults, and
explains what every choice enables, costs, weakens, and leaves unchanged.

The skill is not a command-line program with a model inside it. The AI host does the
inspection and conversation. A small Node script checks the final configuration
without making recommendations.

## What the skill asks

It evaluates project purpose, languages, shipped entrypoint, real test and build
commands, security boundaries, available humans or AI sessions, workflow strictness,
CI, branch protection, project documentation, migration state, and final confirmation.

It asks one short question at a time. The recommended answer comes first. Facts proved
by source are shown for correction instead of asked again.

## Recommended solo default

- profile: `standard`;
- critic: fresh AI session;
- implementer: current session;
- reviewer: a different fresh AI session;
- independent tests: required for T2/T3, security boundaries, and bug fixes;
- review limit: three rounds;
- active pull requests: two;
- `process-guard`: off.

This gives one owner independent judgment without pretending another human exists.
Teams may use named humans. Hosts with multi-agent seats may use them. Neither is
required.

## Complete output

After the owner confirms one complete preview, onboarding creates or proposes:

1. validated root `engineering-os.json`;
2. a real `BRIEF.md` from `templates/project-brief.md`;
3. clear `AGENTS.md` and `CLAUDE.md` instructions for supported hosts;
4. one repository-owned verify command;
5. CI that runs verify and configuration validation;
6. branch protection that requires the checks;
7. proof still missing.

The skill does not silently install a dependency, overwrite a file, change GitHub
settings, or run a live operation. CI and branch protection are proposals until a
separately authorized action changes and verifies them.

## Verification command

The repository owns one command, such as `./scripts/verify` or `make verify`. It uses
the language's real tools and runs at least the tests. It also proves the shipped
entrypoint where practical.

The process does not assume TypeScript, `pnpm`, `src/`, `package.json`, or a special
test directory. Examples:

| Project | Repository-owned command may run |
|---|---|
| Go | formatting, `go vet`, tests, build, real command |
| Python | formatter or linter, static checks, tests, package or command |
| Rust | formatting, `clippy`, tests, build, binary |
| TypeScript | lint, type check, tests, build, installed command or application |

When no tests exist, onboarding names that gap and proposes the smallest real test.
A pure library uses a public API integration test as its closest real entrypoint and
records why.

## Go example

The working fixture at `test/fixtures/go-project` runs:

```bash
gofmt -l .
go vet ./...
go test ./...
go build ./...
go run ./cmd/demo
```

Run `test/fixtures/go-project/scripts/verify` to prove the example. `go vet` inspects
Go code for suspicious mistakes. The final command exercises the real demo entrypoint.

## Configuration check

Before creating the file, send the complete proposed JSON to the validator through
standard input:

```text
node <engineering-os-skill>/scripts/validate_config.mjs --stdin
```

This checks the candidate without creating a temporary configuration file.

After writing the confirmed file, run from the repository root:

```text
node <engineering-os-skill>/scripts/validate_config.mjs engineering-os.json
```

The validator is read-only and prints one fixed result. Without Node, the skill can
review the same fields, but onboarding remains incomplete until required CI runs the
deterministic validator.

## Moving from the old process

Use the skill's migration mode. Phase one adds and proves the new verify path while
all old checks remain. Phase two removes only owner-approved old files after proof
shows the new verify check is green at the current commit and required by branch
protection. Read every old test before deciding to keep, protect, rewrite, or remove
it. Missing proof blocks cleanup.

## Completion proof

Onboarding is complete only when local verify passes, CI passes at the current commit,
branch protection requires it, the real entrypoint ran, configuration validation
passes, host instructions exist, and `BRIEF.md` names the real project and commands.
