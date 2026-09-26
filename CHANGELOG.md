# Changelog

All notable changes to this application are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
project uses [Semantic Versioning](https://semver.org/).

## Unreleased

## 0.4.0 — 2026-09-26

### Added

- **Talk to your list**: a free, offline German/English sentence parser on Now —
  “Milch ist leer”, “2 Kaffee auf die Liste”, “Hab 2 Milch für 1,98 gekauft beim
  Discounter”, “Was brauchen wir?”, “Ist Kaffee gerade günstig?”. Answers come from
  the engine, in the language you use; voice via the phone keyboard microphone.
- **AI tools for Twenty's AI chat / MCP**: `everyday-needs`, `everyday-product`,
  `everyday-update` and the `everyday-shopping` skill. The model talks, the engine
  decides — small models and few tokens are enough.
- docs/AI.md (English and German): the AI tiers and why they stay cheap.
- **MCP**: the tools appear in Twenty's own MCP server (`/mcp`) as
  `app_everyday_needs`, `app_everyday_product`, `app_everyday_update`, so any MCP
  client (Claude, ChatGPT connectors, Cursor …) can read and update the list.
- **`POST /s/talk`**: one sentence in, answer out — for phone shortcuts, Home
  Assistant, n8n, chat bots and NFC tags.
- **Twenty workflow actions** “Everyday: what do we need?” and “Everyday: record what
  happened” (e.g. a weekly list by email).
- docs/INTEGRATIONS.md (English and German) with ready-to-use examples.

## 0.3.0 — 2026-09-26

### Added

- **German user interface** (#11): all screens, explanations, prices and questions
  in German or English; follows the Twenty user language, with a DE/EN switch. The
  demo household is German when the app is.
- **Active questions** (#28): “Still enough coffee?” — the app asks where one answer
  helps most (at most three, never nagging).
- **Price radar** (#29): price history per product, usual price and recent low,
  great/good/usual/expensive judgement while typing a price, price alerts,
  stock-up recommendation with estimated saving, “Good prices for you” on Now.
- **Open Food Facts / Open Prices** (#30): product data and community prices by
  barcode, on request, via `GET /s/community-prices`; importable as price
  observations.
- New `PriceObservation` object; products get shelf life and a price alert.
- Vision (English and German), re-planned roadmap with milestones.

### Changed

- The domain returns translatable messages next to the English texts; the English
  output and `GET /s/needs` are unchanged.
- Privacy documentation describes the one optional outside call (barcode to Open
  Food Facts).

## 0.2.0 — 2026-09-26

### Added

- **Quantity-aware estimates** (#2): purchase quantities give a typical use per
  day; a bulk purchase lasts longer, a small one runs out sooner. Reported
  consumption with a quantity moves the expected run-out by the share used.
- **Learning from corrections** (#3): earlier “Empty” and late “Still have it”
  reports adjust how long a product is expected to last (bounded to 0.5–2×, a
  single report counts half), explained in “Why?”.
- Product details show “Lasts about”, the typical use per day and a “Learned from
  your corrections” hint.
- DEMO.md: a three-minute walkthrough of the workflow, with updated screenshots.
- Governance: CODE_OF_CONDUCT (Contributor Covenant 2.1), SUPPORT, MAINTAINERS.
- Dependabot configuration (grouped monthly updates) and a dependency review
  check on pull requests; CodeQL default setup enabled for the repository.

### Fixed

- Switching tabs kept the scroll position; on phones the Products tab opened
  below its search field. Each tab now starts at the top.
- “Use per day” is rounded coarsely (e.g. ~0.4 l instead of ~0.41 l).
- Accessibility (axe): no `tabpanel` role on `<main>`, no heading-level jump in
  product details.

### Changed

- Tooling: oxlint 1.85, GitHub Actions `checkout`/`setup-node` v7 and
  `dependency-review-action` v5 (Dependabot); the test configs use Vite's built-in
  `resolve.tsconfigPaths` instead of the `vite-tsconfig-paths` plugin.
- CONTRIBUTING describes branches, the pull request workflow, commit expectations
  and scope.
- The npm publish workflow runs on demand only (it no longer starts on version
  tags) and enables Corepack.
- Actions from `twentyhq/twenty` are pinned to a commit SHA instead of `main`.

## 0.1.0 — 2026-09-26

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
