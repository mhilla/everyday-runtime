# Alexa

> 🇩🇪 Deutsche Anleitung unten.

There are two ways to use Everyday Runtime with Alexa. Pick one, or use both.

| | **A. Everyday skill** (`integrations/alexa`) | **B. Alexa's own shopping list → Everyday** |
| --- | --- | --- |
| You say | *"Alexa, tell everyday list we're out of milk"*, *"Alexa, ask everyday list what do we need"* | *"Alexa, put milk on my shopping list"* |
| What happens | Your own private skill sends the sentence to `POST /s/talk` and reads the answer aloud. | Home Assistant moves new items from Alexa's list into Everyday. |
| Understands | empty, bought, still have it, on the list, "do we have …?", "what do we need?", prices, and free sentences ("note …") | adding items only |
| Needs | A free Amazon developer account. Twenty must be reachable over HTTPS from the internet. | Home Assistant with the [Everyday integration](HOME_ASSISTANT.md) and a community integration that exposes Alexa's list (unofficial). |

**Why no direct sync?** Amazon shut down the Alexa List Management API for third parties on
1 July 2024. Since then, only a custom skill with its own name (A) or unofficial bridges (B)
are possible. Amazon also offers no official interface for automatic ordering, so Everyday never
orders anything on its own.

## A. The Everyday skill (private, about 15 minutes)

The skill stays **in development mode** on your Amazon account. It works on every Echo device
registered to that account without Amazon certification, and nobody else can find it.

1. Open the [Alexa developer console](https://developer.amazon.com/alexa/console/ask) and choose
   **Create skill**.
   - Name: *Mein Vorrat* or *Everyday List*. Primary locale: *German (DE)* or *English (US)*.
   - Type: **Other → Custom**. Hosting: **Alexa-hosted (Node.js)**, which is free and needs no AWS
     account. Template: *Start from scratch*.
2. **Build → Interaction model → JSON Editor.** Paste
   [`de-DE.json`](../integrations/alexa/skill-package/interactionModels/custom/de-DE.json) or
   [`en-US.json`](../integrations/alexa/skill-package/interactionModels/custom/en-US.json), then
   **Save** and **Build skill**. To use both languages, add the second one under *Language settings*.
3. **Code** tab:
   - Replace `index.js` with [`integrations/alexa/lambda/index.js`](../integrations/alexa/lambda/index.js).
   - Replace `package.json` with [`integrations/alexa/lambda/package.json`](../integrations/alexa/lambda/package.json).
   - Create `config.json` next to them:
     ```json
     { "twentyUrl": "https://crm.example.com", "twentyApiKey": "<a Twenty API key>", "alexaSkillId": "<your skill ID>" }
     ```
     Find the skill ID in the console's skill list under *Copy skill ID*. Use a **separate API key**
     for Alexa, so you can revoke it at any time in Twenty.
   - Click **Deploy**.
4. **Test** tab: switch testing to *Development* and type *"sage mein vorrat milch ist leer"*. If it
   answers, your Echo understands it too.

**What you can say** (German / English):

| | German | English |
| --- | --- | --- |
| Empty | "Alexa, sage mein Vorrat, Milch ist leer" | "Alexa, tell everyday list we're out of milk" |
| Bought | "… Kaffee gekauft" | "… I bought coffee" |
| Still there | "… wir haben noch Nudeln" | "… we still have pasta" |
| On the list | "… setz Butter auf die Liste" | "… add butter to the list" |
| Question | "Alexa, frag mein Vorrat, haben wir noch Eier" | "Alexa, ask everyday list do we have eggs" |
| Overview | "Alexa, frag mein Vorrat, was brauchen wir" | "Alexa, ask everyday list what do we need" |
| Anything | "Alexa, sage mein Vorrat, notiere zwei Kaffee für 9,98 gekauft" | "Alexa, tell everyday list note bought two coffee for 9.98" |
| Conversation | "Alexa, öffne mein Vorrat" and then several sentences | "Alexa, open everyday list" |

**Using your own AWS Lambda instead:** from `integrations/alexa` run `ask deploy` (ASK CLI v2,
`ask-resources.json` is included). Set `TWENTY_URL`, `TWENTY_API_KEY` and `ALEXA_SKILL_ID` as
Lambda environment variables instead of using `config.json`.

**Privacy:** The skill code runs on Amazon's servers and sends only the recognised sentence to
your Twenty server. Amazon processes your voice as with every skill. The API key sits in your
private skill code. Revoke it in Twenty if you delete the skill.

**If Twenty is only reachable at home**, Alexa cannot reach it. Use route B or Home Assistant
Assist ([HOME_ASSISTANT.md](HOME_ASSISTANT.md)) instead.

## B. Alexa's own shopping list → Everyday

1. Set up the [Everyday Home Assistant integration](HOME_ASSISTANT.md).
2. Install a community integration that exposes Alexa's shopping list as a to-do list, for
   example [Alexa Shopping List Sync](https://github.com/ocean90/alexa_shopping_sync). These
   integrations use unofficial Amazon interfaces, may need your Amazon login with two-factor
   authentication, and can break when Amazon changes things. Review them before you install.
3. Copy [`alexa_list_to_everyday.yaml`](../integrations/home-assistant/examples/alexa_list_to_everyday.yaml)
   to `config/packages/` and replace `todo.alexa_shopping_list` with your entity.

Every item you add with *"Alexa, put … on my shopping list"* then moves to Everyday: the product is
recognised and learned, and the item disappears from Alexa's list. This is tested with Home
Assistant's own to-do engine (`tests/test_alexa_list_example.py`).

---

## 🇩🇪 Auf Deutsch

**Zwei Wege, einer reicht:**

**A. Eigener Skill „Mein Vorrat“.** Du sagst „Alexa, sage mein Vorrat, Milch ist leer“ oder
„Alexa, frag mein Vorrat, was brauchen wir“. Der Skill bleibt privat im Entwicklermodus deines
Amazon-Kontos und läuft auf allen deinen Echos. Eine Zertifizierung ist nicht nötig. Die Einrichtung
dauert etwa 15 Minuten:

1. In der [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask) einen Skill erstellen:
   *Custom*, **Alexa-hosted (Node.js)**. Das ist kostenlos und braucht kein AWS-Konto.
2. Unter *Build → JSON Editor* die Datei
   [`de-DE.json`](../integrations/alexa/skill-package/interactionModels/custom/de-DE.json) einfügen,
   dann *Save* und *Build*.
3. Im Tab *Code* `index.js` und `package.json` aus `integrations/alexa/lambda/` einsetzen. Dazu eine
   `config.json` mit Twenty-Adresse, eigenem API-Schlüssel und Skill-ID anlegen, dann *Deploy*.
4. Im Tab *Test* „sage mein vorrat milch ist leer“ tippen.

Voraussetzung: Dein Twenty ist per HTTPS aus dem Internet erreichbar.

**B. Alexas eigene Einkaufsliste nach Everyday.** Du sagst wie gewohnt „Alexa, setz Milch auf die
Einkaufsliste“. Home Assistant holt den Eintrag über eine Community-Integration, zum Beispiel
[Alexa Shopping List Sync](https://github.com/ocean90/alexa_shopping_sync). Unsere Vorlage
[`alexa_list_to_everyday.yaml`](../integrations/home-assistant/examples/alexa_list_to_everyday.yaml)
verschiebt ihn dann nach Everyday. Diese Integrationen nutzen inoffizielle Amazon-Schnittstellen
und können ausfallen, wenn Amazon etwas ändert.

**Warum keine offizielle Synchronisation?** Amazon hat die Listen-Schnittstelle für Drittanbieter am
1. Juli 2024 abgeschaltet. Automatisches Bestellen bei Amazon gibt es offiziell nicht, und Everyday
bestellt nie etwas von selbst.
