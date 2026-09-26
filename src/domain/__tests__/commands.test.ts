import { describe, expect, it } from 'vitest';

import { parseCommand } from 'src/domain/commands';

// Each row: what a person says → intent and items. Contributions of new
// phrasings (any language) are welcome as additional rows.
const cases: [string, string, [string, number | null][], Partial<{ price: number; store: string; lang: string }>?][] = [
  // German — empty
  ['Milch ist leer', 'EMPTY', [['Milch', null]]],
  // pack sizes are not part of the name (phrasings from the Alexa skill)
  ['Bought a case of water', 'BOUGHT', [['Water', 1]]],
  ['Add two bags of rice to the list', 'ADD', [['Rice', 2]]],
  ['Eine Tüte Äpfel gekauft', 'BOUGHT', [['Äpfel', 1]]],
  ['Die Milch ist alle', 'EMPTY', [['Milch', null]]],
  ['Kein Kaffee mehr', 'EMPTY', [['Kaffee', null]]],
  ['keine Eier mehr da', 'EMPTY', [['Eier', null]]],
  ['Milch und Butter sind leer', 'EMPTY', [['Milch', null], ['Butter', null]]],
  ['Klopapier leer!', 'EMPTY', [['Klopapier', null]]],
  // German — still there
  ['Nudeln sind noch da', 'IN_STOCK', [['Nudeln', null]]],
  ['Wir haben noch genug Reis', 'IN_STOCK', [['Reis', null]]],
  ['noch Kaffee da', 'IN_STOCK', [['Kaffee', null]]],
  // German — add
  ['2 Milch auf die Liste', 'ADD', [['Milch', 2]]],
  ['Wir brauchen Eier', 'ADD', [['Eier', null]]],
  ['Setz bitte zwei Packungen Kaffee auf die Liste', 'ADD', [['Kaffee', 2]]],
  ['Brauchen Milch, Brot und 6 Eier', 'ADD', [['Milch', null], ['Brot', null], ['Eier', 6]]],
  ['Volvic kaufen', 'ADD', [['Volvic', null]]],
  // German — bought
  ['Milch gekauft', 'BOUGHT', [['Milch', null]]],
  ['Hab 2 Milch für 1,19 gekauft', 'BOUGHT', [['Milch', 2]], { price: 1.19 }],
  ['3 Kisten Volvic für 12,99 € gekauft bei Lidl', 'BOUGHT', [['Volvic', 3]], { price: 12.99, store: 'Lidl' }],
  ['Gekauft: Brot und Butter', 'BOUGHT', [['Brot', null], ['Butter', null]]],
  // German — questions
  ['Was brauchen wir?', 'ASK_NEEDS', []],
  ['Was brauchen wir noch', 'ASK_NEEDS', []],
  ['Haben wir noch Kaffee?', 'ASK_PRODUCT', [['Kaffee', null]]],
  ['Brauchen wir Milch?', 'ASK_PRODUCT', [['Milch', null]]],
  ['Ist noch genug Reis da?', 'ASK_PRODUCT', [['Reis', null]]],
  ['Ist Volvic gerade günstig?', 'ASK_PRICE', [['Volvic', null]]],
  ['Was kostet Kaffee', 'ASK_PRICE', [['Kaffee', null]]],
  // English
  ['Milk is empty', 'EMPTY', [['Milk', null]], { lang: 'en' }],
  ["We're out of coffee", 'EMPTY', [['Coffee', null]]],
  ['No more eggs', 'EMPTY', [['Eggs', null]]],
  ['We still have enough rice', 'IN_STOCK', [['Rice', null]]],
  ['Pasta is still there', 'IN_STOCK', [['Pasta', null]]],
  ['Add 2 milk to the list', 'ADD', [['Milk', 2]]],
  ['We need eggs and bread', 'ADD', [['Eggs', null], ['Bread', null]]],
  ['Bought 3 crates of Volvic for 12.99 at Aldi', 'BOUGHT', [['Volvic', 3]], { price: 12.99, store: 'Aldi' }],
  ['Got milk', 'BOUGHT', [['Milk', null]]],
  ['What do we need?', 'ASK_NEEDS', []],
  ['Do we have coffee?', 'ASK_PRODUCT', [['Coffee', null]]],
  ['Is Volvic cheap right now?', 'ASK_PRICE', [['Volvic', null]]],
  // app suggestion chips
  ['Noch genug Kaffee?', 'ASK_PRODUCT', [['Kaffee', null]]],
  ['Preis von Kaffee?', 'ASK_PRICE', [['Kaffee', null]]],
  ['Enough coffee left?', 'ASK_PRODUCT', [['Coffee', null]]],
  ['Price of coffee?', 'ASK_PRICE', [['Coffee', null]]],
];

describe('parseCommand', () => {
  it.each(cases)('%s', (text, intent, items, extra = {}) => {
    const command = parseCommand(text);

    expect(command.intent).toBe(intent);
    expect(command.items.map((item) => [item.name, item.quantity])).toEqual(items);
    if (extra.price !== undefined) {
      expect(command.price).toBe(extra.price);
    }
    if (extra.store !== undefined) {
      expect(command.store).toBe(extra.store);
    }
    if (extra.lang !== undefined) {
      expect(command.lang).toBe(extra.lang);
    }
  });

  it('detects the language', () => {
    expect(parseCommand('Milch ist leer').lang).toBe('de');
    expect(parseCommand('Milk is empty').lang).toBe('en');
  });

  it('answers unknown German sentences in German', () => {
    expect(parseCommand('Wie wird das Wetter morgen?')).toMatchObject({ intent: 'UNKNOWN', lang: 'de' });
    expect(parseCommand('Tell me a joke')).toMatchObject({ intent: 'UNKNOWN', lang: 'en' });
  });

  it('leaves what it does not understand to the AI layer', () => {
    for (const text of ['', 'Wie wird das Wetter morgen?', 'Tell me a joke', 'hmm']) {
      expect(parseCommand(text).intent).toBe('UNKNOWN');
    }
  });
});
