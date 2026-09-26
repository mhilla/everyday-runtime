import { describe, expect, it } from 'vitest';

import { executeCommand } from 'src/data/command-executor';
import { createHouseholdActions } from 'src/data/household-actions';
import { createHouseholdRepository } from 'src/data/household-repository';
import { pricesByProduct, toPricePoints } from 'src/domain/deals';
import { renderMessage } from 'src/domain/messages';
import { buildOverview } from 'src/domain/shopping';
import type { HouseholdSnapshot } from 'src/domain/shopping';
import { matchProduct } from 'src/domain/talk';

import { daysAgo, NOW, observation, product, purchases, shoppingItem } from 'src/domain/__tests__/fixtures';
import { createFakeTransport } from './fake-transport';

const milch = product({ id: 'milch', name: 'Milch', defaultUnit: 'l', typicalPurchaseQuantity: 2 });
const kaffee = product({ id: 'kaffee', name: 'Kaffee', defaultUnit: 'Pck.', typicalPurchaseQuantity: 1 });
const eier = product({ id: 'eier', name: 'Eier', defaultUnit: null, typicalPurchaseQuantity: 10 });

const snapshot: HouseholdSnapshot = {
  products: [milch, kaffee, eier],
  observations: [
    ...purchases(26, 21, 16, 11, 6).map((o) => ({ ...o, productId: 'milch' })),
    observation('EMPTY', 1, { productId: 'kaffee' }),
  ],
  shoppingItems: [shoppingItem({ productId: 'kaffee', name: 'Kaffee' })],
  priceObservations: [
    { id: 'p1', productId: 'kaffee', priceAmount: 6.79, priceCurrency: 'EUR', packQuantity: 1, store: 'Supermarkt', observedAt: daysAgo(20), source: 'MANUAL' },
    { id: 'p2', productId: 'kaffee', priceAmount: 4.99, priceCurrency: 'EUR', packQuantity: 1, store: 'Discounter', observedAt: daysAgo(2), source: 'MANUAL' },
  ],
};

const setup = () => {
  const { transport, calls } = createFakeTransport();
  const actions = createHouseholdActions(createHouseholdRepository(transport), () => NOW);
  const overview = buildOverview(snapshot, NOW);
  const prices = pricesByProduct(toPricePoints([], snapshot.priceObservations ?? []), NOW);

  return {
    calls,
    talk: async (text: string) => {
      const result = await executeCommand(text, { actions, snapshot, overview, prices });

      return { ...result, text: result.replies.map((m) => renderMessage(m, result.command.lang)).join('\n') };
    },
  };
};

describe('matchProduct', () => {
  it('finds products despite case, plurals and small typos', () => {
    const products = [milch, kaffee, eier];

    expect(matchProduct(products, 'milch')?.id).toBe('milch');
    expect(matchProduct(products, 'Ei')?.id).toBe('eier');
    expect(matchProduct(products, 'Kafee')?.id).toBe('kaffee');
    expect(matchProduct(products, 'Butter')).toBeNull();
  });
});

describe('executeCommand', () => {
  it('answers "what do we need?" in German', async () => {
    const { talk, calls } = setup();
    const result = await talk('Was brauchen wir?');

    expect(result.changed).toBe(false);
    expect(calls).toEqual([]);
    expect(result.text).toBe(
      '2 Sachen sind wahrscheinlich nötig:\nKaffee — Leer (95 %), steht auf der Liste\nMilch — Wahrscheinlich knapp (86 %)',
    );
  });

  it('answers a product question with the engine reason', async () => {
    const { talk } = setup();

    expect((await talk('Haben wir noch Milch?')).text).toBe(
      'Milch: Wahrscheinlich knapp (86 %). Zuletzt gekauft vor 6 Tagen · üblicher Abstand ~5 Tage.',
    );
  });

  it('answers price questions', async () => {
    const { talk } = setup();

    expect((await talk('Is Kaffee cheap?')).text).toBe(
      'Kaffee usually costs 5.89 €/Pck.; lowest in 90 days: 4.99 €/Pck. at Discounter.',
    );
    expect((await talk('Was kostet Eier')).text).toBe(
      'Für Eier gibt es noch keine Preise. Trag einen ein, wenn du ihn siehst.',
    );
  });

  it('marks things empty, creating unknown products on the way', async () => {
    const { talk, calls } = setup();
    const result = await talk('Milch und Butter sind leer');

    expect(result.text).toBe(
      'Notiert: Milch ist leer — steht jetzt auf der Liste.\nNotiert: Butter ist leer — steht jetzt auf der Liste.',
    );
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'POST /rest/observations',
      'POST /rest/shoppingItems',
      'POST /rest/products',
      'POST /rest/observations',
      'POST /rest/shoppingItems',
    ]);
  });

  it('records a purchase with quantity, price and store', async () => {
    const { talk, calls } = setup();
    const result = await talk('Hab 2 Kaffee für 9,98 gekauft bei Discounter');

    expect(result.text).toBe('Notiert: 2 Pck. Kaffee gekauft für 9,98 € bei Discounter.');
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      expect.stringMatching(/^PATCH \/rest\/shoppingItems\//),
      'POST /rest/purchases',
      'POST /rest/observations',
    ]);
    expect(calls[1].body).toMatchObject({ quantity: 2, store: 'Discounter', price: { amountMicros: 9_980_000 } });
  });

  it('adds to the list and notices duplicates', async () => {
    const { talk } = setup();

    expect((await talk('2 Milch auf die Liste')).text).toBe('Milch steht auf der Liste.');
    expect((await talk('Kaffee auf die Liste')).text).toBe('Kaffee stand schon auf der Liste.');
  });

  it('does not invent stock for unknown products', async () => {
    const { talk, calls } = setup();

    expect((await talk('Wir haben noch Reis')).text).toBe('„Reis“ kenne ich noch nicht.');
    expect(calls).toEqual([]);
  });

  it('explains what it understands when it does not', async () => {
    const { talk } = setup();

    expect((await talk('Tell me a joke')).text).toMatch(/^Sorry, I did not get that/);
  });
});
