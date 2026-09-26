# AI in Everyday Runtime

> 🇩🇪 Kurzfassung auf Deutsch unten.

**Principle: AI understands and talks; the deterministic engine decides.** Language
models are good at understanding messy sentences, photos and receipts. They are bad at
knowing your stock and expensive when used for everything. So Everyday Runtime uses a
cheap tier first and AI only where it adds something — and every answer still comes
from the tested engine, with its reason.

## Tiers

| Tier | What | Cost | Status |
| --- | --- | --- | --- |
| **0 — built in** | “Talk to your list”: a deterministic German/English parser (`src/domain/commands.ts`) understands everyday sentences — “Milch ist leer”, “2 Kaffee auf die Liste”, “Hab 2 Milch für 1,98 gekauft beim Discounter”, “Was brauchen wir?”, “Ist Kaffee gerade günstig?”. Voice via the phone keyboard's microphone. | free, offline, instant | ✅ 0.4 |
| **1 — AI tools** | Three tools for Twenty's AI chat (and anything that uses Twenty's MCP server): `everyday-needs`, `everyday-product`, `everyday-update`, plus the `everyday-shopping` skill that tells the model how to use them. The model only translates between the person and the tools; numbers, reasons and prices come from the engine. | the workspace's own AI provider, small models suffice, few tokens per turn | ✅ 0.4 |
| **2 — capture** | Receipts, packaging photos, flyers → proposed observations and prices, confirmed by a person. | opt-in, local model (e.g. Ollama) or cloud | planned (v0.6, #33) |
| **3 — voice assistants** | Alexa skill, Home Assistant Assist. | depends on platform | planned (#34, #35) |

## Why this is cheap

- **Most sentences never reach a model.** Tier 0 handles the common ones in
  microseconds.
- **Tools do the thinking.** The model gets short, pre-computed answers
  (`probablyNeeded`, `reason`, `goodPrices`) instead of raw history, so prompts stay
  small and a small, inexpensive model is enough.
- **One call per sentence.** `everyday-update` takes all products of a sentence at
  once (“2 Milch, Eier”).
- **Local models welcome.** Nothing depends on a specific provider.

## Using the AI tools

1. Configure an AI provider in your Twenty workspace (Settings → AI).
2. Install/update Everyday Runtime (`yarn twenty apply`).
3. In Twenty's AI chat, ask e.g. “What do we need this week?” or “Wir haben keine
   Milch mehr und Kaffee war heute bei Lidl für 4,99 im Angebot”. The chat can call
   the Everyday tools; the `everyday-shopping` skill describes how.

The tools act as the signed-in person (same permissions as the app).

## Help wanted

The parser learns from examples. Every real sentence that it does not understand is
a welcome contribution — as a test row in `src/domain/__tests__/commands.test.ts`,
or simply in an issue. Other languages are welcome too.

---

## 🇩🇪 Kurzfassung

**Grundsatz: Die KI versteht und spricht, die geprüfte Engine entscheidet.**

- **Stufe 0 (kostenlos, offline):** „Sprich mit deiner Liste“ versteht Alltagssätze
  auf Deutsch und Englisch — „Milch ist leer“, „2 Kaffee auf die Liste“, „Hab 2 Milch
  für 1,98 gekauft beim Discounter“, „Was brauchen wir?“, „Ist Kaffee gerade günstig?“.
  Sprechen geht über das Mikrofon der Handy-Tastatur.
- **Stufe 1 (KI-Werkzeuge):** Twentys KI-Chat (und MCP-Clients) können die App über
  drei Werkzeuge und einen Skill bedienen. Die KI rechnet nicht selbst, sondern ruft
  die Engine auf — deshalb reichen kleine, günstige Modelle und wenige Tokens.
- **Geplant:** Kassenbon- und Verpackungsfotos (lokal oder Cloud, nur mit
  Zustimmung), Alexa-Skill, Home Assistant.

**Mitmachen:** Jeder Satz, den die App nicht versteht, hilft — als Testzeile oder
einfach als Issue.
