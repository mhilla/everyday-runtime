# Changelog

All notable changes to this application are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
project uses [Semantic Versioning](https://semver.org/).

## Unreleased

### Added

- **Quantity-aware estimates** (#2): purchase quantities give a typical use per
  day; a bulk purchase lasts longer, a small one runs out sooner. Reported
  consumption with a quantity moves the expected run-out by the share used.
- **Learning from corrections** (#3): earlier “Empty” and late “Still have it”
  reports adjust how long a product is expected to last (bounded to 0.5–2×, a
  single report counts half), explained in “Why?”.
- Product details show “Lasts about”, the typical use per day and a “Learned from
  your corrections” hint.

- Governance: CODE_OF_CONDUCT (Contributor Covenant 2.1), SUPPORT, MAINTAINERS.
- Dependabot configuration (grouped monthly updates) and a dependency review
  check on pull requests; CodeQL default setup enabled for the repository.

### Fixed

- Switching tabs kept the scroll position; on phones the Products tab opened
  below its search field. Each tab now starts at the top.
- Accessibility (axe): no `tabpanel` role on `<main>`, no heading-level jump in
  product details.

### Changed

- CONTRIBUTING describes branches, the pull request workflow, commit expectations
  and scope.
- The npm publish workflow runs on demand only (it no longer starts on version
  tags) and enables Corepack.
- Actions from `twentyhq/twenty` are pinned to a commit SHA instead of `main`.

## 0.1.0

First usable version of the smart shopping workflow.

### Added

- Application scaffolded with [`create-twenty-app`](https://www.npmjs.com/package/create-twenty-app).
- Data model: **Product**, **Observation**, **ShoppingItem** and **Purchase** objects.
- Deterministic, explainable **inference engine** (`src/domain`) that estimates, per
  product, a state (confirmed / likely / possible / unknown), confidence, need score
  and a plain-language reason from observations. Handles direct reports, purchase
  rhythms (median intervals), sightings, consumption, conflicting reports and stale
  evidence. No AI service required.
- App UI replacing the starter page: **Now**, **Shopping list**, **Products** and
  **Activity**; quick add (`2 milk`), mark empty / still have it, mark bought with
  quantity, price and store, accept or dismiss suggestions, “Why?” explanations,
  confirmed vs. estimated labelling, light and dark mode, mobile layout.
- **Demo household** (Milk, Coffee, Paper towels, Pasta, Apples) loadable from the
  empty state.
- Authenticated **`GET /s/needs`** route returning the current needs as JSON.
- Unit tests for engine, list logic, texts, parsing, record mapping, repository and
  actions; an end-to-end integration test of the main workflow.
- Project documentation: README, ARCHITECTURE, PRODUCT_PRINCIPLES, PRIVACY, ROADMAP,
  CONTRIBUTING, SECURITY, LICENSE; issue and pull request templates.

### Changed (compared to the scaffold)

- `yarn test` runs the unit tests; integration tests moved to `yarn test:integration`.
- CI runs install, lint, typecheck and unit tests on every push and pull request, and
  the integration tests against a disposable Twenty instance.
- The CD workflow no longer runs on every push to `main`; it deploys on demand
  (manual run or the `deploy` label) once a deploy target is configured.
- Lint enables oxlint's correctness rules.

### Fixed (compared to the scaffold)

- “Page layout widget uses a deprecated vertical-list position”: the main widget
  no longer sets `position` and uses `heightBehavior: TAB_VIEWPORT` (twenty-sdk 2.42).

### Known limitations

- The whole household history (up to 2,000 observations and 1,000 list items) is
  loaded into the browser.
- Purchase quantities are stored but not yet used for the estimate.
- One household per Twenty workspace; the UI does not show who reported what.
- English UI only.
- Twenty renders the app inside a container marked `aria-disabled="true"`. Clicks
  and keyboard work, but some screen readers may announce the region as disabled.
- `GET /s/needs` without a token is answered with HTTP 500 by the Twenty server
  instead of 401.
