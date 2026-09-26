# Vision: Everyday Runtime

> *Deutsche Fassung: [VISION.de.md](VISION.de.md)*

**Everyday Runtime becomes the household intelligence that uses everything that already
exists — voice assistants, appliances, photos, receipts, open price data and the
experience of many households — and turns it into honest, explained decisions:
*What do we need? When? Where is it cheap right now? How much is worth stocking up?***

The core stays what Everyday Runtime is today: no false precision, a reason for every
guess, data stays with the household. What changes is the reach.

## Who it is for

| Situation | What Everyday Runtime does |
| --- | --- |
| **Families** | Everyone contributes, nobody keeps books. Who bought last, who reported “empty” — visible, without arguments. |
| **Shared flats** | Shared supplies (toilet paper, detergent) separate from private ones; whose turn it is; fair cost overview. |
| **Parents who can no longer manage alone** | Relatives see from afar what is probably missing at their parents’ place and get a heads-up before it runs out. The parents need no app: one sentence to Alexa, a button, a photo — or nothing at all if the buying rhythm is enough. |
| **Bargain hunters** | “Volvic is unusually cheap at X this week — you will need some in ~10 days, 3 crates last until the end of November.” |

## Five pillars

### 1. Capture without effort — “every source is an observation”
- **Voice:** a dedicated Alexa skill (“Alexa, tell Everyday milk is empty”), Home Assistant
  Assist, natural-language Telegram/Signal messages.
- **Photos:** barcode on the package → product via Open Food Facts. Without a barcode,
  receipts, flyers or the fridge’s contents → an optional vision model (local or cloud, opt-in).
- **Devices:** fridge cameras where available, door/temperature events, smart scales, NFC
  tags on the pantry shelf.
- **Shopping:** receipt import, forwarded online order confirmations.

### 2. Understand — deterministic core, AI as an assistant
- **Decisions** stay with the explainable, tested rules.
- **AI** does what rules cannot: read photos, understand sentences, match products,
  phrase questions. It **proposes observations**; it does not silently decide. Local models
  (e.g. via Ollama) are a first-class option.
- **Active questions:** instead of guessing, the app asks where an answer helps most:
  “Is there still enough coffee?” — one tap.

### 3. Price radar and stock-up planning
- **Price observations** from own purchases, receipts and the open **Open Prices**
  database (Open Food Facts) — and contributions back to it: real swarm intelligence.
- **Deal detection:** “lowest price in 90 days”, “promotion at retailer X”.
- **Stock-up planning:** use per day × shelf life × storage space × discount.
- **Price alerts:** “tell me when Volvic drops below €0.35/l”.
- Amazon price history via **Keepa** (paid, own key) as an optional source.

### 4. Households together
- **Multi-person households**, roles (member, guest, carer).
- **Care mode:** relatives accompany a second household (e.g. their parents), with consent
  and transparency for the person cared for.
- **Shared-flat mode:** shared vs. private products, shopping rota, cost splitting.

### 5. Act — wherever the household already is
- **Home Assistant** sensors, to-do list and automations; **Alexa** skill; **Telegram/Signal**
  bot; **webhooks**; export to Bring!/Todoist.
- **One-tap ordering:** a prepared cart link — deliberately **confirmed by a person**, not
  fully automatic.

## What is possible — and what is not (research as of September 2026)

| Idea | Status | Approach |
| --- | --- | --- |
| Read/write the Alexa shopping list directly | ❌ Amazon shut down the List API on 1 July 2024 | own skill with its own invocation name; or community Home Assistant integrations (unofficial APIs) |
| Bosch/Siemens (Home Connect) | ✅ official API | temperature/door/status; **fridge camera** discontinued for older appliances from 31 March 2026, otherwise `/images` |
| Miele | ✅ official 3rd Party API | temperature, alerts, modes — **no contents** |
| Samsung Family Hub | ⚠️ camera/“AI Food Manager” only via undocumented SmartThings endpoints | optional, experimental adapter |
| Barcode → product | ✅ Open Food Facts, free, 15 reads/min per IP | core adapter |
| Open price data | ✅ Open Prices, open API, community data, focus on Europe | core adapter, read **and contribute** |
| Amazon price history | 💶 Keepa API from €49/month | optional with own key |
| idealo prices | ❌ no public read API; scraping violates the terms | not implemented |
| Flyer deals (marktguru, kaufDA) | ❌ no open API | users photograph/share flyers → vision model extracts deals (own household only) |
| Automatic Amazon reordering | ❌ PA-API retired in 2026; Dash Replenishment only for certified devices | one-tap cart link, confirmed by a person |
| Reading receipts | ✅ with a vision model (local or cloud) | opt-in adapter |

Rules for every integration: **official interfaces first**, no circumventing bot
protection, no sharing of household data without explicit opt-in, every source visible
in “Why?”.

## Architecture in one sentence

Every source is an **adapter** that delivers observations, prices or product data; the
**deterministic core** evaluates; **actions** (notifications, lists, orders) are adapters
again. Details: [ARCHITECTURE.md](ARCHITECTURE.md).

## Order of work

See [ROADMAP.md](../ROADMAP.md). In short: German UI + active questions + price radar
first, then households/care, then capture by photo/voice, then devices and automations.

## Sources

- Alexa List API shutdown: [Alexa deprecated features](https://developer.amazon.com/en-US/docs/alexa/ask-overviews/deprecated-features.html)
- Home Connect: [API docs](https://api-docs.home-connect.com/), [camera FAQ](https://developer.home-connect.com/support/faq)
- Miele: [3rd Party API](https://developer.miele.com/)
- Samsung Family Hub: [SmartThings community](https://community.smartthings.com/t/samsung-family-hub-camera-door-view/295877), [Home Assistant integration](https://github.com/ibielopolskyi/smartthings_fridge_camera)
- Open Food Facts: [API](https://openfoodfacts.github.io/openfoodfacts-server/api/), [Open Prices](https://prices.openfoodfacts.org/about), [Open Prices API](https://prices.openfoodfacts.org/api/docs)
- Keepa: [API](https://keepa.com/api-docs/)
- Amazon: [Creators API replacing PA-API](https://webservices.amazon.com/paapi5/documentation/), [Dash Replenishment](https://developer.amazon.com/dash-replenishment-service)
- Alexa ↔ Home Assistant: [alexa_shopping_sync](https://github.com/ocean90/alexa_shopping_sync)
