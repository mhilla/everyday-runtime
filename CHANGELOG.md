# Changelog

All notable changes to this application are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
project uses [Semantic Versioning](https://semver.org/).

## Unreleased

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
