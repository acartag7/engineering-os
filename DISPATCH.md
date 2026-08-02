# Start and run one change

Use the `engineering-os` skill in `start` mode. It inspects the repository, reads
`engineering-os.json`, and asks one unresolved question at a time.

## What it closes before code

The routing record names:

- the changed behavior and explicit exclusions;
- route T0, T1, T2, T3, or Docs;
- the effective `basic`, `standard`, or `strict` profile;
- affected files, callers, adapters, and mirror paths;
- risk boundaries and production effects;
- repository verify command and real entrypoint proof;
- actual provider instances for critic, test author, implementer, and reviewer;
- documentation changes and known gaps.

Do not code while a product decision remains. About 300 changed lines is a warning to
recheck the cut, not a reason to compress code.

## Roles

Use one implementation. `standard` uses a fresh critic and fresh final reviewer.
`strict` also uses an independent test author before implementation. T2 and T3 always
use strict.

A provider may be a named human, fresh AI session, or multi-agent seat. Multi-agent
support is not required. When it is unavailable, the skill prepares the exact prompt
and evidence package for a fresh session. The final reviewer is a different provider
instance from the implementer and other independent roles.

## Evidence order

1. Close the contract when the effective route or profile requires one.
2. Run a fresh critique when the effective route or profile requires one. Basic T0
   work with already-clear behavior does not need a contract or fresh critique.
3. For strict work, add small independent behavior tests and prove they fail at the
   pre-implementation commit.
4. Write one implementation and its normal tests.
5. Run the repository verify command and real entrypoint.
6. Review the full diff at the exact current commit SHA.
7. Let the owner decide whether to merge.

A later push makes verification and review stale. P1 and P2 findings block. At the
configured last review round, an unresolved P1 or P2 returns the exact token
`process-stop`. Another push does not clear the stop; repair the contract, cut a new
slice, or abandon the work.

## Status

Use the skill in `status` mode to inspect existing evidence. Status never runs a
repository command and never changes a file, branch, comment, pull request, or other
state. Missing or invalid configuration is the reported blocker.

## Discovery lane

When the behavior cannot be specified because source facts are missing, do one
bounded read-only discovery pass. Record the question, owner, time or scope bound,
permitted environment, prohibited actions, referenced experiments, observations, and
stopping condition. Discovery ends in an explicit decision or blocker and returns to
the contract. It does not become implementation, merge an experiment, deploy, use
production credentials, mutate production, or authorize a write.

## When the process fails

Add one public, class-level lesson only after the owner approves it. State what
happened, where in general, how it was found, the defect class, and the check or rule
it changed. Do not publish identifying details from private work.
