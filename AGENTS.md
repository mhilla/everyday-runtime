## Base documentation

- Getting started:
  - https://docs.twenty.com/developers/extend/apps/getting-started/quick-start.md
  - https://docs.twenty.com/developers/extend/apps/getting-started/concepts.md
  - https://docs.twenty.com/developers/extend/apps/getting-started/project-structure.md
  - https://docs.twenty.com/developers/extend/apps/getting-started/local-server.md
  - https://docs.twenty.com/developers/extend/apps/getting-started/scaffolding.md
  - https://docs.twenty.com/developers/extend/apps/getting-started/troubleshooting.md
- Config:
  - https://docs.twenty.com/developers/extend/apps/config/overview.md
  - https://docs.twenty.com/developers/extend/apps/config/application.md
  - https://docs.twenty.com/developers/extend/apps/config/roles.md
  - https://docs.twenty.com/developers/extend/apps/config/install-hooks.md
  - https://docs.twenty.com/developers/extend/apps/config/public-assets.md
- Data:
  - https://docs.twenty.com/developers/extend/apps/data/overview.md
  - https://docs.twenty.com/developers/extend/apps/data/objects.md
  - https://docs.twenty.com/developers/extend/apps/data/extending-objects.md
  - https://docs.twenty.com/developers/extend/apps/data/relations.md
- Logic:
  - https://docs.twenty.com/developers/extend/apps/logic/overview.md
  - https://docs.twenty.com/developers/extend/apps/logic/logic-functions.md
  - https://docs.twenty.com/developers/extend/apps/logic/skills-and-agents.md
  - https://docs.twenty.com/developers/extend/apps/logic/connections.md
- Layout:
  - https://docs.twenty.com/developers/extend/apps/layout/overview.md
  - https://docs.twenty.com/developers/extend/apps/layout/views.md
  - https://docs.twenty.com/developers/extend/apps/layout/navigation-menu-items.md
  - https://docs.twenty.com/developers/extend/apps/layout/page-layouts.md
  - https://docs.twenty.com/developers/extend/apps/layout/front-components.md
  - https://docs.twenty.com/developers/extend/apps/layout/command-menu-items.md
- Operations:
  - https://docs.twenty.com/developers/extend/apps/operations/overview.md
  - https://docs.twenty.com/developers/extend/apps/operations/cli.md
  - https://docs.twenty.com/developers/extend/apps/operations/testing.md
  - https://docs.twenty.com/developers/extend/apps/operations/publishing.md
- Rich app example: https://github.com/twentyhq/twenty/tree/main/packages/twenty-apps/examples/postcard

## UUID requirement

- All generated UUIDs must be valid UUID v4.

## Common Pitfalls

- Creating a view without a navigationMenuItem associated. This will make the view available on the left sidebar.
- Creating a front-end component that has a scroll instead of being responsive to its fixed widget height and width, unless it is specifically meant to be used in a canvas tab.

## Best practice

It's highly recommended to create new app entities using `yarn twenty dev:add`. These are the options:

| Entity type          | Command                                  | Generated file                        |
| -------------------- | ---------------------------------------- | ------------------------------------- |
| Object               | `yarn twenty dev:add object`             | `src/objects/<name>.ts`               |
| Field                | `yarn twenty dev:add field`              | `src/fields/<name>.ts`                |
| Logic function       | `yarn twenty dev:add logicFunction`      | `src/logic-functions/<name>.ts`       |
| Front component      | `yarn twenty dev:add frontComponent`     | `src/front-components/<name>.tsx`     |
| Role                 | `yarn twenty dev:add role`               | `src/roles/<name>.ts`                 |
| Skill                | `yarn twenty dev:add skill`              | `src/skills/<name>.ts`                |
| Agent                | `yarn twenty dev:add agent`              | `src/agents/<name>.ts`                |
| View                 | `yarn twenty dev:add view`               | `src/views/<name>.ts`                 |
| Navigation menu item | `yarn twenty dev:add navigationMenuItem` | `src/navigation-menu-items/<name>.ts` |
| Page layout          | `yarn twenty dev:add pageLayout`         | `src/page-layouts/<name>.ts`          |
| Page layout tab      | `yarn twenty dev:add pageLayoutTab`      | `src/page-layout-tabs/<name>.ts`      |
| Command menu item    | `yarn twenty dev:add commandMenuItem`    | `src/command-menu-items/<name>.ts`    |
| View field           | `yarn twenty dev:add viewField`          | `src/view-fields/<name>.ts`           |
| Connection provider  | `yarn twenty dev:add connectionProvider` | `src/connection-providers/<name>.ts`  |

This helps automatically generate required IDs etc.

## Project notes (Everyday Runtime)

- Read `docs/ARCHITECTURE.md` and `docs/PRODUCT_PRINCIPLES.md` before changing behaviour.
- `src/domain` is pure TypeScript: no imports from Twenty, React or anything with side effects; `now` is always passed in. Every engine rule needs a unit test; tunable numbers live in `INFERENCE_CONFIG`.
- All writes go through `src/data/household-actions.ts`; the UI never calls the repository directly.
- Data access uses `RestApiClient` (`twenty-client-sdk/rest`), not the generated GraphQL client, so `yarn typecheck` works without a running server.
- `type` is a reserved field name in Twenty (the observation kind is `observationType`).
- Front component CSS is injected unscoped into the host page: prefix classes with `er-`, use `:where()` for resets and `@container` instead of `@media`.
- Remote DOM serializes boolean attributes as `""`: pass ARIA states as `'true'`/`'false'` strings (`ariaBool`).
- Page layout widgets: no `position` (deprecated in twenty-sdk 2.42); order = array order, height via `heightBehavior`.
- Checks: `yarn lint`, `yarn typecheck`, `yarn test` (unit), `yarn test:integration` (needs `yarn twenty docker:start`; it uninstalls the app afterwards, so run `yarn twenty apply` again).
- Right after `yarn twenty docker:start`, `yarn twenty apply` may fail with `ECONNRESET` while the server warms up; wait and retry.

## Git, CI and Operational Rules

- **Workspace and branch:**
  - Work exclusively in the local checkout `/home/mic8070/antigravity-workspaces/everyday-runtime` and on the working branch `antigravity/everyday-runtime`.
  - Use Local Mode; never create an additional git worktree.
  - Branch `antigravity/everyday-runtime` tracks `origin/antigravity/everyday-runtime`.
  - Never reset, stash, clean, overwrite, or delete unknown or uncommitted changes. No force-push.
- **GitHub backup and sync workflow:**
  - GitHub is the permanent backup and handoff point.
  - After every coherent, completed work package:
    1. Run relevant local checks on the Raspberry Pi (`yarn lint`, `yarn typecheck`, `yarn test`, and local integration tests when relevant).
    2. Check `git diff` and `git status`.
    3. Make a clear, meaningful commit.
    4. Push to `origin/antigravity/everyday-runtime`.
    5. Verify GitHub sync via `git fetch origin --prune` and `git rev-list --left-right --count '@{u}'...HEAD`.
    6. Update `docs/AI_HANDOFF.md` and commit/push the update.
  - A completed work state must never remain only locally on the Pi.
- **GitHub Actions restrictions:**
  - Do not use GitHub Actions at present. Do not trigger, rerun, fix, or require Actions as a mandatory CI step.
  - Do not create new Actions workflows and do not delete existing ones.
  - While this rule is active:
    - No pull requests that would trigger GitHub Actions.
    - Do not push or merge to `main`.
    - Exclusively use the working branch `antigravity/everyday-runtime` for GitHub work and backup.
- **Security and secrets:**
  - Never commit secrets, tokens, passwords, API keys, `.env` file contents, or private keys.
- **Architecture and boundaries:**
  - Preserve architectural boundaries: `src/domain` is pure TypeScript without Twenty/React/side-effect dependencies; `now` is injected; all inference engine rules require unit tests; tunable numbers belong in `INFERENCE_CONFIG`.
  - All database writes must go through `src/data/household-actions.ts`.
- **Product focus and direction:**
  - Vision, roadmap, issues, and real user feedback determine further development. Do not invent a new product strategy.
  - `docs/NEXT_HUMAN_STEPS.md` contains human activities. Never independently perform external communication, Reddit posts, messages, or user outreach.
- **Autonomy and escalation:**
  - Work with maximum autonomy. Only ask the user/owner for genuine owner decisions, login/2FA, external approvals, or missing credentials.
  - When no owner blocker exists, autonomously continue with the next documented step after completing a work package.
- **Handoff documentation:**
  - Maintain `docs/AI_HANDOFF.md` as the canonical, model-independent handoff file. It must always contain: Current Goal, Completed, Open, Blockers, Owner Decisions, Verified State, and Exact Next Step.
  - No critical working state should exist only in the chat session.

