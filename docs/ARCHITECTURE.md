# Architecture

Everyday Runtime is a [Twenty](https://twenty.com) app. Twenty provides the
database, authentication, permissions, the API and the page the app is shown on.
The app adds four objects, one full-page front component, one HTTP route and — most
importantly — a framework-independent inference engine.

```
┌──────────────────────────── Twenty server (self-hosted) ────────────────────────────┐
│                                                                                      │
│  Objects: Product · Observation · ShoppingItem · Purchase      REST / GraphQL API    │
│                                                                                      │
│  ┌── Front component (browser, sandboxed) ──┐    ┌── Logic function (server) ──┐     │
│  │ src/ui      React screens                │    │ src/logic-functions/needs.ts│     │
│  │ src/data    repository + actions  ───────┼─REST┼─ src/data repository      │     │
│  │ src/domain  inference engine             │    │ src/domain inference engine │     │
│  └──────────────────────────────────────────┘    └─────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

## Layers

| Folder | Depends on | Responsibility |
| --- | --- | --- |
| `src/domain` | nothing | Types, inference engine, list selection, presentation texts, quick-add parsing, demo data. Pure functions; `now` is always a parameter. |
| `src/data` | `domain`, a minimal REST transport | Maps Twenty records to domain types and back. `household-actions.ts` is the only place that decides *what* gets written for a user action. |
| `src/ui` | `domain`, `data`, React, `twenty-sdk/front-component` | Screens and components. Reads a snapshot, derives everything with the domain layer, calls actions, reloads. |
| `src/objects`, `src/page-layouts`, … | `twenty-sdk/define` | Declarative Twenty metadata. |
| `src/logic-functions` | `domain`, `data` | `GET /s/needs` and the health check. |

The domain layer has no imports from Twenty or React. That keeps the engine easy to
test, easy to read and portable (a CLI, a Home Assistant add-on or a different
backend could reuse it unchanged).

## Data model

| Object | Purpose | Key fields |
| --- | --- | --- |
| **Product** | Something bought repeatedly | `name`, `category`, `defaultUnit`, `barcode?`, `typicalPurchaseQuantity?`, `archived` |
| **Observation** | One piece of evidence | `product`, `observationType` (PURCHASED, CONSUMED, EMPTY, SEEN_IN_STOCK, MANUAL_NEED), `quantity?`, `observedAt`, `source`, `note?` |
| **ShoppingItem** | An entry on the list | `product`, `requestedQuantity`, `status` (OPEN, PURCHASED, DISMISSED), `origin` (MANUAL, INFERRED), `confidence?`, `explanation`, `purchasedAt?`, `dismissedAt?` |
| **Purchase** | What was actually bought | `product`, `quantity`, `purchasedAt`, `price?` (currency), `store?` |

Notes:

- The observation kind is stored as `observationType` because `type` is a reserved
  field name in Twenty.
- Observations are the **only** input to the engine. Buying an item therefore writes
  three records: the list item is closed, a Purchase is stored (price history for
  v0.5) and a PURCHASED observation is recorded.
- Dismissing a suggestion is stored as a DISMISSED, INFERRED shopping item. The
  suggestion stays quiet until a newer observation for that product exists.
- Deleting a product cascades to its observations, list items and purchases.

## Inference engine

`assessProduct(observations, now, config?)` in `src/domain/inference.ts` returns:

| Field | Meaning |
| --- | --- |
| `state` | `CONFIRMED` (fresh direct report), `LIKELY` (confidence ≥ 0.6), `POSSIBLE` (≥ 0.25), `UNKNOWN` |
| `confidence` | 0–1, how much the engine trusts its own estimate |
| `needScore` | 0–1, how likely the product needs buying now |
| `needsShopping` | `state !== UNKNOWN && needScore ≥ 0.6` |
| `basis` | Which rule produced the result (for UI and tests) |
| `reason` | One line, e.g. “Last purchased 6 days ago · usual interval ~5 days” |
| `factors` | Ordered explanation lines for the “Why?” panel |

Rules, applied in this order (all numbers live in `INFERENCE_CONFIG`):

1. **Invalid input** — observations dated more than 5 minutes in the future are
   ignored (and reported in `factors`).
2. **No data** → `UNKNOWN`, need 0.
3. **Direct need** — the newest EMPTY / MANUAL_NEED that is newer than any purchase
   or sighting: need 0.95 / 0.90, `CONFIRMED` for 3 days. Afterwards its weight
   halves every 21 days, drifting towards 0.5 (“don’t know”).
   Ties at the same timestamp go to the purchase/sighting (you notice it is empty,
   then you buy it).
4. **Conflict** — EMPTY/MANUAL_NEED followed within 24 h by SEEN_IN_STOCK without a
   purchase in between: `POSSIBLE`, confidence 0.35, need 0.47. The UI asks the
   household to check.
5. **No purchase yet** — only sightings: fresh sighting → confirmed in stock;
   older → weak guess based on a 14-day prior. Only consumption → `UNKNOWN`.
6. **Purchase rhythm** —
   - Purchases within 12 hours are one shopping trip.
   - The usual interval is the **median** of the last 6 intervals, so one holiday
     does not distort it. With a single purchase a 14-day prior is used with low
     confidence.
   - Expected run-out = last purchase + interval, pushed back to at least
     *sighting + ½ interval* if the product was seen in stock since, and moved
     earlier by 15% of an interval per CONSUMED report (max 50%).
   - `needScore = sigmoid(6 · (daysPastRunOut / interval + 0.1))` — about 0.65 at the
     expected run-out, 0.86 one fifth of an interval later.
   - Bought within 2 days, or seen within 1 day → `CONFIRMED`, need capped at
     0.05 / 0.10.
   - `confidence = sampleFactor × regularityFactor` with
     `sampleFactor = min(0.95, 1 − 0.5^intervals)` and
     `regularityFactor = 1 / (1 + 1.5 · coefficientOfVariation)`.
   - **Staleness**: beyond 3 intervals since the last purchase, or 120 days since the
     last evidence, confidence decays exponentially and the need drifts back to 0.5.
7. Scores are clamped to 0–1 and rounded to two decimals.

Every rule has unit tests in `src/domain/__tests__/inference.test.ts`, including
order-independence and bounds checks.

## Front component constraints

Twenty renders front components from a Web Worker via Remote DOM. Things that
shaped the UI code:

- CSS is injected into the host page **unscoped**: every class is prefixed `er-`,
  base resets use `:where()`, and responsiveness uses `@container` (media queries
  would match the browser window, not the widget).
- Boolean attributes are serialized as empty strings, so ARIA states are passed as
  `'true'` / `'false'` strings (`ariaBool`).
- The app uses `RestApiClient` from `twenty-client-sdk/rest` rather than the typed
  GraphQL client, so type-checking does not depend on a client generated from a
  running server (important for CI).
- The page layout widget uses `heightBehavior: TAB_VIEWPORT` and no `position`;
  widget order is array order (the `position` field is deprecated in twenty-sdk
  2.42).

## Testing

- `yarn test` — unit tests for the engine, list selection, presentation, quick add,
  record mapping, repository paging and every user action (with an in-memory fake
  transport).
- `yarn test:integration` — installs the app into a real Twenty server and runs the
  main workflow end to end (quick add → bought → estimate drops; mark empty → listed
  once).
