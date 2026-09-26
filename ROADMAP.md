# Roadmap

This roadmap describes direction, not promises. Priorities change with feedback
from real households — open an issue if something here matters to you (or does
not).

## v0.1 — Smart shopping core (released as 0.1.0)

- [x] Data model: Product, Observation, ShoppingItem, Purchase
- [x] Deterministic, explainable inference engine with unit tests
- [x] Now, Shopping list, Products and Activity screens
- [x] Confirmed vs. estimated information, “Why?” on every suggestion
- [x] Demo household
- [x] `GET /s/needs` JSON endpoint

## v0.2 — Better estimates, real households

Shipped in 0.2.0:

- [x] Better consumption intervals: use purchase quantities (2 l lasts longer than 1 l) — #2
- [x] Learn from “Still have it” / “Empty” corrections (per-product calibration) — #3

Still open:

- [ ] Households with several people: who added what, per-person views — #4
- [ ] Better activity history: filters, undo, edit/delete an observation — #5
- [ ] Server-side aggregation instead of loading the whole history into the browser — #6
- [ ] German translation and i18n groundwork — #11

## v0.3 — Less typing

- [ ] Barcodes (scan to add / to mark bought)
- [ ] Receipt import
- [ ] Import / export (CSV, JSON)

## v0.4 — Integrations

- [ ] Webhooks for “something is probably needed”
- [ ] Home Assistant integration (sensors per product, “add to list” service)
- [ ] Telegram capture (“we're out of milk”)

## v0.5 — Money

- [ ] Store
- [ ] Offer
- [ ] PriceObservation
- [ ] Price per unit
- [ ] Offer rating (“is this a good price for us?”)
- [ ] Smart stock-up purchases (buy more when cheap and not perishable)

## v1.0 — Stable

- [ ] A stable self-hosted shopping workflow
- [ ] Upgrade documentation
- [ ] A documented privacy model
- [ ] Feedback from real households incorporated
