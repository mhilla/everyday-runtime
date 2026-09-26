# Integrations and automations

> 🇩🇪 Deutsche Kurzfassung unten.

Everyday Runtime offers three doors to the outside world. All of them run on your
own Twenty server and act with the permissions of the API key or person that calls
them.

| Door | For | Endpoint |
| --- | --- | --- |
| **MCP** | AI assistants (Claude, ChatGPT connectors, Cursor, any MCP client) | `https://<your-twenty>/mcp` — the tools `app_everyday_needs`, `app_everyday_product`, `app_everyday_update` |
| **HTTP** | Shortcuts, Home Assistant, n8n/Node-RED, bots, NFC tags | `POST /s/talk` (one sentence), `GET /s/needs` (JSON), `GET /s/community-prices` |
| **Twenty workflows** | Scheduled or event-driven automations inside Twenty | actions “Everyday: what do we need?” and “Everyday: record what happened” |

You need an API key: Twenty **Settings → APIs & Webhooks → Create key**. Treat it
like a password.

## MCP: let any AI know your shopping list

Twenty exposes its own MCP server at `/mcp`; the Everyday tools appear in its tool
catalog automatically after `yarn twenty apply`. Example for clients that need a
local bridge (e.g. Claude Desktop), using the open-source
[`mcp-remote`](https://www.npmjs.com/package/mcp-remote):

```json
{
  "mcpServers": {
    "everyday": {
      "command": "npx",
      "args": ["mcp-remote", "https://your-twenty.example.com/mcp",
               "--header", "Authorization: Bearer ${TWENTY_API_KEY}"],
      "env": { "TWENTY_API_KEY": "your-api-key" }
    }
  }
}
```

Then ask: *“What do we need this week?”*, *“Wir haben keine Milch mehr”*, *“Is coffee
cheap right now?”*. The AI calls the tools; numbers and reasons come from the engine.

## HTTP: one sentence in, answer out

```bash
curl -X POST https://your-twenty.example.com/s/talk \
  -H "Authorization: Bearer $TWENTY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hab 2 Milch für 1,98 gekauft beim Discounter"}'
# → {"ok":true,"intent":"BOUGHT","language":"de","changed":true,
#    "reply":"Notiert: 2 l Milch gekauft für 1,98 € bei Discounter."}
```

`GET /s/needs` returns what is probably needed as JSON (for dashboards).

## Automation ideas

| Idea | How |
| --- | --- |
| **“Hey Siri, Einkauf”** | iOS Shortcut: *Dictate text* → *Get contents of URL* (`POST /s/talk`, JSON `{"text": …}`) → *Speak* the `reply`. Android: HTTP Shortcuts or Tasker. |
| **NFC tag on the coffee jar** | Scanning the tag runs a shortcut/automation that posts `{"text": "Kaffee ist leer"}`. |
| **Home Assistant** | `rest_command` posting to `/s/talk` (buttons, NFC, Assist); a `rest` sensor on `/s/needs` for dashboards and notifications (“leaving work and milk is probably low”). |
| **Weekly list by email or Telegram** | Twenty workflow (schedule trigger) → “Everyday: what do we need?” → send email; or n8n/Node-RED → `GET /s/needs` → Telegram. |
| **Chat bot** | A Telegram/Signal bot forwards messages to `/s/talk` and replies with `reply`. |
| **Care for parents** | A relative's phone gets the weekly needs of the parents' household (planned care mode, v0.5). |

---

## 🇩🇪 Kurzfassung

- **MCP:** Jede KI mit MCP-Unterstützung kann über `https://<dein-twenty>/mcp` die
  Einkaufsliste lesen und Meldungen machen (Werkzeuge `app_everyday_needs`,
  `app_everyday_product`, `app_everyday_update`). Beispielkonfiguration oben.
- **HTTP:** `POST /s/talk` mit `{"text": "Milch ist leer"}` versteht einen Satz und
  antwortet — ideal für Siri-Kurzbefehle, Home Assistant, n8n, Telegram-Bots und
  NFC-Tags. `GET /s/needs` liefert den Bedarf als JSON.
- **Twenty-Workflows:** Die Aktionen „Everyday: what do we need?“ und „Everyday:
  record what happened“ lassen sich zeitgesteuert nutzen, z. B. jeden Freitag die
  Einkaufsliste per E-Mail.
- Immer nötig: ein API-Schlüssel aus Twenty (Einstellungen → APIs & Webhooks). Wie
  ein Passwort behandeln.
