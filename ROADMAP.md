# Roadmap

Direction, not promises. The why behind it: [docs/VISION.md](docs/VISION.md) ·
[Deutsch: docs/VISION.de.md](docs/VISION.de.md). Priorities follow feedback from real
households — open an issue or join the [discussions](https://github.com/micha16372/everyday-runtime/discussions).

## v0.1 — Smart shopping core ✅ (0.1.0)

- [x] Data model: Product, Observation, ShoppingItem, Purchase
- [x] Deterministic, explainable inference engine with unit tests
- [x] Now, Shopping list, Products and Activity screens; “Why?” on every suggestion
- [x] Demo household, `GET /s/needs`

## v0.2 — Better estimates ✅ (0.2.0)

- [x] Purchase quantities: 3 l last longer than 1 l (#2)
- [x] Learning from “Empty” / “Still have it” corrections (#3)

## v0.3 — German, active questions, price radar ✅ (0.3.0)

- [x] German user interface and i18n groundwork (#11)
- [x] Active questions: the app asks where an answer helps most (“Still enough coffee?”)
- [x] Price observations from purchases; price history per product
- [x] Deal detection (“lowest price in 90 days”) and price alerts
- [x] Stock-up planning: use per day × shelf life × storage × discount
- [x] Open Food Facts barcode lookup and Open Prices as an open price source (read)

## v0.4 — Talk to your list ✅ (0.4.0)

- [x] Free, offline sentence understanding in German and English (“Milch ist leer”, “Was brauchen wir?”)
- [x] AI tools and a skill for Twenty's AI chat / MCP — the model talks, the engine decides ([docs/AI.md](docs/AI.md))
- [x] `POST /s/talk` and Twenty workflow actions for automations ([docs/INTEGRATIONS.md](docs/INTEGRATIONS.md))
- [ ] More phrasings and languages from the community

How we compare with other list and pantry apps: [docs/MARKET.md](docs/MARKET.md).

## v0.5 — Households together

- [ ] Several people per household, who reported what (#4)
- [ ] Care mode: relatives look after a second household (e.g. parents), with consent (#31)
- [ ] Shared-flat mode: shared vs. private products, rota, cost split (#32)
- [ ] Shopping mode sorted by store and aisle (#43)
- [ ] Multiple lists, per store or occasion (#46)
- [ ] CSV import and export (#49)
- [ ] Better activity history: filters, undo, edit/delete (#5)
- [ ] Server-side aggregation for long histories (#6)

## v0.6 — Capture without effort

- [ ] Camera barcode scan → product (#44); packaging photo → product (#33)
- [ ] Best-before dates and “use soon” hints (#47)
- [ ] Installable web app: home-screen shortcut, offline queue (#45)
- [ ] Receipt import (vision model, local or cloud, opt-in) (#33)
- [ ] Natural-language capture via Telegram/Signal (“we’re out of milk”)
- [ ] NFC tags for “empty”
- [ ] Contribute prices back to Open Prices (opt-in)

## v0.7 — Integrations and actions

- [ ] Home Assistant: sensors, to-do list, automations (#34)
- [ ] Alexa skill (own invocation name) (#35)
- [ ] Recipe ingredients from self-hosted Mealie or KitchenOwl (#48)
- [ ] Webhooks; export to Bring!/Todoist
- [ ] Appliance adapters: Home Connect, Miele, Samsung Family Hub (experimental)
- [ ] Keepa (own key) for Amazon price history; one-tap cart links, always confirmed by a person

## v1.0 — Stable

- [ ] A stable self-hosted workflow with upgrade documentation
- [ ] A documented privacy model for households, care relationships and shared data
- [ ] Feedback from real households incorporated
