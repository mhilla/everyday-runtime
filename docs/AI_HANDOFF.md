# AI Handoff (Everyday Runtime)

Kanonisches, modellunabhängiges Übergabedokument. Wird nach jedem abgeschlossenen Arbeitspaket aktualisiert und auf GitHub gesichert.

---

## 1. Aktuelles Ziel
Autonome Übernahme des Repositories, Etablierung des dauerhaften Git-/Betriebs- und Handoff-Workflows und Umsetzung der nächsten dokumentierten technischen Aufgaben aus Issues und Roadmap.

## 2. Erledigt
- [x] Vollständige Bestandsaufnahme und Lektüre der Pflichtdokumente (`AGENTS.md`, `CLAUDE.md`, `README.md`, `ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/PRODUCT_PRINCIPLES.md`, `docs/PRIVACY.md`, `docs/AI.md`, `docs/INTEGRATIONS.md`, `docs/NEXT_HUMAN_STEPS.md`).
- [x] Git-Zustand verifiziert: Checkout `/home/mic8070/antigravity-workspaces/everyday-runtime`, Branch `antigravity/everyday-runtime`, Upstream `origin/antigravity/everyday-runtime`, Local Mode aktiv.
- [x] Lokale Entwicklungsumgebung initialisiert (`corepack`, `yarn install` via Corepack).
- [x] Lokale Validierungssuite erfolgreich ausgeführt:
  - `yarn lint`: 0 Fehler, 0 Warnungen (oxlint über 84 Dateien)
  - `yarn typecheck`: bestanden (tsgo)
  - `yarn test`: 19 Testdateien, 202 Unit-Tests erfolgreich bestanden
- [x] `AGENTS.md` dauerhaft um Git-, CI- und Betriebsregeln ergänzt, ohne bestehende Regeln abzuschwächen.
- [x] `docs/AI_HANDOFF.md` initialisiert und auf GitHub gesichert.
- [x] Issue #8 umgesetzt ("Quick add: say 'already on your list' instead of 'Added to your list'"):
  - `RunAction` in `src/ui/use-household.ts` unterstützt funktionale `successMessage(result)`.
  - `quickAddFeedback` in `src/ui/quick-add-feedback.ts` erstellt einheitliche Feedbacks für neue und bereits vorhandene Produkte.
  - Deutsche Übersetzung `'{name} is already on your list': '{name} steht schon auf der Liste'` in `src/ui/i18n.tsx` ergänzt.
  - In `src/ui/screens/now-screen.tsx` (Empty State + Bottom) und `src/ui/screens/list-screen.tsx` integriert.
  - Neuer Unit-Test in `src/ui/__tests__/quick-add-feedback.test.ts` hinzugefügt; `i18n.test.ts` erfolgreich.
- [x] Issue #9 umgesetzt ("Buy panel: show an error for an invalid price instead of silently ignoring it"):
  - `parsePriceInput` und `parseDecimal` in `src/domain/prices.ts` implementiert (Validierung leer / Zahl mit `.` oder `,` vs. ungültige Eingaben).
  - Umfassende Unit-Tests für `parsePriceInput` und `parseDecimal` in `src/domain/__tests__/prices.test.ts`.
  - Inline-Fehlermeldung `"Enter a price like 1.19 or leave it empty"` in `BuyPanel` (`src/ui/components.tsx`) mit Verknüpfung über `aria-describedby` und `aria-invalid`.
  - Formular bricht bei ungültigem Preis den Submit ab und bleibt geöffnet; Fehler wird bei Eingabeänderung zurückgesetzt.
  - Deutsche Übersetzung in `src/ui/i18n.tsx` (`'Gib einen Preis wie 1,19 ein oder lass das Feld leer'`) und Styles in `src/ui/styles.ts` (`.er-input-error`, `.er-input[aria-invalid="true"]`).

## 3. Offen
- [ ] Weitere dokumentierte Roadmap- und Issue-Aufgaben:
  - Issue #49: CSV Import und Export (v0.5)
  - Issue #5: Activity history: undo, edit, delete (v0.5)
  - Issue #46: Multiple lists (per store, per occasion) (v0.5)
  - Issue #43: Shopping mode sorted by store and aisle (v0.5)
  (Hinweis: #10 und #12 bleiben für externe Mitwirkende reserviert).

## 4. Blocker
Keine technischen oder organisatorischen Blocker vorhanden.

## 5. Owner-Entscheidungen
- GitHub Actions bleiben vorerst deaktiviert (keine Workflows starten/reparieren/anlegen, keine PRs erzeugen, die Actions triggern, kein Push nach `main`).
- Alle Synchronisationen und Sicherungen laufen autonom über `antigravity/everyday-runtime`.
- Keine externe Kommunikation durchführen (`docs/NEXT_HUMAN_STEPS.md` bleibt ausschließlich für menschliche Betreiber).

## 6. Tatsächlich geprüfter Stand
- Branch: `antigravity/everyday-runtime`
- Tests: `yarn lint`, `yarn typecheck`, `yarn test` erfolgreich auf Raspberry Pi ausgeführt (20/20 Testdateien, 208/208 Tests bestanden).

## 7. Exakt nächster Schritt
1. Issue #9 committen und zu `origin/antigravity/everyday-runtime` pushen, GitHub-Sync verifizieren.
2. Nächstes Arbeitspaket vorbereiten (Issue #49: CSV Import und Export analysieren und Umsetzung planen).
