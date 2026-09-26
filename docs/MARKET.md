# Market and competitor analysis

> Household shopping-list, grocery and pantry apps, compared with Everyday Runtime.
> **Research date: 2026-09-26.** All competitor facts come from the sources listed at the
> end (official sites, app store pages, help centres and docs wherever possible). App
> stores, prices and features change often. Treat every row as "true on the date
> checked" and check again before quoting it. Where a source did not confirm a feature,
> the matrix shows `?` instead of a guess. 🇩🇪 A German summary is at the end.

## 1. Summary

**What the market offers.** The market has four groups of products:

1. **Shared list apps** such as Bring!, AnyList, OurGroceries and Listonic. They sell
   real-time family sharing, automatic categories and aisle sorting, recipes and meal
   plans, watch apps and widgets, and voice input. They are free and add a cheap premium
   tier (about US$1 to US$2 a month, or US$6 to US$15 a year). None of them is
   self-hosted.
2. **General to-do and note apps** such as Google Keep, Microsoft To Do, Todoist and
   Apple Reminders. People use them as shopping lists because they are already
   installed and good at sharing. They know nothing about groceries, although Apple
   Reminders groups groceries into categories automatically.
3. **Inventory and pantry trackers** such as Grocy, Pantry Check, NoWaste and the
   Paprika pantry. They offer barcode scanning, best-before dates and minimum-stock or
   "restock" rules. They only work if every item is scanned in and out.
4. **Commerce apps** such as marktguru, kaufDA, REWE, Picnic and Instacart. They offer
   flyers, deals, loyalty programmes, digital receipts and "buy it again" lists. The
   list exists to sell the retailer's offers and depends on the retailer's own data.

The self-hosted open-source products (Grocy, KitchenOwl, Mealie) cover inventory,
recipes and meal planning. All three have Home Assistant integrations and APIs.

**Where the gaps are.**

- **"Probably needed" with a stated reason.** Several apps suggest items. Listonic,
  Pantry Check, KitchenOwl, Fango and Instacart all suggest from history or usage. None
  of the reviewed products shows a *probability with a reason* ("Milk: probably low,
  89%, last bought 6 days ago, usual interval about 5 days"). None admits uncertainty or
  reports conflicting evidence. Inventory apps are either exact or wrong.
- **Deals tied to how fast the household uses things.** Flyer apps show deals, and
  AnyList, Listonic and Pantry Check track prices. None of the reviewed apps turns a
  deal into "buy 4, that lasts until X, saves about €Y" from the household's own rate of
  use.
- **Voice assistants are getting worse for third-party lists.** Amazon ended the Alexa
  List Management API and list skills on 1 July 2024. Under Alexa+, Bring! users must
  first say "open Bring!". AnyList users must say "tell AnyList …". Todoist dropped Alexa
  entirely. Google ended third-party lists in Google Assistant, and in August 2026 a
  Gemini for Home bug broke adding items to Keep lists by voice for some users. Open,
  self-hosted routes (HTTP, Home Assistant, MCP) are more robust than the big voice
  platforms.
- **Care for other households.** None of the reviewed apps has a dedicated mode for
  looking after a second household, such as elderly parents. Sharing a list is the
  closest thing on offer.
- **Local language understanding without a cloud AI.** AI features are spreading:
  Listonic's AI assistant, the NoWaste AI assistant, Gemini in Keep, Todoist Assist and
  Ramble, and Mealie's OpenAI-compatible import. All of them send text to a model.
  Offline parsing of sentences in German is rare.

**Where Everyday Runtime is behind.** It does not yet have the everyday conveniences
that almost every list app has: a camera barcode scanner, several people with live
sync and attribution, aisle-sorted shopping, native voice assistants, widgets, watch
apps, offline use, multiple lists, recipes and meal plans. Section 3 ranks these gaps.

## 2. Feature matrix

Legend: ✅ has it · 🟡 partial, limited, via workaround, or planned (for Everyday
Runtime) · ❌ no · `?` not confirmed by the sources checked.
Everyday Runtime status is checked against `README.md`, `ROADMAP.md`, `docs/*.md` and
`src/` as of branch `feat/new-look` (after v0.4.0).

| Feature | Bring! | AnyList | OurGroceries | Listonic | Google Keep | Todoist | Grocy | KitchenOwl | Mealie | Pantry Check | NoWaste | **Everyday Runtime** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Price (free / paid) | Free; Premium $1.99/mo or $8.99/yr | Free; Complete $9.99/yr (individual), $14.99/yr (household) | Free with ads; about $1/mo, $6/yr, $20 lifetime | Free with ads; premium in-app purchase | Free | Free (5 projects); Pro from $4/mo billed annually | Free (MIT) | Free (AGPL-3.0) | Free (open source) | Free up to 200 items; paid tiers | Free; Pro $6.99/yr or $29.99 lifetime | **Free (MIT)** |
| Self-hosted | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | **✅** (Twenty app) |
| Native mobile apps | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 (community and third-party apps) | ✅ | ❌ (web) | ✅ | ✅ | **❌** (responsive web inside Twenty) |
| Shared lists / household | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 (multi-user) | ✅ (households) | ✅ (groups/households) | ✅ | ? | **🟡** (everyone in the Twenty workspace shares the data; people and attribution planned for v0.5) |
| Real-time sync | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ? | ✅ | ? | ✅ | ? | **🟡** (server-backed; live push not verified) |
| Multiple lists | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ? | ✅ | **❌** (one list per workspace) |
| Recipes | ✅ | ✅ | ✅ (ingredient lists) | 🟡 (AI suggestions) | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | 🟡 (from stock) | **❌** |
| Meal planning | 🟡 | ✅ (Complete) | ❌ | 🟡 (AI) | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | **❌** |
| Barcode scanning (camera) | ? | ? | ✅ | ? | ❌ | ❌ | ✅ | ? | ❌ | ✅ | ✅ | **🟡** (barcode field and Open Food Facts lookup; camera scan planned for v0.6) |
| Receipt / photo capture | ❌ (item photos only) | 🟡 (item photos) | 🟡 (add by photo) | ? | 🟡 (image notes) | ❌ | ❌ | ? | 🟡 (recipe photos via AI) | 🟡 (unknown items by photo) | ✅ (receipts, photos) | **🟡** (planned for v0.6) |
| Pantry / inventory | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (exact stock) | 🟡 | ❌ | ✅ (exact) | ✅ (exact) | **✅** (estimated state with confidence, no stock counting) |
| Expiry / best-before tracking | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ? | ❌ | ✅ | ✅ | **🟡** (shelf life per product, used only for stock-up limits) |
| Suggestions from history or usage | ? | 🟡 (autocomplete, recent items) | 🟡 (item history) | ✅ (history-based, AI) | ❌ | ❌ | 🟡 (minimum-stock rules) | 🟡 (frequent items) | ❌ | ✅ (restock from usage) | ❌ | **✅** (probability, confidence and reason per item) |
| Explains why an item is suggested | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🟡 (below minimum stock) | ❌ | ❌ | ? | ❌ | **✅** |
| Own price tracking | ❌ | ✅ (prices, running total) | ? | ✅ (price monitoring, budget) | ❌ | ❌ | ✅ | ✅ (expenses) | ❌ | ✅ (prices, running tally) | ❌ | **✅** (price history, deal rating, alerts) |
| Flyers / retailer deals | ✅ (local brochures) | ❌ | ❌ | ? | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **🟡** (open community prices by barcode; no flyers) |
| Stock-up advice | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Alexa | 🟡 (skill; Alexa+ needs "open Bring!") | 🟡 ("tell AnyList …") | ✅ (skill) | ? | ❌ | ❌ (ended July 2024) | ❌ | ❌ | ❌ | ? | ❌ | **🟡** (planned skill, #35) |
| Google Assistant / Gemini | ❌ (ended) | ? | 🟡 (on phones only) | ? | 🟡 (Gemini; bug reported Aug 2026) | ? | ❌ | ❌ | ❌ | ? | ❌ | **❌** |
| Siri | ✅ | ✅ | ✅ | ? | ❌ | ? | ❌ | ❌ | ❌ | ? | ❌ | **🟡** (iOS Shortcut calling `POST /s/talk`, documented) |
| Home Assistant | ✅ (official integration) | ❌ (no official integration) | ✅ (official integration) | ❌ | ❌ | ✅ (official integration) | 🟡 (add-on; community integration no longer maintained) | 🟡 (listed on its features page) | ✅ (official integration) | ❌ | ❌ | **🟡** (documented `rest_command` / `rest` sensor; native integration planned for v0.7) |
| Smartwatch | ✅ (Apple Watch) | ✅ (Complete) | ✅ (Apple Watch, Wear OS) | ✅ (Apple Watch) | ✅ (Wear OS) | ✅ | ❌ | ? | ❌ | ? | ? | **❌** |
| Widgets | ✅ | ✅ | ✅ | ? | ✅ | ✅ | ❌ | ? | ❌ | ? | ? | **❌** |
| Loyalty cards | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **❌** |
| Store / aisle sorting | 🟡 (custom sorting) | ✅ | ✅ | ✅ | ❌ | ❌ | 🟡 (product groups) | ✅ (learns store order) | ✅ (labels) | ✅ (locations) | 🟡 | **❌** (categories exist; no aisle order) |
| Categories and icons | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | **✅** (9 categories with avatars) |
| Offline use | ? | ? | ? | ✅ | ✅ | ✅ | ❌ | 🟡 (partial) | ❌ | ? | ? | **❌** (needs the Twenty server; the parser itself needs no network) |
| AI features | ? | ❌ | ❌ | ✅ (AI assistant) | ✅ (Gemini) | ✅ (Assist, Ramble) | ❌ | ❌ | ✅ (OpenAI-compatible, Ollama possible) | ❌ | ✅ (AI assistant) | **✅** (MCP tools and skill; the engine decides; any provider) |
| Natural-language entry without cloud AI | ❌ | ❌ | ❌ | ❌ | ❌ | 🟡 (date parsing) | ❌ | ❌ | 🟡 (NLP ingredient parser) | ❌ | ❌ | **✅** (German and English, offline) |
| Public API / automation | ❌ (unofficial only) | ❌ | ❌ | ❌ | 🟡 (Workspace only) | ✅ | ✅ (REST) | 🟡 | ✅ (API, webhooks, Apprise) | ❌ | ❌ | **✅** (HTTP, MCP, Twenty workflows) |
| German interface | ✅ | ? | ? | ✅ (40+ languages) | ✅ | ✅ | ✅ | ✅ | ✅ | ? | ? | **✅** (German and English, including every explanation) |
| Privacy (no ads, no tracking) | ? | ✅ (no ads) | 🟡 (ads unless paid) | ❌ (App Store label: tracking) | 🟡 (Google account) | 🟡 | ✅ | ✅ | ✅ | ? | ? | **✅** (no telemetry; only outside call is an opt-in barcode lookup) |

Competitors reviewed outside the matrix are profiled in the appendix below: Microsoft
To Do, the Alexa shopping list, Paprika, Apple Reminders, marktguru, kaufDA, REWE,
Picnic, Instacart and Fango.

### Competitor notes (checked 2026-09-26)

- **Bring!** (Bring! Labs AG, Switzerland). iOS, Android, Web, Mac and Apple Watch, in
  13 languages. Premium costs $1.99 a month or $8.99 a year (US App Store). The US App
  Store page shows 4.8 stars from 9.8K ratings. Features: real-time shared lists, local
  brochures and offers, a loyalty-card wallet, recipes from partners and from the web,
  item photos, and "urgent" labels. On Alexa+, users must say "open Bring!" first;
  otherwise items land on Amazon's own list. Google Assistant support has ended. Home
  Assistant has an official integration that polls every 90 seconds, and sensors count
  items labelled "urgent", "if convenient" and "offer".
- **AnyList.** iOS, Android and Web (Web requires Complete). Complete costs $9.99 a year
  for one person or $14.99 a year for a household, billed annually only. The free tier
  includes Siri and Alexa, a widget and Apple Watch, plus online-shopping hand-off to
  Walmart, Instacart and Kroger. Complete adds unlimited recipe import, a meal-planning
  calendar, location reminders, item prices with running totals and a passcode lock.
  Alexa commands now need "ask/tell AnyList …", and AnyList reports a known issue
  outside the US.
- **OurGroceries.** iOS, Android, Apple Watch, Wear OS, Mac, Web, Alexa, and widgets.
  Free with ads. Upgrading costs about US$1 a month, US$6 a year or US$20 lifetime, and
  one purchase covers the whole family. Features: barcode scanning (the user guide
  cites 17 million products), adding items by photo, recipes, and categories. Google
  voice now works only on Android phones; Google ended third-party voice apps on
  Home/Nest in June 2023. Home Assistant has an official integration.
- **Listonic.** iOS, Android, Web, Apple Watch, 40+ languages. The website states 20M+
  downloads and 350k+ reviews; the US App Store page shows 4.7 stars from 10K ratings.
  Features: history-based suggestions, an AI assistant for lists and recipes, price
  monitoring and budget, and aisle sorting. It is free with ads, and premium is an
  in-app purchase. According to its App Store privacy label, the app collects location,
  identifiers and usage data and may track users across apps and websites.
- **Google Keep.** Free on Android, iOS and the web. Google's old Shopping List now lives
  in Keep. Gemini can create Keep lists and add items. An August 2026 bug broke voice
  adds to Keep lists through Google Home/Gemini for some users.
- **Todoist.** The official pricing page shows Pro at $4 a month billed annually;
  several 2026 third-party reviews report a rise to $5 in December 2025. Features: AI
  "Assist" and "Ramble", an API, and an official Home Assistant integration. Alexa
  support ended when Amazon shut the list API on 1 July 2024.
- **Grocy.** Self-hosted, MIT licence. The GitHub page shows about 9.5k stars. Features:
  stock with best-before dates, minimum stock that fills the shopping list
  automatically, camera or scanner barcode input with an Open Food Facts lookup plugin,
  recipes with a "due score", meal plan, chores, batteries, a full REST API, and apps
  for Android, iOS and Windows. The community Home Assistant integration's README says
  it is no longer maintained and does not work in HA 2025.5; an HA add-on exists.
- **KitchenOwl.** Self-hosted, AGPL-3.0, Flask and Flutter. The GitHub page shows about
  3.7k stars. Features: households, real-time sync, partial offline support, recipes
  scraped from websites, meal plans, expenses and bill splitting, store-order sorting,
  apps for Android, iOS, Web and desktop.
- **Mealie.** Self-hosted, open source. Features: recipe scraping, "Import with AI" from
  links, photos and text, an OpenAI-compatible provider setting (Ollama possible), meal
  planner rules, shopping lists with labels, groups and households, webhooks, Apprise
  notifications, and an official Home Assistant integration (to-do list per shopping
  list, meal-plan calendar).
- **Pantry Check** (Sunroom Labs). iOS and Android. The US App Store page shows 4.5
  stars from 1.6K ratings. Free up to 200 items; Premium (2,000 items) and Pro (10,000
  items) are in-app purchases. Features: barcode scanning with a crowd-sourced
  database, estimated best-before dates and prices, restock suggestions from inventory
  and usage, locations, and family sync.
- **NoWaste.** iOS, Android and Web. The US App Store page shows 4.2 stars from 751
  ratings. Pro costs $6.99 a year or $29.99 lifetime. Features: fridge, freezer and
  pantry lists, scanning of barcodes, receipts and photos, expiry reminders, an AI
  assistant (voice or text), meal plans from stock, and a shopping list.

## 3. Parity gaps (ranked by user value)

These are features that most competitors have and Everyday Runtime lacks. Each idea
builds equivalent functionality inside a self-hosted Twenty app. Do not copy anyone's
code, text, icons or data.

| # | Gap | Who has it | Implementation idea for Everyday Runtime |
| --- | --- | --- | --- |
| 1 | **Several people per household, with live updates and "who did what"** | Bring!, AnyList, OurGroceries, Listonic, KitchenOwl, Mealie | Add a household member reference to Observation and ShoppingItem, filled from Twenty's workspace member or API key metadata. Refresh the front component on focus or on a short poll, since Twenty data is already shared (roadmap v0.5, #4). |
| 2 | **Shopping mode sorted by store and aisle** | AnyList, OurGroceries, Listonic, KitchenOwl, Mealie, Paprika | Group the list by the existing `category`. Add an optional per-store category order (a small Store object or a JSON field), then learn that order from check-off sequence, which is deterministic and explainable. |
| 3 | **Camera barcode scan** | OurGroceries, Grocy, Pantry Check, NoWaste | Use the browser `BarcodeDetector` API where available and fall back to an open-source JS decoder bundled in the front component. Reuse the existing Open Food Facts lookup to create or match a Product (v0.6). |
| 4 | **Voice assistants: Alexa and Home Assistant Assist** | OurGroceries, AnyList, Bring! (Alexa); Bring!, Todoist, OurGroceries, Mealie (HA) | Build a custom Alexa skill with its own invocation name ("Alexa, tell Everyday …") that forwards the sentence to `POST /s/talk`. Amazon's list API is gone, so a custom skill is the only route (#35). For HA, add sentence triggers or intents that call `/s/talk`. |
| 5 | **Native Home Assistant integration (to-do entity and sensors)** | Bring!, OurGroceries, Todoist, Mealie, Grocy (community) | Publish a small HACS custom integration that exposes the shopping list as an HA `todo` entity and "probably needed" as sensors, calling `/s/needs` and `/s/talk`. Until then, keep the documented `rest_command` recipe (v0.7). |
| 6 | **Offline use, home-screen shortcut and widget** | Listonic, Keep, Todoist, KitchenOwl (partial), all native apps | Serve a minimal installable PWA from the app's public assets that caches the list and queues sentences for `/s/talk` while offline. Widgets and watch complications can then come from iOS Shortcuts and Android HTTP Shortcuts. |
| 7 | **Multiple lists** (per store, per occasion, per household) | Nearly all list apps | Add an optional `list` or `store` field on ShoppingItem with filter chips. Keep one default list so the "Now" screen stays simple. |
| 8 | **Best-before / "use soon"** | Grocy, Pantry Check, NoWaste, Paprika | Add an optional best-before date on Purchase, or estimate it from `shelfLifeDays`, clearly marked as an estimate. Show "use soon" as a low-priority explained hint. This fits the existing Observation model. |
| 9 | **Receipt and photo capture** | NoWaste, OurGroceries (photo), Mealie (AI import), Fango | Have an opt-in vision model (local via Ollama or any OpenAI-compatible endpoint) turn a receipt photo into *proposed* Bought observations and prices, which a person confirms before anything is saved (v0.6, #33). |
| 10 | **Recipes and meal planning** | AnyList, Bring!, Grocy, KitchenOwl, Mealie, Paprika | Do not build a recipe manager. Import shopping lists and meal-plan ingredients from a self-hosted Mealie or KitchenOwl through their APIs as "needed" observations. |
| 11 | **Budget / running total and cost split** | AnyList, Listonic, Pantry Check, KitchenOwl | Sum usual prices from the price radar for items on the list ("about €34"). Cost splitting belongs with the planned shared-flat mode. |
| 12 | **Notifications and reminders** | AnyList (location), Pantry Check, NoWaste (expiry), kaufDA (offer bell) | Provide a scheduled Twenty workflow template (email or webhook) and an HA notification example: "leaving work and milk is probably low". |
| 13 | **Import and export** (moving from Bring!, AnyList or CSV) | Standard in many apps | Import CSV or JSON as Product and Purchase observations, and export the same way. This lowers switching cost and is already on the v0.6 roadmap. |
| 14 | **Item photos** | Bring!, AnyList, Pantry Check | Use the Open Food Facts product image by barcode (on request, as with community prices) or a Twenty file attachment. |
| 15 | **Retailer flyers and deals** (German market) | Bring!, marktguru, kaufDA, REWE | No open flyer data source was found. Keep deals household-sourced: manual deal entry, photos of flyers through the opt-in vision model, and open community prices. Do not scrape proprietary flyer platforms. |
| 16 | **Loyalty cards** | Bring!, REWE | Low value for a self-hosted assistant. At most, store a card image or number as a Twenty attachment; phone wallets cover this. |

## 4. Differentiators (verified against the repo)

Each of these was checked in the source. "Nobody else" means none of the products
reviewed here, based on their official pages.

1. **A probability and a reason for every estimate.** `src/domain/inference.ts`
   produces need, confidence, a status headline and an explanation, and every
   suggestion has a "Why?" view. Competitors' suggestions (Listonic, Pantry Check,
   KitchenOwl, Instacart "Buy it again") are unexplained lists or exact stock counts.
2. **Partial observations instead of full inventory.** The engine works from
   "bought / empty / still have / used some / needed" plus quantities, with no
   scan-in/scan-out. It learns from corrections, detects conflicts ("Unclear, please
   check"), lets old evidence decay back toward "don't know", and never suggests an
   item it has no data for. Inventory apps (Grocy, Pantry Check, NoWaste) need a full
   stock count.
3. **Active questions.** The app asks where one answer helps most ("Still enough
   coffee?"). No reviewed app does this.
4. **Stock-up advice tied to the household's rate of use.** `src/domain/prices.ts`
   combines use per day × shelf life × storage limit × discount into a recommendation
   with an estimated saving. Flyer apps show deals without knowing consumption, and
   list apps track prices without advising quantities.
5. **Open community prices by barcode.** Open Food Facts and Open Prices are used on
   request, sending the barcode only. The reviewed sources show Open Food Facts used
   only for product lookup (Grocy), not for Open Prices.
6. **Offline sentence understanding in German and English without AI.**
   `src/domain/commands.ts` handles "Milch ist leer", "2 Kaffee auf die Liste" and
   "Hab 2 Milch für 1,98 gekauft beim Discounter" deterministically. Competitors'
   natural-language features (Listonic AI, NoWaste AI, Gemini in Keep, Todoist Ramble,
   Mealie AI import) rely on a model.
7. **First-party MCP tools with "the model talks, the engine decides".** Three AI tools
   and a skill are available through Twenty's MCP server and work with any provider,
   including local ones. No reviewed competitor ships first-party MCP tools.
8. **An open HTTP door for one sentence.** `POST /s/talk` and `GET /s/needs` make Siri
   Shortcuts, Home Assistant, NFC tags, n8n and chat bots possible today. This avoids
   the shrinking Alexa and Google list APIs, which is how Bring!, AnyList, Todoist and
   Keep users lost voice features in 2023 to 2026.
9. **It runs inside a self-hosted CRM.** It uses Twenty permissions and roles,
   workflows (scheduled "what do we need?"), the audit metadata and the database.
   Grocy, KitchenOwl and Mealie are self-hosted but are separate stacks.
10. **Privacy by construction.** MIT licence, no backend of its own, no telemetry, no
    AI required. The only outside call is the opt-in barcode lookup
    (`docs/PRIVACY.md`). Listonic's App Store label declares tracking, and the free
    tiers of OurGroceries and Listonic show ads.
11. **Care mode (planned, not built yet).** None of the reviewed apps offers dedicated
    remote care for a relative's household (roadmap v0.5). If shipped, this would be a
    genuine gap-filler. Until then, do not claim it as a feature.

## 5. Market observations for positioning

- **Voice.** Plan the Alexa skill as a custom skill with its own invocation name (the
  only option since July 2024). Tell users plainly that "Alexa, add milk" will go to
  Amazon's own list. Put Home Assistant Assist first, because it is locally controlled.
- **German market.** Bring! is Swiss and strong in German-speaking countries. kaufDA
  (shared shopping list linked to offers since June 2025, no registration) and
  marktguru (flyers plus a cashback-for-receipt-photo model) compete on deals, not on
  needs. REWE offers a list, voice input, REWE Bonus and eBon digital receipts (PDF kept
  up to three years). Everyday Runtime's German sentence parser and German explanations
  stand out here. A digital receipt import could later draw on the growing number of
  retailer eBons, from user-exported files only.
- **Prediction is becoming a selling point.** Fango (receipt scanning, shelf-life
  estimates, "about to run out" flags, $2.99 a month or $22.99 a year, per a 2026 blog
  article on its own site), Listonic's AI and Pantry Check's restock suggestions show
  demand. Everyday Runtime's edge is explaining its guesses honestly and running
  self-hosted.

## Appendix: other apps reviewed

| App | Short profile (checked 2026-09-26) |
| --- | --- |
| **Microsoft To Do** | Free list app with shared lists. It has no grocery categories; users in the Microsoft community forum asked for them. Microsoft's support page still describes an Alexa link through Cortana, but the status of that link was not verified. |
| **Alexa / Amazon shopping list** | Built-in list on Echo devices and in the Alexa and Amazon apps. Items can be added to Amazon Fresh and Whole Foods carts by voice. Alexa+ was announced in February 2025. Since 1 July 2024 there is no API for syncing third-party lists. |
| **Paprika 3** | Recipe manager for iOS, Mac, Android and Windows, sold separately per platform (Mac $29.99). Grocery lists combine ingredients and sort by custom aisles. Pantry with quantities and expiry dates, meal planner, cloud sync. |
| **Apple Reminders** | Grocery lists grouped into categories automatically (not in all languages). |
| **marktguru** | German and Austrian app for flyers, deals and cashback. It has a shopping list and favourites; cashback works by photographing receipts. Free. |
| **kaufDA** | German flyer app. Since June 2025 it has a shared, real-time shopping list with offers, retailer assignment, offer-expiry alerts and several lists. Free, no registration. |
| **REWE app** | Shopping list (manual, from offers, from recipes, by voice), REWE Bonus loyalty credit, eBon digital receipts. |
| **Picnic** | German and Dutch delivery supermarket. The app combines recipes, a list and ordering; order history allows quick reordering. |
| **Instacart** | "Buy it again" groups past purchases into dynamic aisles and past orders. New customers see "items customers buy regularly". |
| **Fango** | Shopping list with AI receipt scanning, shelf-life estimates, expiry reminders up to 14 days ahead, and household sharing for up to 4 people. $2.99 a month or $22.99 a year, according to its own blog. |

## Sources

All accessed 2026-09-26.

**Everyday Runtime (this repo):** `README.md`, `ROADMAP.md`, `docs/AI.md`,
`docs/INTEGRATIONS.md`, `docs/PRIVACY.md`, `docs/VISION.md`, `src/objects/product.object.ts`,
`src/domain/inference.ts`, `src/domain/prices.ts`, `src/domain/commands.ts`, `src/ui/screens/*`.

**Bring!**
- https://www.getbring.com/en/features
- https://apps.apple.com/us/app/bring-grocery-shopping-list/id580669177
- https://play.google.com/store/apps/details?id=ch.publisheria.bring&hl=en_US
- https://www.getbring.com/blog-posts/how-to-keep-using-bring-with-alexa
- https://www.getbring.com/blog-posts/google-assistant-no-more-support-for-third-party-list-apps
- https://www.getbring.com/help-center-main-categories/voice-assistants
- https://www.home-assistant.io/integrations/bring/

**AnyList**
- https://www.anylist.com/features
- https://www.anylist.com/complete
- https://help.anylist.com/articles/alexa-skill-update-july-2024/
- https://help.anylist.com/articles/alexa-skill-notice-july-2024/
- https://help.anylist.com/articles/anylist-feature-overview-item-prices/

**OurGroceries**
- https://www.ourgroceries.com/faq
- https://www.ourgroceries.com/user-guide
- https://www.home-assistant.io/integrations/ourgroceries/

**Listonic**
- https://listonic.com/
- https://apps.apple.com/us/app/listonic-grocery-list-app/id331302745
- https://play.google.com/store/apps/details?id=com.l&hl=en_US

**Google Keep**
- https://support.google.com/keep/answer/15222789?hl=en
- https://9to5google.com/2026/08/25/google-home-keep-integration-broken-due-to-bug/
- https://phonearena.com/news/Google-moves-Keep-shopping-list-functionality-to-Google-Home-and-Express_id92904

**Todoist**
- https://www.todoist.com/pricing
- https://www.morgen.so/blog-posts/todoist-pricing
- https://www.home-assistant.io/integrations/todoist/
- https://community.home-assistant.io/t/alexa-is-deprecating-the-todoist-shopping-list-tasks-integration/737113

**Microsoft To Do**
- https://support.microsoft.com/en-us/office/using-microsoft-to-do-with-alexa-via-cortana-1a29f12c-c08f-48ca-bde0-4932a0c90f2b
- https://techcommunity.microsoft.com/discussions/to-do/dedicated-grocery-list/4257009

**Alexa / Amazon**
- https://developer.amazon.com/en-US/docs/alexa/ask-overviews/deprecated-features.html
- https://www.amazon.com/gp/help/customer/display.html?nodeId=GD3EUQJTHX2M7YRN
- https://www.amazon.com/b?ie=UTF8&node=21341306011
- https://en.wikipedia.org/wiki/Amazon_Alexa

**Grocy**
- https://grocy.info/
- https://github.com/grocy/grocy
- https://github.com/custom-components/grocy

**KitchenOwl**
- https://kitchenowl.org/features/
- https://github.com/TomBursch/kitchenowl
- https://repocloud.io/details/KitchenOwl/

**Mealie**
- https://mealie.io/documentation/getting-started/features/
- https://mealie.io/documentation/getting-started/installation/ai-providers/
- https://www.home-assistant.io/integrations/mealie/

**Pantry Check**
- https://pantrycheck.com/
- https://apps.apple.com/us/app/pantry-check-grocery-shopping/id966702368

**NoWaste**
- https://www.nowasteapp.com/
- https://apps.apple.com/us/app/nowaste-food-inventory-list/id926211004

**Paprika**
- https://www.paprikaapp.com/

**Apple Reminders**
- https://support.apple.com/guide/reminders/remn175e6897/7.0/mac/14.0

**German market**
- https://www.marktguru.de/
- https://apps.apple.com/de/app/marktguru-prospekte-angebote/id1064025602
- https://www.kaufda.de/insights/die-neue-einkaufsliste-in-der-kaufda-app-jetzt-kostenlos-teilen-und-sparen/
- https://support.kaufda.de/hc/de/articles/16340589345810-Wie-kann-ich-meine-Einkaufsliste-verwalten
- https://www.rewe.de/service/app/
- https://www.rewe.de/service/ebon/
- https://picnic.app/de/online-supermarkt/
- https://www.home-assistant.io/integrations/picnic/

**Prediction and "buy it again"**
- https://docs.instacart.com/storefront/learn_about_your_storefront/shopping/buy_it_again/
- https://fango.fi/en/blog/best-shopping-list-app/

**Home Assistant (general)**
- https://www.home-assistant.io/integrations/todo/
- https://www.home-assistant.io/integrations/shopping_list/

---

## Kurzfassung auf Deutsch

**Stand: 26.09.2026.** Der Markt besteht aus vier Gruppen:

- **Geteilte Einkaufslisten** wie Bring!, AnyList, OurGroceries und Listonic. Sie sind
  kostenlos und bieten Premium für etwa 1 bis 2 US$ im Monat.
- **Allgemeine Listen-Apps** wie Google Keep, Microsoft To Do und Todoist.
- **Vorratsverwaltungen** wie Grocy, Pantry Check und NoWaste. Sie bieten Barcode und
  Mindesthaltbarkeit, setzen aber voraus, dass jeder Artikel ein- und ausgebucht wird.
- **Händler- und Prospekt-Apps** wie marktguru, kaufDA, REWE und Picnic.

Selbst gehostet sind nur Grocy, KitchenOwl und Mealie.

**Lücken im Markt:** Keine der geprüften Apps zeigt eine *Wahrscheinlichkeit mit
Begründung* („Milch wahrscheinlich knapp, 89 %“). Keine berechnet eine
Bevorratungsempfehlung aus dem eigenen Verbrauch. Keine hat einen Fürsorge-Modus für
Angehörige. Die Anbindung an Sprachassistenten bröckelt: Amazon hat die Listen-API am
01.07.2024 abgeschaltet, unter Alexa+ muss man „öffne Bring!“ sagen, und Google hat
Drittanbieter-Listen beendet. Offene Wege über HTTP, Home Assistant und MCP werden
dadurch wertvoller.

**Wichtigste Paritätslücken von Everyday Runtime, nach Nutzen geordnet:**

1. Mehrere Personen mit Live-Aktualisierung und „wer hat was gemeldet“
2. Einkaufsmodus nach Gang bzw. Kategorie sortiert
3. Barcode-Scan mit der Kamera
4. Alexa-Skill und Home-Assistant-Assist
5. Native Home-Assistant-Integration (To-do-Entität, Sensoren)
6. Offline-Nutzung, PWA und Widget
7. Mehrere Listen
8. Mindesthaltbarkeit bzw. „bald verbrauchen“
9. Kassenbon- und Foto-Erfassung (opt-in)
10. Rezepte und Essensplanung, besser über eine Anbindung an Mealie oder KitchenOwl als
    selbst gebaut

**Alleinstellungsmerkmale** (im Code geprüft):

- Erklärte Schätzungen statt exakter Bestände
- Lernen aus Korrekturen, Konflikterkennung und aktive Rückfragen
- Preis-Radar mit Bevorratungsempfehlung und Open Prices
- Kostenloses, offline arbeitendes Satzverständnis auf Deutsch und Englisch („Milch
  ist leer“)
- Eigene MCP-Werkzeuge (die KI spricht, die Engine entscheidet)
- HTTP-Schnittstelle `POST /s/talk`
- Läuft im selbst gehosteten Twenty-CRM, ohne Telemetrie, unter MIT-Lizenz

Fremden Code, Texte, Icons oder Daten nicht übernehmen, sondern gleichwertige
Funktionen selbst bauen.
