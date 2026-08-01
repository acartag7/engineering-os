# Speed vs. Safety Policy

The route depends on what can go wrong. It does not depend only on line count.

## Change tiers

| Tier | Meaning | Examples |
|---|---|---|
| **T0** | Mechanical, no behavior change | rename, formatting, dependency update |
| **T1** | Ordinary behavior change | feature, UI, business logic without a security decision |
| **T2** | Security or sensitive-data decision | login, permissions, tenant separation, secrets, network access, writes |
| **T3** | New or unusually dangerous boundary | untrusted parser, policy engine, authorization state machine, irreversible operation |
| **Docs** | User- or operator-facing writing | README, guide, API documentation |

Before coding, confirm that the slice changes one clear rule, has no open decision,
lists every affected path, and can be reviewed in one sitting. Around 300 changed
lines is a warning to check the cut, not a block.

## Required path

| Step | T0 | T1 | T2 | T3 | Docs |
|---|---|---|---|---|---|
| Small contract | — | when behavior is not already clear | required | required | claims list |
| Fresh critique before code | — | recommended | required | required | — |
| Implementations | 1 | 1 | 1 | 1 | 1 |
| Tests | existing checks | code + tests | code + tests | code + tests | link or rendering checks |
| Acceptance challenger | — | — | owner may add | recommended for a novel or irreversible boundary | — |
| Independent final review | CI/bot | one fresh reviewer | one fresh reviewer | one fresh reviewer | claims against source |
| Real entrypoint | when relevant | required | required | required | examples when relevant |

The acceptance challenger is not a second implementer. It proposes a few hostile test
cases before or during implementation. It is used only when the risk justifies the
extra seat.

## Routing record

Put this in the spec or pull request:

```text
Route: <T0 | T1 | T2 | T3 | Docs>
Reason: <why>
Slice: <one rule changed; explicit exclusions>
Verify command: <repository-owned command>
Real entrypoint evidence: <command or not-applicable reason>
Acceptance challenger: <required | not required, with reason>
Review: <reviewer + exact commit SHA, filled before merge>
```

**Enforcement: prompt + monthly audit. The repository's verify command is HARD only
when branch protection requires it.**

## One implementation

Normal product work uses one implementation. Multiple candidates consume owner
attention and do not repair an incomplete contract. Use competing implementations
only for a named model evaluation with a fixed comparison plan.

## Review limits

- Target one or two substantive rounds.
- Round three stops the change. Update the contract or cut a smaller slice.
- Keep at most two pull requests in active review for one owner.
- Re-review the exact new head after every fix push.

**Enforcement: prompt + monthly audit; mechanical fleet-wide gates are not built yet.**

## Language-neutral verification floor

Every repository provides one command that performs the checks appropriate to its
language and runs the real shipped entrypoint where practical. CI runs that exact
command. A type check is used when available; it is not a universal requirement.

The command must cover:

- formatting checks;
- a language-appropriate linter or static analyzer;
- tests, with required suites proving they executed;
- build or package creation;
- the real command, service, library, or installed artifact;
- supply-chain and secret checks required by the repository tier.

The static check is mandatory, but the tool is not universal. Go may use `go vet`
and a repository-selected linter; Python may use Ruff; TypeScript may use Biome or
ESLint with rules for ignored promises. External tools and CI actions use exact,
reviewed versions. **Enforcement: the required repository `verify` check.**

## Trust-boundary rules

- Reject a request that carries more than one value for a security-relevant HTTP
  header, including credentials, cookies, API keys, and forwarded identity. Do not
  choose the first or last value. Return a fixed reason code. Each HTTP boundary has
  a negative test proving the duplicate is rejected.
- Error reason codes use a closed language type, such as an enum or union. A free-form
  string field is not an error-code type. The type checker or compiler catches typos;
  review checks the boundary when the language cannot express the rule directly.
- Every security claim using words such as `fail closed`, `never`, `always`, or
  `cannot` points to a test that fails if the protection is removed. Build the test
  before publishing the claim.

**Enforcement: boundary tests + repository static checks + independent review. A
repository without the named negative tests has a declared baseline gap.**

## Readability over line counts

File length is a signal to consider a split around a real domain concept. Never join
statements, compress declarations, or create mechanical `part2` or `internals` files
to satisfy a line target. A longer cohesive file is safer than two fragments that
hide one concept. **Enforcement: prompt + independent review.**

## Small frozen-contract amendment

A repository that opted into frozen contract tests may change a small contract and
its code in one pull request. The pull request states what behavior changes, why, and
which frozen tests move. Only externally visible behavior belongs in the frozen set;
implementation structure does not. Hash checks still run. This fast path reduces the
ceremony, not the protection. **Enforcement: `process-guard` hash check + review.**

## Bug-fix proof

A bug fix adds a test that fails when the fix is removed. Record the failing command
and the passing command. Broad mutation testing remains a periodic report because it
is too slow and noisy to block every pull request.

## Production changes

Green software tests do not authorize a live operation. Repositories that change live
state separately record the target, deployed revision, starting conditions,
authorization, stop condition, rollback, and result.

**Enforcement: not yet fleet-wide. Each operational repository must add its own
runtime gate before claiming this is enforced.**
