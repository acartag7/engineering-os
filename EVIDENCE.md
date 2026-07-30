# What we have seen so far

Engineering OS came from real mistakes. This page shows what happened in two projects,
what improved, and what is still unknown.

Both projects are mine. This is useful evidence from real work, but it does not yet
show that the method works for other developers.

## How I counted

- **Changed lines** means additions plus deletions reported by GitHub.
- **Submitted reviews** means Codex pull-request review submissions. One submission
  can contain several findings.
- **Reviews with findings** means submitted reviews that returned at least one
  finding.
- **Findings** means Codex comments attached to changed lines.
- **Review time** means the time from opening a pull request to merging it. Work done
  before the pull request opened is not included.
- Dependency updates and release-only pull requests are left out.

I collected the numbers on July 29, 2026. The saved totals are in
[`evidence/2026-07-internal-cases.json`](evidence/2026-07-internal-cases.json).

## Project one: a public security library

### A real bug turned into the wrong-sized fix

An AI audit found a real JavaScript bug. A safety option could be inherited from
another object instead of being set directly. The real fix was four lines across three
files.

The bug was worth fixing, but an outside attacker could not reach it without already
running code inside the server.

I then let the same AI fix this kind of bug “everywhere,” without watching it. The task
had no clear end.

| What happened | Number |
|---|---:|
| Files changed | 104 |
| Lines added | 6,900 |
| Lines deleted | 1,461 |
| Total changed lines | 8,361 |
| Time before I closed it | about 5.4 hours |
| Result | closed without merging |

The new protection eventually repeated the same bug inside itself.

The AI did a good audit. My mistake was giving it an endless task without first asking:

- Can an attacker reach this?
- How serious is it?
- Which files really need the fix?
- When must the AI stop?

The full story is in the
[published article](https://dev.to/acartag7/a-4-line-security-fix-turned-into-a-100-file-pull-request-and-i-nearly-merged-it-1gkf)
and [PR #88](https://github.com/acartag7/mcp-sso/pull/88).

### A deep release review found a lot

Before release 0.3.0, I deliberately ran a deep security review across the repository.
This was planned release work, not a normal feature that went wrong.

| What happened | Number |
|---|---:|
| Product and process pull requests | 15 |
| Submitted reviews | 110 |
| Average submitted reviews per pull request | about 7.3 |
| Findings in the final audit | about 186 |
| Highest submitted-review counts | 29 and 27 |
| Other high submitted-review counts | 12 and 12 |

The review found many real problems. It also showed that code review was still filling
gaps in plans and tests that had looked finished.

### Reviewing the rule first helped

The project needed one redirect rule to work the same way in nine places. I reviewed
the rule before writing the code.

| Work | Changed lines | Submitted reviews with findings | Findings | Review time |
|---|---:|---:|---:|---:|
| [Rule and plan](https://github.com/acartag7/mcp-sso/pull/111) | 1,031 | 27 | 49 | 11.4 h |
| [Code and tests](https://github.com/acartag7/mcp-sso/pull/116) | 1,546 | 3 | 3 | 0.88 h |

The code pull request added 770 test lines and connected the rule to all nine places.
Its three findings were narrow:

1. apply the redirect limit when reading old stored data;
2. do not apply that redirect-only limit to a different field;
3. remove an old warning from the documentation.

Review did not discover a new kind of redirect input. Most of that discovery had
already happened while reviewing the rule.

Compared with the plan, the code needed about 89% fewer reviews and produced about 94%
fewer findings.

This does not prove that the plan caused the improvement. It is still a strong sign
that hard questions were answered earlier.

It also shows why line count alone can mislead. A change may contain many test cases
and still be one clear rule. The better questions are:

- How many rules change?
- How many parts of the program must agree?
- Are any decisions still open?
- Can one reviewer understand the whole change?

### A small, clear security fix

[PR #110](https://github.com/acartag7/mcp-sso/pull/110) stopped two login pages from
being placed inside a hostile web page.

| What happened | Number |
|---|---:|
| Changed lines | 131 |
| Files | 5 |
| Reviews with findings | 1 |
| Final review | clean |
| Review time | 2.55 h |

Before review, the pull request named both affected pages, how three web adapters pass
their headers through, what the built package must contain, and which tests must fail
if the fix is removed.

The change was small, but the more important point is that its edges were known.

### What `process-guard` checks

`process-guard` is a core part of Engineering OS. When GitHub requires it before
merge, it checks that:

- acceptance tests existed before the code change;
- protected tests still match their saved hashes;
- code and the tests judging that code did not quietly change together;
- the Git history and saved test list are valid.

It caught real mistakes while I used it.

There is also a deliberate way to correct a wrong acceptance test. I normally do this
in a separate pull request containing the updated rule and tests, merge that first,
and only then continue the code change.

Today the guard sees a changed contract file as the signal that this correction is
allowed. That signal is too broad: a same-PR AI change can edit both the contract and
tests. The hashes and history checks still work, but the guard cannot prove that I
personally approved the correction.

That open problem is tracked in
[issue #12](https://github.com/acartag7/engineering-os/issues/12).

## Project two: a private internal gateway

July 22, 2026 is the dividing line.

Before that date, I mostly let AI generate the project through direct commits. The
design changed while the code changed. There was no stable process. I treat that work
as the “before” picture, not as evidence for Engineering OS.

### The July 22 reset

Before starting the new implementation, I added:

| Planning work | Number |
|---|---:|
| Files changed | 35 |
| Lines added | 13,116 |
| Lines deleted | 107 |
| Main contents | rules, threat notes, implementation notes, reviews, test harness |

The line count is not a success measure. Much of it was saved AI review output and
test machinery. What mattered was that choices and disagreements were written down
before coding.

### One change was still far too big

The first large write feature after the reset combined too many rules and code paths:

| What happened | Number |
|---|---:|
| Changed lines | 6,565 |
| Files | 46 |
| Commits | 44 |
| Submitted reviews | 43 |
| Findings | 129 |
| Pull-request review time | about 25.4 h |

This is important: a detailed plan did not save a badly sized task.

### The next 16 changes

After that, I reviewed the plan, tests, and code separately and more carefully.

| What happened | Number |
|---|---:|
| Total changed lines | 22,329 |
| Middle change size | about 1,264 lines |
| Total reviews with findings | 33 |
| Middle review count | 2 |
| Total findings | 39 |
| Middle finding count | 2 |
| Middle review time | about 0.98 h |

These were not tiny changes. The good result is that final review usually checked
decisions that were already made instead of designing the feature one comment at a
time.

Compared with that first oversized change, the middle of the next 16 was about 81%
smaller by changed lines, had about 98% fewer inline findings, and spent about 96%
less time open as a pull request. This is an outlier-to-middle comparison, not proof
that the process caused the change.

The repository is private today and may become public later without its full history.
Before then, I will publish a smaller evidence file that lets readers check the totals
without exposing private code.

## What I think the evidence says

In these two projects:

- reviewing plans before code found important missing cases;
- tests that fail again when a fix is removed were much more trustworthy than tests
  that only pass after the fix;
- a required GitHub check caught process mistakes that written instructions did not;
- clear, finished rules were followed by much shorter code review;
- detailed planning still failed when a task covered too much;
- I still had to decide whether a threat was reachable, whether a fix was worth its
  cost, and when the AI must stop.

My claim today is:

> Engineering OS makes AI-assisted changes easier to inspect, blocks several known
> ways that tests and code can move together, and helped move hard questions earlier
> in two projects I run.

I do not yet know whether it works as well for other developers or whether it reduces
bugs after release compared with good CI and good review.

## Limits of these numbers

- I own both projects.
- The projects and changes are different.
- Review time leaves out work done before opening the pull request.
- More findings do not always mean more serious bugs.
- Finding a bug does not prove that Engineering OS was the reason it was found.
- Readers cannot yet check the private project history.

[`PILOT.md`](PILOT.md) explains how I plan to test the method with other developers.
