# Codex for Open Source — application notes

Working notes for an application to OpenAI's
[Codex for Open Source](https://developers.openai.com/community/codex-for-oss)
program. Everything here must stay verifiable from the public repository; update
the evidence section before applying.

## Repository

https://github.com/micha16372/everyday-runtime

## Role

Primary Maintainer ([@micha16372](https://github.com/micha16372), see [MAINTAINERS.md](../MAINTAINERS.md))

## Public project summary

Everyday Runtime is an MIT-licensed, self-hosted shopping assistant built as a
[Twenty](https://twenty.com) app. Households record what they happen to know —
bought, used, empty, still there, needed — and a deterministic engine estimates
what is probably needed, with a confidence and a one-line reason (“Milk — probably
low · 89% · last purchased 6 days ago, usual interval ~5 days”). Since 0.2.0 it
accounts for purchase quantities and learns from “Empty” / “Still have it”
corrections. All data stays in the household's own Twenty workspace.

## Why this repository matters

<!-- max. 500 characters; currently 431 -->

Self-hosted, privacy-first shopping assistant for households. A deterministic, unit-tested engine estimates what is probably needed from partial observations, with confidence and a plain-language reason, and never fakes exact inventory. Runs as a Twenty app without AI or telemetry; open data (Open Food Facts) only on request; GET /s/needs offers an integration surface. Maintained in public: releases, CI, CodeQL, triaged issues.

## API credit usage

<!-- max. 500 characters; currently 349 -->

PR review and issue triage for contributions, generating and extending engine tests, regression analysis when inference rules change, release notes and changelog drafting, dependency-update review. Later, optional and opt-in: receipt parsing and natural-language capture ("we're out of milk"). The core product stays fully usable without any AI API.

## Current evidence

Collected from the GitHub API on **2026-09-26 17:31 UTC**.

| Signal | Value |
| --- | --- |
| Repository created | 2026-09-26 |
| Stars | 0 |
| Forks | 0 |
| Watchers | 0 |
| Open issues | 8 (roadmap and contributor issues, labelled) |
| Closed issues | 2 (#2, #3 — shipped in 0.2.0) |
| Pull requests | 7 merged (3 feature/maintenance by the maintainer, 3 Dependabot updates reviewed and merged, 1 release), 1 Dependabot PR declined with reasoning (#13) |
| Releases | 2 — [v0.1.0](https://github.com/micha16372/everyday-runtime/releases/tag/v0.1.0), [v0.2.0](https://github.com/micha16372/everyday-runtime/releases/tag/v0.2.0) |
| CI on `main` | passing (lint, typecheck, 89 unit tests, 3 integration tests against a real Twenty instance, dependency review, CodeQL) |
| Security | policy, private vulnerability reporting, secret scanning + push protection, Dependabot alerts, CodeQL |
| Contributor experience | CONTRIBUTING, CODE_OF_CONDUCT, SUPPORT, issue/PR templates, 3 `good first issue`s, Discussions |
| External contributors | 1 person asked to work on #10 and #12 (both assigned); no external PR yet |
| Traffic (14 days) | 0 recorded views / clones at collection time |

## Missing external signals

Stated plainly, as of the date above:

- **External users:** none known.
- **External contributors:** one volunteer has claimed two issues; no merged
  external contribution yet.
- **External pull requests:** none yet.
- **Stars / forks:** none.
- **Package downloads:** not applicable — the app is not published to npm or the
  Twenty marketplace yet.
- **Maintenance history:** the repository is less than one day old. Releases,
  reviews and triage exist, but not over time.

## Application recommendation

**NOT READY YET**

The program asks for primary/core maintainers and weighs repository usage,
ecosystem importance and evidence of active maintenance (pull request review,
issue triage, release management).

- *Maintainer role and maintenance practices:* met in form — public releases,
  reviewed dependency PRs, triaged and labelled issues, CI and security tooling.
- *Usage / ecosystem importance:* not yet demonstrated — no known users, no
  stars, no downloads.
- *Active maintenance over time:* not yet demonstrated — all activity so far
  happened on the day the repository was created.

Re-evaluate when at least some of these are true: real households (not the
maintainer) have used it and left feedback; at least one external pull request is
reviewed and merged; maintenance continues over several weeks with another
release driven by feedback. Next concrete steps: [NEXT_HUMAN_STEPS.md](NEXT_HUMAN_STEPS.md).
