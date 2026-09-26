# Vision: Everyday Runtime

> *English version: [VISION.md](VISION.md)*

**Everyday Runtime wird die Haushalts-Intelligenz, die alles nutzt, was es schon gibt —
Sprachassistenten, Hausgeräte, Fotos, Kassenbons, offene Preisdaten und die Erfahrung
vieler Haushalte — und daraus ehrliche, erklärte Entscheidungen macht:
*Was brauchen wir? Wann? Wo ist es gerade günstig? Wie viel lohnt sich auf Vorrat?***

Der Kern bleibt, was Everyday Runtime heute ausmacht: keine vorgetäuschte Genauigkeit,
jede Vermutung mit Begründung, Daten bleiben beim Haushalt. Neu ist die Breite.

## Für wen

| Situation | Was Everyday Runtime leistet |
| --- | --- |
| **Familie** | Alle tragen bei, niemand muss Buch führen. Wer zuletzt gekauft hat, wer „leer“ gemeldet hat — sichtbar, ohne Streit. |
| **WG** | Gemeinsame Vorräte (Klopapier, Spülmittel) getrennt von Privatem; wer ist dran mit Kaufen; faire Kostenübersicht. |
| **Eltern, die sich nicht mehr selbst kümmern können** | Angehörige sehen aus der Ferne, was bei den Eltern wahrscheinlich fehlt, und bekommen einen Hinweis, bevor es knapp wird. Die Eltern selbst brauchen keine App: ein Satz zu Alexa, ein Knopf, ein Foto — oder gar nichts, wenn der Einkaufsrhythmus reicht. |
| **Sparfüchse** | „Volvic ist diese Woche bei X ungewöhnlich günstig — du brauchst in ~10 Tagen welches, 3 Kisten reichen bis Ende November.“ |

## Die fünf Säulen

### 1. Erfassen ohne Aufwand — „jede Quelle ist eine Beobachtung“
Alles, was irgendwo passiert, wird zu einer **Beobachtung** mit Quelle und Vertrauenswert:
- **Sprache:** eigener Alexa-Skill („Alexa, sag Everyday, Milch ist leer“), Home-Assistant-Assist,
  Telegram/Signal-Nachricht in natürlicher Sprache.
- **Foto:** Barcode auf der Verpackung → Produkt über Open Food Facts. Ohne Barcode, Kassenbon,
  Prospekt oder Kühlschrankinhalt → optional ein Bildmodell (lokal oder Cloud, Opt-in).
- **Geräte:** Kühlschrank-Kameras (wo verfügbar), Tür- und Temperaturereignisse, smarte Waagen,
  NFC-Tags am Vorratsregal („leer“-Tag antippen).
- **Einkauf:** Kassenbon-Import, Online-Bestellbestätigungen per E-Mail-Weiterleitung.

### 2. Verstehen — deterministischer Kern, KI als Zuarbeiter
- Die **Entscheidung** bleibt beim erklärbaren, getesteten Regelwerk: Rhythmus, Mengen,
  Korrekturen, Konflikte, Alter der Daten.
- **KI** übernimmt, was Regeln nicht können: Fotos lesen, Sätze verstehen, Produkte
  zuordnen, Rückfragen formulieren. Sie **schlägt Beobachtungen vor**, entscheidet aber
  nicht still. Lokale Modelle (z. B. über Ollama) sind ein gleichwertiger Weg.
- **Aktive Rückfragen:** Statt zu raten, fragt die App gezielt dort, wo eine Antwort am
  meisten Klarheit bringt: „Ist noch genug Kaffee da?“ — ein Tipp, fertig.

### 3. Preis-Radar und Vorratsplanung
- **Preisbeobachtungen** aus eigenen Einkäufen, Kassenbons und der offenen Datenbank
  **Open Prices** (Open Food Facts) — und Beiträge zurück dorthin: echte Schwarmintelligenz.
- **Aktionserkennung:** „günstigster Preis seit 90 Tagen“, „Aktionspreis bei Händler X“.
- **Vorratsplanung:** Verbrauch pro Tag × Haltbarkeit × Lagerplatz × Rabatt → „jetzt 3 Kisten
  kaufen spart ~4 € und reicht bis …“.
- **Preis-Wecker:** „Sag mir, wenn Volvic unter 0,35 €/l fällt.“
- Amazon-Preisverläufe über **Keepa** (kostenpflichtig, eigener Schlüssel) als optionale Quelle.

### 4. Gemeinsam haushalten
- **Haushalte mit mehreren Personen**, Rollen (Mitglied, Gast, Betreuer:in).
- **Fürsorge-Modus:** Angehörige begleiten einen zweiten Haushalt (z. B. die Eltern),
  bekommen Hinweise und können Einkäufe übernehmen. Ausdrücklich mit Einwilligung und
  transparent für die betreute Person.
- **WG-Modus:** gemeinsame vs. private Produkte, Einkaufs-Reihenfolge, Kostenteilung.

### 5. Handeln — überall, wo der Haushalt ohnehin ist
- **Home Assistant** (Sensoren „Milch 89 % wahrscheinlich nötig“, To-do-Liste, Automationen
  wie „beim Verlassen der Arbeit erinnern“).
- **Alexa**-Skill, **Telegram/Signal**-Bot, **Webhooks**, Export in Bring!/Todoist.
- **Bestellen mit einem Tipp:** vorbereiteter Warenkorb-Link (Amazon, Online-Supermarkt) —
  bewusst **mit Bestätigung**, nicht vollautomatisch.

## Was geht — und was nicht (Stand der Recherche: September 2026)

| Idee | Stand | Weg |
| --- | --- | --- |
| Alexa-Einkaufsliste direkt lesen/schreiben | ❌ Amazon hat die List-API zum 1. Juli 2024 abgeschaltet | eigener Skill mit eigenem Aufrufnamen; oder über Home-Assistant-Integrationen der Community (inoffizielle APIs) |
| Bosch/Siemens (Home Connect) | ✅ offizielle API | Temperatur/Tür/Status; **Kühlschrank-Kamera** für ältere Geräte ab 31.03.2026 abgeschaltet, sonst `/images` |
| Miele | ✅ offizielle „3rd Party API“ | Temperatur, Alarme, Modi — **kein Inhalt** |
| Samsung Family Hub | ⚠️ Kamera/„AI Food Manager“ nur über undokumentierte SmartThings-Endpunkte | Community-Integrationen; nur als optionaler, experimenteller Adapter |
| Barcode → Produkt | ✅ Open Food Facts, frei, 15 Abrufe/Min. pro IP | Kern-Adapter |
| Offene Preisdaten | ✅ Open Prices (Open Food Facts), offene API, Community-Daten, Schwerpunkt Europa | Kern-Adapter, lesen **und beitragen** |
| Amazon-Preisverlauf | 💶 Keepa-API ab 49 €/Monat | optional mit eigenem Schlüssel |
| idealo-Preise | ❌ keine öffentliche Lese-API; Scraping verstößt gegen Nutzungsbedingungen | nicht umsetzen |
| Prospekt-Angebote (marktguru, kaufDA) | ❌ keine offene API | Nutzer:innen fotografieren/teilen Prospekte → Bildmodell extrahiert Angebote (nur für den eigenen Haushalt) |
| Amazon automatisch nachbestellen | ❌ PA-API wird 2026 abgeschaltet; Dash Replenishment nur für zertifizierte Geräte | Warenkorb-Link mit einem Tipp, Bestätigung durch Menschen |
| Kassenbon lesen | ✅ mit Bildmodell (lokal oder Cloud) | Opt-in-Adapter |

Grundsätze für alle Integrationen: **offizielle Schnittstellen zuerst**, keine
Umgehung von Bot-Schutz, keine Weitergabe von Haushaltsdaten ohne ausdrückliches Opt-in,
jede Quelle im „Warum?“ sichtbar.

## Architektur in einem Satz

Alle Quellen sind **Adapter**, die Beobachtungen, Preise oder Produktinfos liefern; der
**deterministische Kern** bewertet; **Aktionen** (Hinweise, Listen, Bestellung) sind wieder
Adapter. Details: [ARCHITECTURE.md](ARCHITECTURE.md).

## Reihenfolge

Siehe [ROADMAP.md](../ROADMAP.md). Kurz: erst Deutsch + aktive Rückfragen + Preis-Radar,
dann Haushalte/Fürsorge, dann Erfassung per Foto/Sprache, dann Geräte und Automationen.

## Quellen

- Alexa List API abgeschaltet: [Alexa deprecated features](https://developer.amazon.com/en-US/docs/alexa/ask-overviews/deprecated-features.html)
- Home Connect: [API-Dokumentation](https://api-docs.home-connect.com/), [FAQ zur Kamera](https://developer.home-connect.com/support/faq)
- Miele: [3rd Party API](https://developer.miele.com/)
- Samsung Family Hub: [SmartThings-Community](https://community.smartthings.com/t/samsung-family-hub-camera-door-view/295877), [Home-Assistant-Integration](https://github.com/ibielopolskyi/smartthings_fridge_camera)
- Open Food Facts: [API](https://openfoodfacts.github.io/openfoodfacts-server/api/), [Open Prices](https://prices.openfoodfacts.org/about), [Open-Prices-API](https://prices.openfoodfacts.org/api/docs)
- Keepa: [API](https://keepa.com/api-docs/)
- Amazon: [Creators API statt PA-API](https://webservices.amazon.com/paapi5/documentation/), [Dash Replenishment](https://developer.amazon.com/dash-replenishment-service)
- Alexa ↔ Home Assistant: [alexa_shopping_sync](https://github.com/ocean90/alexa_shopping_sync)
