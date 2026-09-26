import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocale } from 'twenty-sdk/front-component';

import type { Lang } from 'src/domain/messages';

// gettext-style UI translations: the English text is the key, so a missing
// German entry falls back to English instead of showing a key.
const DE: Record<string, string> = {
  // shell
  Now: 'Jetzt',
  List: 'Liste',
  Products: 'Produkte',
  Activity: 'Verlauf',
  Sections: 'Bereiche',
  '{count} open': '{count} offen',
  'Loading your household…': 'Haushalt wird geladen …',
  'Could not load your household: {error}': 'Haushalt konnte nicht geladen werden: {error}',
  'Try again': 'Erneut versuchen',
  'Could not save: {error}': 'Speichern fehlgeschlagen: {error}',
  Language: 'Sprache',
  // welcome / now
  'Welcome to Everyday Runtime': 'Willkommen bei Everyday Runtime',
  'Tell the app what you buy, what runs out and what you still have. It learns your rhythm and suggests what you probably need — with a reason for every guess. Start by adding something below, or load a small demo household to see how it works.':
    'Sag der App, was du kaufst, was ausgeht und was noch da ist. Sie lernt euren Rhythmus und schlägt vor, was ihr wahrscheinlich braucht — mit Begründung für jede Vermutung. Füge unten etwas hinzu oder lade einen kleinen Demo-Haushalt, um zu sehen, wie es funktioniert.',
  'Load demo household': 'Demo-Haushalt laden',
  'Loading…': 'Lädt …',
  'Demo household loaded': 'Demo-Haushalt geladen',
  'Add to shopping list': 'Zur Einkaufsliste hinzufügen',
  'Add something… e.g. 2 milk': 'Etwas hinzufügen … z. B. 2 Milch',
  Add: 'Hinzufügen',
  'Added to your list': 'Zur Liste hinzugefügt',
  SHOPPING: 'EINKAUF',
  'Nothing looks low. We will tell you when something probably runs out.':
    'Nichts wird knapp. Wir sagen Bescheid, wenn etwas wahrscheinlich ausgeht.',
  '{onList} on your list · {suggested} suggested': '{onList} auf der Liste · {suggested} vorgeschlagen',
  'Open shopping list': 'Einkaufsliste öffnen',
  'Good prices for you': 'Gute Preise für dich',
  'per {unit}': 'pro {unit}',
  'Price for {name}': 'Preis für {name}',
  'Your price alert: ': 'Dein Preis-Wecker: ',
  ' At {store}.': ' Bei {store}.',
  'Estimate from your price history': 'Schätzung aus deinem Preisverlauf',
  'Add to list': 'Auf die Liste',
  '{name} added to your list': '{name} auf die Liste gesetzt',
  'Quick questions': 'Kurze Fragen',
  'Question about {name}': 'Frage zu {name}',
  'Still enough {name}?': 'Noch genug {name}?',
  'Yes, enough': 'Ja, genug',
  'Running out': 'Wird knapp',
  'Not now': 'Nicht jetzt',
  'Thanks — noted you still have {name}': 'Danke — {name} ist noch da',
  'Probably needed': 'Wahrscheinlich nötig',
  'Still have it': 'Noch da',
  'Noted: you still have {name}': 'Notiert: {name} ist noch da',
  'Show all {count}': 'Alle {count} anzeigen',
  'Need something else?': 'Brauchst du noch etwas?',
  // cards
  'likely needed': 'wahrscheinlich nötig',
  'On your list': 'Auf der Liste',
  Estimate: 'Schätzung',
  'Estimated from past activity': 'Aus bisherigen Einträgen geschätzt',
  Confirmed: 'Bestätigt',
  'Based on something you reported': 'Beruht auf einer Meldung von euch',
  'Why?': 'Warum?',
  'Hide reason': 'Begründung ausblenden',
  '{need} likely needed · {confidence} ({confidencePercent})':
    '{need} wahrscheinlich nötig · {confidence} ({confidencePercent})',
  'This is an estimate from past activity, not a stock count. Tap “Still have it” or “Empty” to correct it.':
    'Das ist eine Schätzung aus bisherigen Einträgen, keine Bestandszählung. Tippe „Noch da“ oder „Leer“, um sie zu korrigieren.',
  'Estimated need {percent}%': 'Geschätzter Bedarf {percent} %',
  'Confirmed need {percent}%': 'Bestätigter Bedarf {percent} %',
  // buy panel
  'Buy {name}': '{name} kaufen',
  Quantity: 'Menge',
  'Decrease quantity': 'Menge verringern',
  'Increase quantity': 'Menge erhöhen',
  'Price (optional)': 'Preis (optional)',
  'e.g. 1.19': 'z. B. 1,19',
  'Store (optional)': 'Geschäft (optional)',
  'e.g. Corner shop': 'z. B. Supermarkt',
  'Saving…': 'Speichert …',
  'Bought {amount}': '{amount} gekauft',
  Cancel: 'Abbrechen',
  // list
  'Suggested{confidence}': 'Vorgeschlagen{confidence}',
  'Suggested by the app': 'Von der App vorgeschlagen',
  'Added by you': 'Von dir hinzugefügt',
  'Mark {name} as bought': '{name} als gekauft markieren',
  'Remove {name} from the list': '{name} von der Liste entfernen',
  '{name} removed': '{name} entfernt',
  '{name} bought': '{name} gekauft',
  'To buy ({count})': 'Zu kaufen ({count})',
  'Your list is empty': 'Deine Liste ist leer',
  'Nothing added yet — the suggestions below are what probably runs out next.':
    'Noch nichts eingetragen — die Vorschläge unten gehen wahrscheinlich als Nächstes aus.',
  'Add what you need above. The app will also suggest things that probably run out.':
    'Trag oben ein, was du brauchst. Die App schlägt außerdem vor, was wahrscheinlich ausgeht.',
  'Suggested for you': 'Vorschläge für dich',
  'Okay — not suggesting it for now': 'Okay — vorerst kein Vorschlag mehr',
  'Recently bought': 'Kürzlich gekauft',
  'Marked empty': 'Als leer gemeldet',
  // products
  'Find or add a product': 'Produkt suchen oder anlegen',
  'Find or add a product…': 'Produkt suchen oder anlegen …',
  'Product saved': 'Produkt gespeichert',
  'No product with that name': 'Kein Produkt mit diesem Namen',
  'Press “Add” to create “{name}”.': 'Tippe auf „Hinzufügen“, um „{name}“ anzulegen.',
  ' · on your list': ' · auf der Liste',
  'Last bought': 'Zuletzt gekauft',
  'Lasts about': 'Reicht etwa',
  'not yet known': 'noch unbekannt',
  'Use per day': 'Verbrauch pro Tag',
  Purchases: 'Einkäufe',
  Confidence: 'Sicherheit',
  'Learned from your corrections': 'Aus euren Korrekturen gelernt',
  'Adjusted using your earlier Empty / Still have it reports':
    'Angepasst anhand eurer früheren „Leer“/„Noch da“-Meldungen',
  'It’s empty': 'Ist leer',
  '{name} marked empty': '{name} als leer gemeldet',
  Bought: 'Gekauft',
  'Recent activity': 'Letzte Einträge',
  'Archive product': 'Produkt archivieren',
  '{name} archived': '{name} archiviert',
  // activity
  'No activity yet': 'Noch keine Einträge',
  'Everything you record — bought, empty, still there, needed — shows up here. This is exactly the evidence the suggestions are based on.':
    'Alles, was ihr erfasst — gekauft, leer, noch da, benötigt — erscheint hier. Genau darauf beruhen die Vorschläge.',
  'Everything the suggestions are based on, newest first.':
    'Alles, worauf die Vorschläge beruhen, das Neueste zuerst.',
  Today: 'Heute',
  Yesterday: 'Gestern',
  'Deleted product': 'Gelöschtes Produkt',
  'In the app': 'In der App',
  'Shopping list': 'Einkaufsliste',
  'Demo data': 'Demo-Daten',
  Import: 'Import',
  API: 'API',
  // prices
  Prices: 'Preise',
  Usual: 'Üblich',
  'Lowest (90 days)': 'Am günstigsten (90 Tage)',
  Where: 'Wo',
  'Prices known': 'Bekannte Preise',
  'No prices yet. Add a price when you buy it or see it — after two prices the app can tell you whether something is a good deal.':
    'Noch keine Preise. Trag einen Preis ein, wenn du kaufst oder ihn siehst — ab zwei Preisen sagt dir die App, ob etwas ein gutes Angebot ist.',
  bought: 'gekauft',
  seen: 'gesehen',
  receipt: 'Kassenbon',
  community: 'Community',
  'Log a price for {name}': 'Preis für {name} erfassen',
  'Price seen (€)': 'Gesehener Preis (€)',
  'e.g. 2.99': 'z. B. 2,99',
  'For how much{unit}': 'Für welche Menge{unit}',
  'Where (optional)': 'Wo (optional)',
  'e.g. Discounter': 'z. B. Discounter',
  'Great price': 'Top-Preis',
  'Good price': 'Guter Preis',
  'Usual price': 'Üblicher Preis',
  Expensive: 'Teuer',
  'Not enough data': 'Zu wenig Daten',
  'Save price': 'Preis speichern',
  'Price saved': 'Preis gespeichert',
  'Price alert and details for {name}': 'Preis-Wecker und Details für {name}',
  'Alert me below (€{per})': 'Wecker unter (€{per})',
  'e.g. 0.45': 'z. B. 0,45',
  'Keeps for (days)': 'Haltbar (Tage)',
  'e.g. 365': 'z. B. 365',
  'Barcode (EAN)': 'Barcode (EAN)',
  'e.g. 3057640257773': 'z. B. 3057640257773',
  Save: 'Speichern',
  'Settings saved': 'Einstellungen gespeichert',
  'Looking up…': 'Wird gesucht …',
  'Community prices': 'Community-Preise',
  'Could not load community prices{error}.': 'Community-Preise konnten nicht geladen werden{error}.',
  'no community prices yet for this barcode.': 'noch keine Community-Preise für diesen Barcode.',
  '{count} recent prices from other people.': '{count} aktuelle Preise von anderen Menschen.',
  ' for {amount}': ' für {amount}',
  ' · discounted': ' · reduziert',
  'Use these prices': 'Diese Preise übernehmen',
  'Community prices added': 'Community-Preise übernommen',
  'Community data from Open Prices (Open Food Facts, ODbL). Prices may be from other countries.':
    'Community-Daten von Open Prices (Open Food Facts, ODbL). Preise können aus anderen Ländern stammen.',
};

export type Translate = (text: string, values?: Record<string, string | number>) => string;

const interpolate = (text: string, values?: Record<string, string | number>) =>
  values ? text.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match)) : text;

export const translate = (lang: Lang, text: string, values?: Record<string, string | number>) =>
  interpolate(lang === 'de' ? (DE[text] ?? text) : text, values);

export const hasGermanTranslation = (text: string) => text in DE;

const STORAGE_KEY = 'everyday-runtime:language';

const readOverride = (): Lang | null => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);

    return value === 'de' || value === 'en' ? value : null;
  } catch {
    return null;
  }
};

type I18n = { lang: Lang; t: Translate; setLang: (lang: Lang) => void; locale: string };

const I18nContext = createContext<I18n>({
  lang: 'en',
  t: (text, values) => interpolate(text, values),
  setLang: () => {},
  locale: 'en',
});

// The Twenty user's language decides by default; the in-app switch overrides
// it on this device.
export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const twentyLocale = useLocale();
  const [override, setOverride] = useState<Lang | null>(readOverride);
  const lang: Lang = override ?? (twentyLocale?.startsWith('de') ? 'de' : 'en');

  const setLang = useCallback((next: Lang) => {
    setOverride(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage unavailable: the choice lasts for this session only
    }
  }, []);

  const value = useMemo<I18n>(
    () => ({
      lang,
      setLang,
      t: (text, values) => translate(lang, text, values),
      locale: lang === 'de' ? 'de-DE' : 'en-GB',
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
