# Test Engineering OS in three outside repositories

Status: planned

I have used Engineering OS in my own projects. The next question is whether another
developer can use it without me running the process for them.

## The test

1. Add Engineering OS to three repositories I do not own.
2. Watch five real changes in each repository.
3. Measure setup time, extra work, review, and where problems are found.
4. Stop helping after the first change.
5. Continue only if at least two developers keep using it without me.

This plan is **written before the test**. If I change it after a repository starts, I
will record the change and use it only for later repositories.

## Which repositories qualify

Each repository must:

- be maintained by someone other than me;
- already use pull requests and CI;
- expect at least five real changes during the test;
- have one developer willing to take part;
- allow me to collect review and timing numbers;
- say whether its name may be published.

The three repositories should not all use the same language, belong to the same
codebase, or depend on one developer.

## Before setup

Where possible, record the previous five similar changes:

- changed lines and files;
- time from pull request opening to merge;
- human and AI reviews;
- CI reruns;
- problems found and where they were found;
- reverts, urgent fixes, or known bugs found within 30 days.

If there are no similar changes, say “no baseline.” Do not invent one.

## Measure setup

Record:

- minutes the developer actively spends;
- total time until setup works;
- changes to CI and GitHub settings;
- time to add `process-guard`;
- time to add the first protected acceptance tests;
- errors, special cases, and failed attempts;
- time until the first protected pull request can merge.

I may explain the method during setup and the first change. After that, choosing the
route, running the steps, or fixing the workflow for the developer counts as my help.

## Watch five real changes

Do not create fake work for the test.

For every change, record:

- what changed;
- why the developer chose a light or strict route;
- how many rules and code paths changed;
- time spent planning;
- implementation time when it can be measured;
- time from pull request opening to merge;
- review rounds;
- times I had to step in;
- CI reruns and noisy checks;
- problems found while planning, writing tests, coding, running CI, reviewing, or
  after merge;
- how serious the developer thought each problem was;
- whether removing a fix made its new test fail;
- skipped checks, overrides, or abandoned work;
- one short note from the developer about friction.

No findings is a valid result. More files and tests do not automatically mean more
value.

## Stop helping

After the fifth change:

1. I stop reminding the developer to use Engineering OS.
2. I watch for 45 days or three more changes, whichever comes first.
3. I record whether they keep, change, or remove the method.
4. I ask once what was useful and what was annoying.

A developer counts as continuing without me only if they choose a route and ship at
least one later change without me running the steps.

## What the report will show

| Question | Numbers |
|---|---|
| How hard was setup? | active minutes, total time, errors, special cases |
| How much work did it add? | developer time, reviews, CI reruns, overrides |
| How long did changes take? | planning time, implementation time, review time |
| What did it catch? | confirmed problems, where found, seriousness |
| What went wrong? | noisy checks, false green results, skipped checks, bugs after merge |
| Did people keep it? | later use, changes to the method, removals |

Do not add minor and serious findings into one “bugs prevented” total.

## The stop rule

Continue trying to spread the method only if:

- at least two developers use it again without my help; and
- I publish results for all 15 changes, including failures and abandoned work.

If this does not happen, Engineering OS stays my internal method and a public record
of what I learned. That is still a useful result.

## What gets published

- this plan and every later change to it;
- one report for each repository;
- one final report across all three;
- the numbers, or anonymous numbers where the repository must stay private;
- the developer’s own view of the added work;
- cases where normal CI or review probably would have found the same problem.

Never publish private code, credentials, employer or customer details, or instructions
that create a new security risk.
