# Home Assistant

> 🇩🇪 Deutsche Anleitung unten.

The Everyday Runtime integration brings your household into Home Assistant:

| Entity / action | What it does |
| --- | --- |
| `todo.everyday_shopping_list` | The shopping list as a to-do list. Checking an item off **records a purchase**, so the engine learns from it. Unchecking reopens it, and removing it clears it from the list. Items bought in the last 7 days stay visible as completed. |
| `sensor.everyday_probably_needed` | How many products are probably needed. Attributes: `items` (name, status, `need_percent`, `is_estimate`, reason, `on_list`) and `not_on_list`. |
| `sensor.everyday_on_the_list` | Open items on the list. Attribute `items` lists their names. |
| `everyday_runtime.talk` | One sentence in, answer out: `Milch ist leer`, `2 Kaffee auf die Liste`, `What do we need?`. Returns `reply`, `understood`, `intent` and `changed`. |

Entity IDs depend on your language (for example `todo.everyday_einkaufsliste` in German).
Data refreshes every 5 minutes and right after every change you make.

## Install

**Requirements:** Home Assistant 2025.1 or newer, and a Twenty workspace with Everyday Runtime
0.4.1 or newer installed.

1. **HACS:** *HACS → ⋮ → Custom repositories →* `https://github.com/micha16372/everyday-runtime`,
   type *Integration*. Then install **Everyday Runtime** and restart Home Assistant.
   **Manual:** copy `custom_components/everyday_runtime` into your `config/custom_components/`
   and restart.
2. In Twenty, create an API key under **Settings → APIs & Webhooks**.
3. In Home Assistant: **Settings → Devices & services → Add integration → Everyday Runtime**.
   Enter the Twenty address you open in your browser (e.g. `https://crm.example.com`) and the key.

The key stays in Home Assistant's config entry storage. If Twenty rejects the key later,
Home Assistant asks for a new one.

## Voice with Assist

The shopping list works with Assist's built-in to-do sentences. Expose
`todo.everyday_shopping_list` to Assist, then say:

- *"Add milk to my shopping list"* or, in German, *"Füge Milch zur Einkaufsliste hinzu"*
- *"What is on my shopping list?"*

For everything else, like *"Milch ist leer"*, *"ich habe Kaffee gekauft"*, *"haben wir noch Butter"*,
*"was brauchen wir"*, *"we're out of milk"* or *"do we have eggs"*, use the ready-made
examples in [`integrations/home-assistant/examples`](../integrations/home-assistant/examples):

1. Copy [`everyday_voice.yaml`](../integrations/home-assistant/examples/everyday_voice.yaml) to
   `config/packages/`. Packages are enabled with `homeassistant: packages: !include_dir_named packages`.
2. Copy `custom_sentences/de/everyday.yaml` and/or `custom_sentences/en/everyday.yaml` to
   `config/custom_sentences/<language>/`.
3. Restart Home Assistant.

Assist then forwards the sentence to `everyday_runtime.talk` and speaks Everyday's answer. These
examples are tested against Home Assistant's own conversation engine
(`tests/test_voice_examples.py`).

## Automation ideas

- **Arriving near the supermarket** → a notification listing what is probably needed (example below).
- **NFC tag on the coffee jar** → `everyday_runtime.talk` with `Kaffee ist leer`.
- **Weekly summary** on Saturday morning with the `reply` of `What do we need?`.

```yaml
automation:
  - alias: "Shopping reminder near the supermarket"
    triggers:
      - trigger: zone
        entity_id: person.me
        zone: zone.supermarket
        event: enter
    conditions:
      - condition: numeric_state
        entity_id: sensor.everyday_probably_needed
        above: 0
    actions:
      - action: notify.mobile_app_my_phone
        data:
          title: "Probably needed"
          message: >
            {{ state_attr('sensor.everyday_probably_needed', 'items')
               | map(attribute='name') | join(', ') }}
```

## What it sends

Only the Twenty address you enter is contacted, with your API key: `GET /s/list`,
`GET /s/needs`, `POST /s/list/items` and `POST /s/talk`. There is no cloud service and no
telemetry.

---

## 🇩🇪 Auf Deutsch

Die Integration bringt Everyday Runtime in Home Assistant:

- **Einkaufsliste** als To-do-Liste: Abhaken **zählt als Einkauf**, damit die Engine daraus lernt.
- **Sensoren** „Wahrscheinlich gebraucht“ und „Auf der Liste“, mit Namen, Grund und Prozent in den Attributen.
- **Aktion `everyday_runtime.talk`**: ein Satz rein („Milch ist leer“, „Was brauchen wir?“), die Antwort raus.

**Installation:** In HACS unter *Benutzerdefinierte Repositories* `https://github.com/micha16372/everyday-runtime`
als *Integration* hinzufügen, **Everyday Runtime** installieren und Home Assistant neu starten.
Dann in Twenty unter *Einstellungen → APIs & Webhooks* einen API-Schlüssel erstellen. In Home Assistant
unter *Einstellungen → Geräte & Dienste → Integration hinzufügen → Everyday Runtime* die
Twenty-Adresse und den Schlüssel eintragen.

**Sprache:** Mit Assist funktioniert „Füge Milch zur Einkaufsliste hinzu“ sofort. Für „Milch ist leer“,
„Ich habe Kaffee gekauft“, „Haben wir noch Butter“ und „Was brauchen wir“ kopierst du
[`everyday_voice.yaml`](../integrations/home-assistant/examples/everyday_voice.yaml) nach `config/packages/`
und `custom_sentences/de/everyday.yaml` nach `config/custom_sentences/de/`. Danach Home Assistant neu starten.

**Datenschutz:** Home Assistant spricht nur mit deiner eigenen Twenty-Adresse. Es gibt keinen Cloud-Dienst und kein Tracking.
