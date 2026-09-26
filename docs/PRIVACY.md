# Privacy

Everyday Runtime is designed to be self-hosted. This page describes what the app
stores and where. It describes the app's own behaviour; the privacy properties of
your Twenty installation (hosting, backups, logs, other apps) are up to whoever
operates it.

## Where data lives

All data is stored as records in your Twenty workspace database, in four objects:
Product, Observation, ShoppingItem and Purchase. Everyday Runtime has **no backend
of its own**, no analytics and no telemetry.

## What is stored

| Object | Contains |
| --- | --- |
| Product | Name, category, unit, optional barcode and typical quantity, archived flag |
| Observation | Product, what happened (bought, used, empty, seen in stock, needed), when, optional quantity and note, source (app, shopping list, demo, import, API) |
| ShoppingItem | Product, quantity, status, whether a person or the app added it, the confidence and reason at the time, timestamps |
| Purchase | Product, quantity, time, optional price and store |

Twenty adds its usual metadata (created/updated time and the workspace member or
API key that made the change).

Shopping habits can be personal (health, diet, household composition). Treat the
workspace accordingly and restrict access with Twenty roles if several people use
the same workspace.

## What is sent elsewhere

By default, nothing. The inference engine runs locally — in the browser for the UI
and in Twenty logic functions. There are no calls to AI providers and no telemetry.

One feature contacts a third party, **only when you press it**: *Community prices*
(product details, v0.3) sends the product's **barcode** from your Twenty server to
[Open Food Facts](https://world.openfoodfacts.org/) and
[Open Prices](https://prices.openfoodfacts.org/) to read public product data and
community prices. No household data, product history, names or account data are
sent. Prices you choose to import are stored in your workspace as “community”
price observations.

Price observations you enter yourself stay in your workspace; contributing them
back to Open Prices is planned as a separate, explicit opt-in (not built yet).

## Access

- The UI and the `/s/needs` route act as the signed-in person (their Twenty role
  intersected with the app's role).
- `/s/needs` requires authentication.
- Browser storage is not used for household data.

## Deleting data

- **One product and its history:** open `/objects/products` in your Twenty
  workspace (or use the REST API) and permanently delete the product.
  Observations, list items and purchases of that product are deleted with it.
- **Archive instead of delete:** “Archive product” in the app hides a product
  and stops suggestions but keeps its history.
- **Everything:** delete the records of the four objects, or uninstall the app
  (`yarn twenty app:uninstall`), which removes its objects together with their
  records.
- **Demo data:** demo observations are marked with source “Demo data”; deleting the
  demo products removes them.
