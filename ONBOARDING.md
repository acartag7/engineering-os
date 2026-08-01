# Onboarding a Repository

Engineering OS does not need to know the repository's programming language. The
repository owns one verification command; CI runs it.

## Decisions the owner makes

1. Choose the project tier: S, I, or X.
2. Name the default branch and real shipped entrypoint.
3. Choose the one local verification command.
4. Decide which security or sensitive-data areas need threat notes.
5. Confirm the repository has one human owner or name the actual maintainers.

## Setup

1. Create `BRIEF.md` from `templates/project-brief.md` and replace every placeholder
   with the repository's real files and commands.
2. Copy `templates/agent-context-block.md` into both `AGENTS.md` and `CLAUDE.md`.
3. Add the repository-owned verify command, such as `./scripts/verify` or
   `make verify`.
4. Make CI run that same command in a job named `verify`.
5. Protect `main` with pull requests and required checks. A solo repository keeps
   required human approvals at zero; independent AI review is recorded separately.
6. Run the command locally and through the real entrypoint before onboarding is
   called complete.

If the account cannot enforce required checks, record that gap. Never describe a
visible but bypassable check as a hard gate.

## Go example

This repository includes a working example at `test/fixtures/go-project`.
Its `./scripts/verify` command runs:

```bash
gofmt -l .
go vet ./...
go test ./...
go build ./...
go run ./cmd/demo
```

The final command is the smoke test for the real entrypoint. A real project replaces
`./cmd/demo` with its shipped command or service check.

Here, `go vet` is the static analyzer: it catches suspicious Go code without assuming
a JavaScript or Python tool. A Go project may add a pinned linter when its risks need
stronger checks.

A minimal CI job is:

```yaml
verify:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@<full-commit-sha>
    - uses: actions/setup-go@<full-commit-sha>
      with:
        go-version-file: go.mod
    - run: ./scripts/verify
```

Pin actions to reviewed commit SHAs in the actual repository. Do not copy a moving
tag from an example.

## Other languages

The shape stays the same:

- Python may run linting, static checks, `pytest`, package build, and its command.
- Rust may run formatting, `clippy`, tests, build, and its binary.
- TypeScript may run linting, type checking, tests, build, and the installed command
  or application.

Engineering OS calls the repository command. It does not add a central language
switch or assume `src/`, `test/acceptance/`, `package.json`, or `pnpm`.

## Optional `process-guard`

Do not install `process-guard` by default. It is only for repositories that choose
hash-frozen acceptance tests. Read its README and open limitation before opting in.

## Completion proof

Onboarding is complete only when:

- the local verify command passes;
- the CI `verify` job passes;
- branch protection requires it;
- the real entrypoint was exercised;
- the agent context exists in both supported instruction files;
- `BRIEF.md` names the real project shape and working commands.
