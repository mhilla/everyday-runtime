// Talk to the shopping list — the free tier. A small, deterministic parser
// for the sentences people actually say, in German and English. No AI, no
// network: it runs in the browser and on the server in microseconds. Things
// it cannot understand are returned as UNKNOWN, so an optional AI layer (the
// Twenty AI chat with this app's tools) can take over.

export type CommandIntent =
  | 'EMPTY'
  | 'IN_STOCK'
  | 'ADD'
  | 'BOUGHT'
  | 'ASK_NEEDS'
  | 'ASK_PRODUCT'
  | 'ASK_PRICE'
  | 'UNKNOWN';

export type CommandItem = {
  name: string;
  quantity: number | null;
};

export type Command = {
  intent: CommandIntent;
  items: CommandItem[];
  price: number | null;
  store: string | null;
  lang: 'en' | 'de';
  text: string;
};

const NUMBER_WORDS: Record<string, number> = {
  ein: 1, eine: 1, einen: 1, einem: 1, eins: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6,
  sieben: 7, acht: 8, neun: 9, zehn: 10, zwölf: 12,
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, twelve: 12, dozen: 12,
};

// Words that are never part of a product name.
const FILLER = new Set([
  'bitte', 'mal', 'noch', 'schon', 'auch', 'wieder', 'jetzt', 'gerade', 'ganz', 'leider', 'doch',
  'die', 'der', 'das', 'den', 'dem', 'des', 'unser', 'unsere', 'unseren', 'meine', 'mein',
  'please', 'the', 'our', 'my', 'some', 'more', 'just', 'now', 'again', 'also', 'any', 'of',
]);

const UNITS = new Set([
  'x', '×', 'stück', 'stk', 'packung', 'packungen', 'pck', 'pack', 'packs', 'flasche', 'flaschen',
  'kiste', 'kisten', 'dose', 'dosen', 'bottle', 'bottles', 'crate', 'crates', 'can', 'cans',
  'liter', 'l', 'kg', 'g', 'gramm', 'kilo', 'rolle', 'rollen', 'roll', 'rolls', 'glas', 'gläser',
]);

const normalize = (text: string) =>
  text
    .trim()
    .replace(/[!?.]+$/g, '')
    .replace(/\s+/g, ' ');

const parseNumber = (token: string): number | null => {
  const lower = token.toLowerCase();

  if (lower in NUMBER_WORDS) {
    return NUMBER_WORDS[lower];
  }

  const number = Number(lower.replace(',', '.'));

  return /^\d+([.,]\d+)?$/.test(lower) && Number.isFinite(number) ? number : null;
};

const capitalizeFirst = (text: string) => text.charAt(0).toLocaleUpperCase() + text.slice(1);

// "2 Packungen Kaffee" → { name: "Kaffee", quantity: 2 }
const parseItem = (raw: string): CommandItem | null => {
  const tokens = raw
    .split(' ')
    .map((token) => token.replace(/^[,;:]+|[,;:]+$/g, ''))
    .filter((token) => token !== '');
  let quantity: number | null = null;
  const nameTokens: string[] = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();
    const number = parseNumber(token);
    const glued = lower.match(/^(\d+(?:[.,]\d+)?)x$/);

    if (quantity === null && (number !== null || glued)) {
      quantity = glued ? Number(glued[1].replace(',', '.')) : number;
      continue;
    }
    if (UNITS.has(lower) || FILLER.has(lower)) {
      continue;
    }
    nameTokens.push(token);
  }

  const name = nameTokens.join(' ').trim();

  return name === '' ? null : { name: capitalizeFirst(name), quantity };
};

// "Milch, Eier und Butter" → three items
export const splitItems = (raw: string): CommandItem[] =>
  raw
    .split(/\s*(?:,|;|\bund\b|\band\b|&|\+)\s*/i)
    .map(parseItem)
    .filter((item): item is CommandItem => item !== null);

const PRICE = /(?:für|fuer|for|zu|at|à)\s*(\d+(?:[.,]\d{1,2})?)\s*(?:€|eur|euro|euros)?/i;
const PRICE_ONLY = /(\d+(?:[.,]\d{1,2})?)\s*(?:€|eur|euro|euros)\b/i;
const STORE = /\b(?:bei|beim|im|in|at)\s+([A-Za-zÄÖÜäöüß][\wÄÖÜäöüß&'.\- ]{1,40})$/i;

type Pattern = {
  intent: CommandIntent;
  lang: 'en' | 'de';
  // Returns the part of the sentence that names the products.
  match: (text: string) => string | null;
};

const re = (regex: RegExp, group = 1) => (text: string) => {
  const found = text.match(regex);

  return found ? (found[group] ?? '') : null;
};

// Order matters: questions before statements, specific before general.
const PATTERNS: Pattern[] = [
  { intent: 'ASK_NEEDS', lang: 'de', match: re(/^(?:was|welche sachen)\s+(?:brauchen|fehlt|fehlen|müssen)\s*(?:wir|ich)?(?:\s+(?:noch|kaufen|einkaufen|besorgen))*\s*$/i, 0) },
  { intent: 'ASK_NEEDS', lang: 'de', match: re(/^(?:einkaufsliste|liste|was steht auf der liste)$/i, 0) },
  { intent: 'ASK_NEEDS', lang: 'en', match: re(/^(?:what(?:'s| is| do)?\s+(?:we\s+)?(?:need|missing|on the list|to buy)(?:\s+to buy)?|shopping list)$/i, 0) },
  { intent: 'ASK_PRICE', lang: 'de', match: re(/^(?:ist|sind|wo ist|wo sind|wo gibt es)\s+(.+?)\s+(?:gerade\s+|grad\s+|jetzt\s+)?(?:günstig|billig|im angebot|reduziert|am günstigsten)$/i) },
  { intent: 'ASK_PRICE', lang: 'de', match: re(/^(?:was kostet|was kosten|preis (?:für|von))\s+(.+)$/i) },
  { intent: 'ASK_PRICE', lang: 'en', match: re(/^(?:is|are|where is|where are)\s+(.+?)\s+(?:cheap|on sale|a good deal|cheapest)(?:\s+(?:now|right now))?$/i) },
  { intent: 'ASK_PRICE', lang: 'en', match: re(/^(?:how much (?:is|are|does|do)|price of)\s+(.+?)(?:\s+cost)?$/i) },
  { intent: 'ASK_PRODUCT', lang: 'de', match: re(/^(?:haben wir|ist|sind)\s+(?:noch\s+)?(?:genug\s+)?(.+?)\s+(?:da|im haus|vorrätig|übrig)$/i) },
  { intent: 'ASK_PRODUCT', lang: 'de', match: re(/^(?:haben wir noch|haben wir genug|brauchen wir|müssen wir)\s+(.+?)(?:\s+kaufen)?$/i) },
  { intent: 'ASK_PRODUCT', lang: 'de', match: re(/^noch genug\s+(.+)$/i) },
  { intent: 'ASK_PRODUCT', lang: 'en', match: re(/^enough\s+(.+?)\s+left$/i) },
  { intent: 'ASK_PRODUCT', lang: 'en', match: re(/^(?:do we (?:still )?have(?: enough)?|do we need|is there (?:still )?(?:enough )?|are there (?:still )?(?:enough )?)\s*(.+?)(?:\s+left)?$/i) },
  { intent: 'EMPTY', lang: 'de', match: re(/^(?:kein|keine|keinen)\s+(.+?)\s+mehr(?:\s+da)?$/i) },
  { intent: 'EMPTY', lang: 'de', match: re(/^(.+?)\s+(?:ist|sind)\s+(?:leer|alle|aus|aufgebraucht|verbraucht)$/i) },
  { intent: 'EMPTY', lang: 'de', match: re(/^(.+?)\s+(?:leer|alle|aus)$/i) },
  { intent: 'EMPTY', lang: 'en', match: re(/^(?:we(?:'re| are)\s+)?(?:out of|no more)\s+(.+?)(?:\s+left)?$/i) },
  { intent: 'EMPTY', lang: 'en', match: re(/^(.+?)\s+(?:is|are)\s+(?:empty|gone|finished|used up|out)$/i) },
  { intent: 'EMPTY', lang: 'en', match: re(/^(.+?)\s+(?:empty|gone)$/i) },
  { intent: 'IN_STOCK', lang: 'de', match: re(/^(.+?)\s+(?:ist|sind)\s+(?:noch\s+)?(?:da|vorhanden|genug da|ausreichend da)$/i) },
  { intent: 'IN_STOCK', lang: 'de', match: re(/^(?:wir haben|haben)\s+(?:noch\s+)?(?:genug\s+)?(.+?)(?:\s+da)?$/i) },
  { intent: 'IN_STOCK', lang: 'de', match: re(/^noch\s+(.+?)\s+da$/i) },
  { intent: 'IN_STOCK', lang: 'en', match: re(/^(?:we (?:still )?have(?: enough)?|still have(?: enough)?|there(?:'s| is) (?:still )?(?:enough )?)\s*(.+?)(?:\s+left)?$/i) },
  { intent: 'IN_STOCK', lang: 'en', match: re(/^(.+?)\s+(?:is|are)\s+(?:still\s+)?(?:there|in stock|fine|enough)$/i) },
  { intent: 'BOUGHT', lang: 'de', match: re(/^(?:habe|hab|haben|ich habe|wir haben)?\s*(.+?)\s+(?:gekauft|besorgt|eingekauft|geholt)$/i) },
  { intent: 'BOUGHT', lang: 'de', match: re(/^(?:gekauft|besorgt)\s*:?\s+(.+)$/i) },
  { intent: 'BOUGHT', lang: 'en', match: re(/^(?:i |we )?(?:bought|got|picked up|purchased)\s+(.+)$/i) },
  { intent: 'ADD', lang: 'de', match: re(/^(?:setz|setze|schreib|schreibe|pack|packe|tu|füg|füge)\s+(.+?)\s+(?:auf die (?:einkaufs)?liste|auf die liste|dazu|hinzu|drauf)$/i) },
  { intent: 'ADD', lang: 'de', match: re(/^(.+?)\s+(?:auf die (?:einkaufs)?liste|auf die liste|kaufen|besorgen|mitbringen)$/i) },
  { intent: 'ADD', lang: 'de', match: re(/^(?:wir brauchen|ich brauche|brauchen|brauche|bitte kaufen|kaufen|besorgen)\s+(.+)$/i) },
  { intent: 'ADD', lang: 'en', match: re(/^(?:add|put)\s+(.+?)(?:\s+(?:to|on) (?:the )?(?:shopping )?list)?$/i) },
  { intent: 'ADD', lang: 'en', match: re(/^(?:we need|i need|need|buy|get)\s+(.+)$/i) },
];

const PURCHASE_WORDS = /\b(gekauft|besorgt|eingekauft|geholt|bought|got|purchased|picked up)\b/i;

const GERMAN_HINTS =
  /\b(ist|sind|und|noch|leer|kein|keine|brauchen|gekauft|bitte|auf die liste|haben wir|günstig|wie|wird|was|wo|der|die|das|ich|wir|nicht|mehr|gibt|heute|morgen)\b|[äöüß]/i;

export const parseCommand = (input: string): Command => {
  const text = normalize(input);
  const guessLang: 'en' | 'de' = GERMAN_HINTS.test(text) ? 'de' : 'en';

  if (text === '') {
    return { intent: 'UNKNOWN', items: [], price: null, store: null, lang: guessLang, text };
  }

  // "… gekauft bei Lidl": take a trailing store off purchase sentences first.
  let sentence = text;
  let trailingStore: string | null = null;
  const trailing = PURCHASE_WORDS.test(text) ? text.match(STORE) : null;

  if (trailing && !PURCHASE_WORDS.test(trailing[1])) {
    trailingStore = trailing[1].trim();
    sentence = text.slice(0, trailing.index).trim();
  }

  for (const pattern of PATTERNS) {
    const found = pattern.match(pattern.intent === 'BOUGHT' ? sentence : text);

    if (found === null) {
      continue;
    }

    let rest = found;
    let price: number | null = null;
    let store: string | null = pattern.intent === 'BOUGHT' ? trailingStore : null;

    if (pattern.intent === 'BOUGHT') {
      const storeMatch = store === null ? rest.match(STORE) : null;

      if (storeMatch) {
        store = storeMatch[1].trim();
        rest = rest.slice(0, storeMatch.index).trim();
      }

      const priceMatch = rest.match(PRICE) ?? rest.match(PRICE_ONLY);

      if (priceMatch) {
        price = Number(priceMatch[1].replace(',', '.'));
        rest = (rest.slice(0, priceMatch.index) + rest.slice((priceMatch.index ?? 0) + priceMatch[0].length)).trim();
      }
    }

    const items = pattern.intent === 'ASK_NEEDS' ? [] : splitItems(rest);

    if (pattern.intent !== 'ASK_NEEDS' && items.length === 0) {
      continue;
    }

    return { intent: pattern.intent, items, price, store, lang: pattern.lang, text };
  }

  return { intent: 'UNKNOWN', items: [], price: null, store: null, lang: guessLang, text };
};
