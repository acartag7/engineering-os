---
name: pipeline
description: >
  Drive one small feature through the solo Engineering OS workflow: contract,
  one fresh critique, optional acceptance challenge, one implementation with tests,
  repository-owned verification, one exact-head review, and owner merge.
when_to_use: >
  "run the pipeline for <feature>", "next stage", "pipeline status", or any request
  to advance one governed slice without manually copying prompts.
argument-hint: "<feature> [stage|status]"
arguments: [feature, stage]
---

<!-- v4.1.0 · solo workflow plus fleet-audit rules from LESSONS.md L-015 through L-018. -->

# Pipeline driver

You make the compliant path easy. You do not enforce it. Required repository CI and
GitHub branch protection are the walls.

## Stage 0 — every invocation

### Status is read-only

When `stage` is `status`, inspect only. Do not create files, branches, commits, pull
requests, logs, or comments. Print the stage table below with `found`, `missing`, or
`stale`, then stop.

### Read the routing record

Use `specs/<feature>.md`, or help the owner create it when absent. It must contain:

- route: T0, T1, T2, T3, or Docs;
- one changed rule and explicit exclusions;
- affected paths and dependencies;
- repository-owned verify command;
- real entrypoint command or check;
- whether the optional acceptance challenger is required, with reason.

Stop when any product decision is open. Around 300 changed lines is a warning to ask
whether the cut is still one rule. Do not reject by line count alone.

Confirm root `BRIEF.md` exists. A slice that changes architecture, modules, or run/test
commands must include its brief update. The repository verify command includes a
language-appropriate linter or static analyzer.

T0 mechanical work uses the normal pull-request path and stops here. Docs use the
reviewer with the claims and public-safety checks. T1 through T3 use the stages below;
T1 may skip critique only when the behavior is already closed and the reason is in the
routing record. T2 and T3 never skip critique.

### Resolve templates and seats

Resolve templates from `<plugin>/prompts/`. If missing, stop with `templates missing;
reinstall the engineering-os plugin`. Never rebuild a prompt from memory.

Use these routed seats when they resolve:

```text
critic: spec-critic
challenger: acceptance-author
implementer: implementer
reviewer: independent-reviewer
checker: general-purpose
```

If routed seats do not resolve, use the matching `eos-*` seat for critic, challenger,
implementer, and reviewer. Use one seat, never a panel. Record whether the reviewer is
the same model family as the implementer; fresh context is required, cross-family is
preferred.

## Stage detection

Fetch the base and feature branch before checking remote evidence.

| Stage | Evidence |
|---|---|
| contract | `specs/<feature>.md` has a complete routing record and no open decision |
| critique | `specs/<feature>.critique.md` ends in `READY`, unless T1 records a skip |
| challenge | not required, or `specs/<feature>.challenge.md` ends in `READY` |
| implement | a pull request exists for the pushed feature branch |
| verify | pull-request evidence names `VERIFIED_SHA: <current full SHA>` and successful commands |
| review | pull-request review evidence names `REVIEWED_SHA: <current full SHA>` |
| merge | the pull request is merged |

The first missing or stale row is the current stage.

## Contract stage — owner + driver

Help the owner write the routing record and binding behavior in
`specs/<feature>.md`. Include allowed behavior, rejected behavior, wrong types, empty
values, every caller and adapter, every mutable state and exit path, and the real
entrypoint. Explanation is not binding behavior.

## Critique stage — one fresh read-only seat

Fill `prompts/critique.md` with the routing record, contract, threat notes, verify
command, and real entrypoint. Dispatch one fresh critic.

Write the structured result to `specs/<feature>.critique.md`. End with `READY` or
`NOT_READY`. Any pending decision or `NOT_READY` stops. The owner updates the contract
before another critique.

## Optional challenge stage — one fresh read-only seat

Run only when the routing record says `Acceptance challenger: required`. Fill
`prompts/acceptance-author.md` with the contract, critique, threat notes, verify
command, and real entrypoint. Dispatch one challenger.

Write `specs/<feature>.challenge.md`. It must contain three to seven hostile cases and
end in `READY`. `CONTRACT_GAP` stops and returns to the contract.

## Implementation stage — one worktree seat

Fill `prompts/implementer.md` with the exact contract, critique, optional challenge,
affected paths, verify command, real entrypoint, and repository conventions.

Dispatch one implementer in a worktree on `feat/<feature>`. It writes code and normal
tests, runs the repository verify command, commits, and pushes. It does not merge.

When the implementer reports `BLOCKED`, show the exact reason and stop. Do not route
around a contract gap.

## Verification stage — independent mechanical check

Fetch the pushed feature branch and create a temporary detached worktree at its remote
head. In that worktree:

1. run the exact repository verify command;
2. run the real entrypoint command or check;
3. confirm required suites executed rather than skipped;
4. for a bug fix, run the stated regression test without the fix and confirm it fails,
   then restore the remote head and confirm it passes;
5. inspect the full diff for unrelated paths.
6. confirm `BRIEF.md` changed when architecture, modules, or commands changed;
7. reject line-target compression or mechanical file splits.

Attach one verification comment to the pull request with the full head SHA, commands,
exit results, entrypoint result, regression proof or `not applicable`, and scope
result. Begin it with `VERIFIED_SHA: <full SHA>`. Never commit this evidence onto the
branch it attests to; that would change the SHA. Any missing, skipped, or failed
evidence stops. Clean up the temporary worktree.

## Review stage — one fresh reviewer, at most three rounds

Fill `prompts/reviewer.md` with the base SHA, exact remote head SHA, routing record,
contract, critique, optional challenge, full diff, and verification artifact.

Dispatch one fresh reviewer. Require `REVIEWED_SHA`, verdict, findings, clean areas,
and confidence. A missing reviewer result may be retried once as infrastructure
failure; it never becomes approval. A SHA mismatch is stale review and stops.

For each round:

1. P1 or P2 findings block.
2. Give all blocking findings to the implementer in one fix pass.
3. Require a sibling sweep, full-diff reread, verify rerun, commit, and push.
4. Rebuild the verification artifact for the new remote head.
5. Review the new exact head.

If round three has a P1 or P2, stop with `process-stop: repair contract or slice`.
Never run round four.

On pass, attach the review result to the pull request as a review or comment with all
findings, accepted P3 items, clean areas, confidence, and this line:

```text
REVIEWED_SHA: <full exact head SHA>
```

Never commit the review result onto the branch it reviews; that would make it stale by
construction. Any later push makes stage detection mark the PR evidence stale.

## Merge stage — owner

Show the owner:

- current head SHA;
- required CI results;
- verification commands and real-entrypoint result;
- review SHA, verdict, and round count;
- accepted P3 items;
- any prompt-only or audit-only limitations.

The owner decides and merges. Do not fabricate another human approval. Do not merge a
stale review, failed check, missing entrypoint result, or unresolved P1/P2.

## After a failure

Draft a class-level five-line `LESSONS.md` entry. Do not publish private repository
details, private paths, personal email, internal system names, or identifying incident
numbers. The owner decides what becomes a check.
