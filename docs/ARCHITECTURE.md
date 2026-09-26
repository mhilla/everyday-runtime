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
| **PriceObservation** (v0.3) | A price seen somewhere | `product`, `price` (currency), `packQuantity` (in the product unit), `store?`, `observedAt`, `source` (MANUAL, RECEIPT, OPEN_PRICES) |

Products also have `shelfLifeDays?` and `priceAlertUnitPrice?` (v0.3).

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
| `expectedDurationDays` | How long the current purchase should last (after quantities and learned corrections) |
| `consumptionRatePerDay` | Typical use per day, when quantities are known |
| `calibrationFactor` | Multiplier learned from earlier corrections, or `null` |

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
   - **Quantities (v0.2).** Quantities of one trip are added up. For every
     completed cycle with a known quantity, *quantity ÷ days until the next trip*
     is a consumption rate; the median of the recent rates is the typical use per
     day. The current purchase then lasts *its quantity ÷ typical use*, bounded to
     ¼–4× the buying rhythm. Without quantities the buying rhythm is used as
     before.
   - **Learning from corrections (v0.2).** In every *completed* cycle, the first
     EMPTY report gives the real duration, and a SEEN_IN_STOCK report later than
     expected gives a minimum duration. Each is divided by the duration expected
     for that cycle. The median of the last 4 ratios becomes a multiplier
     (one report counts half), bounded to 0.5–2×, ignored within ±10%. Reports in
     the current cycle are not used here — rules 3–5 already handle them.
   - Expected duration = quantity-based duration × learned multiplier.
   - Expected run-out = last purchase + expected duration, pushed back to at least
     *sighting + ½ duration* if the product was seen in stock since, and moved
     earlier per CONSUMED report: by the used share of the last purchase when
     both have quantities (max 90%), otherwise by 15% per report (max 50%).
   - The reason line names the buying rhythm (“usual interval ~5 days”) unless
     the expected duration differs from it by 15% or more (“3 l usually lasts ~2
     weeks”, “usually lasts ~7 days”).
   - `needScore = sigmoid(6 · (daysPastRunOut / duration + 0.1))` — about 0.65 at the
     expected run-out, 0.86 one fifth of an interval later.
   - Bought within 2 days, or seen within 1 day → `CONFIRMED`, need capped at
     0.05 / 0.10.
   - `confidence = sampleFactor × regularityFactor` with
     `sampleFactor = min(0.95, 1 − 0.5^intervals)` and
     `regularityFactor = 1 / (1 + 1.5 · coefficientOfVariation)`.
   - **Staleness**: beyond 3 expected durations since the last purchase, or 120 days since the
     last evidence, confidence decays exponentially and the need drifts back to 0.5.
7. Scores are clamped to 0–1 and rounded to two decimals.

Every rule has unit tests in `src/domain/__tests__/inference.test.ts`, including
order-independence and bounds checks.

## Active questions (v0.3)

`selectQuestions` in `src/domain/questions.ts` picks at most three products worth one
tap (“Still enough coffee?”): conflicts first, then uncertain estimates (need
0.35–0.9, confidence ≤ 0.8) ordered by closeness to the 0.6 threshold and lack of
confidence. Skipped: products on the list, anything observed in the last 2 days, and
products the person answered “not now” for (kept 3 days in front-component storage).
Answers are ordinary SEEN_IN_STOCK / EMPTY observations.

## Price radar (v0.3)

`src/domain/prices.ts` and `src/domain/deals.ts`:

- **Price points**: purchases with a price and price observations, normalised to a
  price per product unit (price ÷ quantity or pack size).
- **Usual price**: median of the last 180 days; **recent low**: lowest of 90 days.
- **Judgement** of a price against the *other* prices: *great* (≥ 20 % below usual,
  or ≥ 10 % below and the lowest in 90 days), *good* (≥ 10 % below), *usual*,
  *expensive* (≥ 10 % above), or *not enough data* (fewer than 2 prices).
- **Stock-up plan**: cover one usual cycle at a usual price, two when good, four when
  great — limited by shelf life and storage (default 60 days), rounded up to whole
  packs, with the saving against the usual price.
- **Deals on Now**: seen prices from the last 7 days that are good/great for products
  needed soon (need ≥ 0.4 or run-out within 21 days), or that satisfy a price alert.

## Integrations (v0.3)

`src/integrations/open-food-facts.ts` parses Open Food Facts product data and Open
Prices community prices (pure, unit-tested) and converts pack sizes to the product
unit (ml→l, g→kg). The `GET /s/community-prices?barcode=&unit=` logic function calls
both APIs server-side with an identifying user agent, only when a person asks.

## Languages (v0.3)

The domain never returns finished text only. Every reason, factor and price or
question explanation is also a structured message (`src/domain/messages.ts`: a key
plus values such as “days ago”, intervals, amounts, money). `renderMessage` turns it
into English or German with correct plurals and decimal commas; the English
rendering is exactly the former text, so `reason` / `factors` and `GET /s/needs` are
unchanged. UI text uses gettext-style keys in `src/ui/i18n.tsx`; a unit test fails
if any `t('…')` text lacks a German translation. The language follows the Twenty
user's locale, with a DE/EN switch in the app.

## Talking to the list (v0.4)

- `src/domain/commands.ts` parses a sentence into an intent (EMPTY, IN_STOCK, ADD,
  BOUGHT, ASK_NEEDS, ASK_PRODUCT, ASK_PRICE, UNKNOWN) with items, quantities, price
  and store — ordered regex patterns for German and English, no AI.
- `src/domain/talk.ts` matches product names tolerantly (case, plural endings, one
  typo per five letters) and answers questions as messages.
- `src/data/command-executor.ts` runs a command with the regular household actions;
  the in-app talk box and the `everyday-update` AI tool share it.
- `src/logic-functions/everyday-*.tool.ts` expose read/write tools to Twenty's AI
  (`toolTriggerSettings` with JSON Schema); `src/skills/shopping-assistant.skill.ts`
  tells the model to rely on the tools and never guess stock. See docs/AI.md.

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
- Controlled inputs are synchronised between the sandbox and the page
  asynchronously; automated tests type with a small per-key delay like a person.

## Testing

- `yarn test` — unit tests for the engine, list selection, presentation, quick add,
  record mapping, repository paging and every user action (with an in-memory fake
  transport).
- `yarn test:integration` — installs the app into a real Twenty server and runs the
  main workflow end to end (quick add → bought → estimate drops; mark empty → listed
  once).
