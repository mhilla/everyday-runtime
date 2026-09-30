import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocale } from 'twenty-sdk/front-component';

import type { Lang } from 'src/domain/messages';

// gettext-style UI translations: the English text is the key, so a missing
// German entry falls back to English instead of showing a key.
const DE: Record<string, string> = {
    Category: 'Kategorie',
  '{name} category updated': '{name} Kategorie aktualisiert',
  // shell
  Now: 'Jetzt',
  List: 'Liste',
  Sections: 'Bereiche',
  '{count} open': '{count} offen',
  'Could not load your household: {error}': 'Haushalt konnte nicht geladen werden: {error}',
  'Try again': 'Erneut versuchen',
  'Could not save: {error}': 'Speichern fehlgeschlagen: {error}',
  Language: 'Sprache',
  // welcome / now
  'Loading…': 'Lädt …',
  'Add to shopping list': 'Zur Einkaufsliste hinzufügen',
  Add: 'Hinzufügen',
  '{percent}% cheaper': '{percent} % günstiger',
  'per {unit}': 'pro {unit}',
  'Price for {name}': 'Preis für {name}',
  ' At {store}.': ' Bei {store}.',
  'Add to list': 'Auf die Liste',
  '{name} added to your list': '{name} auf die Liste gesetzt',
  'Question about {name}': 'Frage zu {name}',
  'Still enough {name}?': 'Noch genug {name}?',
  // cards
  'On your list': 'Auf der Liste',
  'Why?': 'Warum?',
  '{need} likely needed · {confidence} ({confidencePercent})':
    '{need} wahrscheinlich nötig · {confidence} ({confidencePercent})',
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
  'Mark {name} as bought': '{name} als gekauft markieren',
  'Remove {name} from the list': '{name} von der Liste entfernen',
  '{name} removed': '{name} entfernt',
  'Marked empty': 'Als leer gemeldet',
  // products
  'Find or add a product': 'Produkt suchen oder anlegen',
  ' · on your list': ' · auf der Liste',
  'Last bought': 'Zuletzt gekauft',
  'Lasts about': 'Reicht etwa',
  'not yet known': 'noch unbekannt',
  'Use per day': 'Verbrauch pro Tag',
  Purchases: 'Einkäufe',
  Confidence: 'Sicherheit',
  'Adjusted using your earlier Empty / Still have it reports':
    'Angepasst anhand eurer früheren „Leer“/„Noch da“-Meldungen',
  'Recent activity': 'Letzte Einträge',
  // activity
  Today: 'Heute',
  Yesterday: 'Gestern',
  'Deleted product': 'Gelöschtes Produkt',
  'In the app': 'In der App',
  'Shopping list': 'Einkaufsliste',
  'Demo data': 'Demo-Daten',
  Import: 'Import',
  API: 'API',
  // talk
  'What happened?': 'Was ist passiert?',
  Send: 'Senden',
  Conversation: 'Gespräch',
  Suggestions: 'Vorschläge',
  'What do we need?': 'Was brauchen wir?',
  'Enough {name} left?': 'Noch genug {name}?',
  'Price of {name}?': 'Preis von {name}?',
  // prices
  Prices: 'Preise',
  Usual: 'Üblich',
  'Lowest (90 days)': 'Am günstigsten (90 Tage)',
  Where: 'Wo',
  'Prices known': 'Bekannte Preise',
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
  // copy v0.5 (punchier product voice)
  'Never run out of the basics again.': 'Nie wieder ohne das Wichtigste.',
  'Tell it what you buy and what\'s running low. It learns your household\'s rhythm and gives you a heads-up before things run out — always with the why. Add your first item below, or take the demo household for a spin.': 'Sag einfach, was ihr kauft und was knapp wird. Die App lernt euren Rhythmus und sagt Bescheid, bevor etwas ausgeht — immer mit Begründung. Trag unten dein erstes Produkt ein oder probier den Demo-Haushalt aus.',
  'Try the demo household': 'Demo-Haushalt ausprobieren',
  'Demo household is ready': 'Demo-Haushalt ist bereit',
  'Add anything — e.g. 2 milk': 'Etwas hinzufügen — z. B. 2 Milch',
  'YOUR SHOPPING': 'DEIN EINKAUF',
  'You\'re all set. We\'ll give you a heads-up before anything runs out.': 'Alles da. Wir sagen Bescheid, bevor etwas ausgeht.',
  '{onList} on your list · {suggested} smart picks': '{onList} auf der Liste · {suggested} Vorschläge',
  'View shopping list': 'Zur Einkaufsliste',
  'Deals worth grabbing': 'Lohnt sich gerade',
  'Price alert hit: ': 'Preis-Wecker: ',
  'Based on your price history': 'Aus deinem Preisverlauf',
  'Quick check': 'Kurz nachgefragt',
  'Yes, plenty': 'Ja, genug da',
  'Running low': 'Wird knapp',
  'Not now': 'Später',
  'Got it — {name} is still stocked': 'Alles klar — {name} ist noch da',
  'Still have some': 'Noch da',
  'See all {count}': 'Alle {count} ansehen',
  'Anything else?': 'Sonst noch was?',
  'likely needed': 'wahrscheinlich nötig',
  'Best guess': 'Schätzung',
  'Our best guess from your history': 'Unsere Schätzung aus eurem Verlauf',
  'You told us': 'Von euch gemeldet',
  'Based on something you told us': 'Beruht auf eurer Meldung',
  'Got it': 'Verstanden',
  'This is our best guess, not a stock count. Wrong? Tap “Still have some” or “All out” and it learns.': 'Das ist unsere Schätzung, keine Bestandszählung. Stimmt nicht? Tippe „Noch da“ oder „Ist alle“ — die App lernt daraus.',
  'Smart pick{confidence}': 'Vorschlag{confidence}',
  'Suggested from your history': 'Aus eurem Verlauf vorgeschlagen',
  'Added by you': 'Von dir hinzugefügt',
  'Nice — {name} is checked off': 'Erledigt — {name} ist abgehakt',
  'To buy · {count}': 'Zu kaufen · {count}',
  'Your list is empty': 'Deine Liste ist leer',
  'Nothing on it yet. Here\'s what\'s likely to run out next.': 'Noch nichts drauf. Das hier geht wahrscheinlich als Nächstes aus.',
  'Add what you need above — we\'ll suggest the rest before it runs out.': 'Trag oben ein, was du brauchst — den Rest schlagen wir vor, bevor er ausgeht.',
  'Smart picks for you': 'Vorschläge für dich',
  'Okay, we\'ll hold off on that one': 'Okay, vorerst kein Vorschlag mehr',
  'Just bought': 'Gerade gekauft',
  'Search or add a product…': 'Produkt suchen oder hinzufügen …',
  'Added to your pantry': 'Im Vorrat angelegt',
  'Not in your pantry yet': 'Noch nicht in deinem Vorrat',
  'Hit “Add” to start tracking “{name}”.': 'Tippe auf „Hinzufügen“, um „{name}“ anzulegen.',
  'Learns from your corrections': 'Lernt aus euren Korrekturen',
  'All out': 'Ist alle',
  '{name} is out — added to your list': '{name} ist alle — steht auf der Liste',
  'Bought it': 'Gekauft',
  'Stop tracking': 'Nicht mehr verfolgen',
  '{name} is no longer tracked': '{name} wird nicht mehr verfolgt',
  'Nothing here yet': 'Noch nichts passiert',
  'Everything you log — bought, all out, still there — shows up here. It\'s exactly what the suggestions are built on.': 'Alles, was ihr meldet — gekauft, alle, noch da — landet hier. Genau darauf bauen die Vorschläge auf.',
  'Everything the suggestions are built on — newest first.': 'Alles, worauf die Vorschläge aufbauen — das Neueste zuerst.',
  'No prices yet. Log one when you buy or spot it — after two, we\'ll tell you whether it\'s a deal.': 'Noch keine Preise. Trag einen ein, wenn du kaufst oder ihn siehst — ab zwei sagen wir dir, ob es ein Schnäppchen ist.',
  'Steal': 'Schnäppchen',
  'Good deal': 'Guter Preis',
  'Regular price': 'Normalpreis',
  'Pricey': 'Teuer',
  'Just tell it': 'Sag\'s einfach',
  '“We\'re out of milk”, “What do we need?” — or tap the mic on your keyboard.': '„Milch ist alle“, „Was brauchen wir?“ — oder tipp aufs Mikro deiner Tastatur.',
  'We\'re out of milk…': 'Milch ist alle …',
  'Getting your household ready…': 'Dein Haushalt wird geladen …',
  'Pantry': 'Vorrat',
  'History': 'Verlauf',
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
