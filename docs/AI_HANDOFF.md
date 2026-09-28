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
- [x] `docs/AI_HANDOFF.md` initialisiert.

## 3. Offen
- [ ] Arbeitspaket 1: Issue #8 umsetzen ("Quick add: say 'already on your list' instead of 'Added to your list'").
- [ ] Arbeitspaket 2: Issue #9 umsetzen ("Buy panel: show an error for an invalid price instead of silently ignoring it").
- [ ] Weitere dokumentierte Roadmap- und Issue-Aufgaben (z. B. #49 CSV Import/Export, #5 Activity History Undo/Edit/Delete, etc., unter Ausschluss von #10 und #12, die für externe Mitwirkende reserviert sind).

## 4. Blocker
Keine technischen oder organisatorischen Blocker vorhanden.

## 5. Owner-Entscheidungen
- GitHub Actions bleiben vorerst deaktiviert (keine Workflows starten/reparieren/anlegen, keine PRs erzeugen, die Actions triggern, kein Push nach `main`).
- Alle Synchronisationen und Sicherungen laufen autonom über `antigravity/everyday-runtime`.
- Keine externe Kommunikation durchführen (`docs/NEXT_HUMAN_STEPS.md` bleibt ausschließlich für menschliche Betreiber).

## 6. Tatsächlich geprüfter Stand
- Commit-Basis: `73987bc` (tracking `origin/antigravity/everyday-runtime`)
- Tests: `yarn lint`, `yarn typecheck`, `yarn test` erfolgreich auf Raspberry Pi ausgeführt (202/202 Tests grün).

## 7. Exakt nächster Schritt
1. Git-Status und Diff prüfen, Initialisierung von `AGENTS.md` und `docs/AI_HANDOFF.md` committen und zu `origin/antigravity/everyday-runtime` pushen. Sync verifizieren.
2. Umsetzung von Issue #8 starten: UI-Meldung bei bereits auf der Liste befindlichen Produkten anpassen (`src/ui/use-household.ts`, `src/ui/screens/now-screen.tsx`, `src/ui/screens/list-screen.tsx`).
