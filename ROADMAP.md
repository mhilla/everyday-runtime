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

## v0.3 — German, active questions, price radar

- [ ] German user interface and i18n groundwork (#11)
- [ ] Active questions: the app asks where an answer helps most (“Still enough coffee?”)
- [ ] Price observations from purchases; price history per product
- [ ] Deal detection (“lowest price in 90 days”) and price alerts
- [ ] Stock-up planning: use per day × shelf life × storage × discount
- [ ] Open Food Facts barcode lookup and Open Prices as an open price source (read)

## v0.4 — Households together

- [ ] Several people per household, who reported what (#4)
- [ ] Care mode: relatives look after a second household (e.g. parents), with consent
- [ ] Shared-flat mode: shared vs. private products, rota, cost split
- [ ] Better activity history: filters, undo, edit/delete (#5)
- [ ] Server-side aggregation for long histories (#6)

## v0.5 — Capture without effort

- [ ] Barcode scan and packaging photo → product
- [ ] Receipt import (vision model, local or cloud, opt-in)
- [ ] Natural-language capture via Telegram/Signal (“we’re out of milk”)
- [ ] NFC tags for “empty”, import/export (CSV, JSON)
- [ ] Contribute prices back to Open Prices (opt-in)

## v0.6 — Integrations and actions

- [ ] Home Assistant: sensors, to-do list, automations
- [ ] Alexa skill (own invocation name)
- [ ] Webhooks; export to Bring!/Todoist
- [ ] Appliance adapters: Home Connect, Miele, Samsung Family Hub (experimental)
- [ ] Keepa (own key) for Amazon price history; one-tap cart links, always confirmed by a person

## v1.0 — Stable

- [ ] A stable self-hosted workflow with upgrade documentation
- [ ] A documented privacy model for households, care relationships and shared data
- [ ] Feedback from real households incorporated
