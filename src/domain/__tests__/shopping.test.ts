import { describe, expect, it } from 'vitest';

import {
  buildOverview,
  selectProbablyNeeded,
  selectSuggestions,
} from 'src/domain/shopping';

import {
  daysAgo,
  NOW,
  observation,
  product,
  purchases,
  shoppingItem,
} from './fixtures';

const milk = product();
const coffee = product({ id: 'coffee', name: 'Coffee' });
const pasta = product({ id: 'pasta', name: 'Pasta' });

const overdueMilk = purchases(26, 21, 16, 11, 6);
const emptyCoffee = [observation('EMPTY', 0.5, { productId: 'coffee' })];

describe('buildOverview', () => {
  it('skips archived products', () => {
    const overview = buildOverview(
      {
        products: [milk, product({ id: 'old', name: 'Old', archived: true })],
        observations: [],
        shoppingItems: [],
      },
      NOW,
    );

    expect(overview.map((entry) => entry.product.id)).toEqual(['milk']);
  });

  it('links the newest open item and the latest observation', () => {
    const older = shoppingItem({ createdAt: daysAgo(3) });
    const newer = shoppingItem({ createdAt: daysAgo(1) });
    const [entry] = buildOverview(
      {
        products: [milk],
        observations: overdueMilk,
        shoppingItems: [older, newer, shoppingItem({ status: 'PURCHASED' })],
      },
      NOW,
    );

    expect(entry.openItem?.id).toBe(newer.id);
    expect(entry.lastObservation?.observedAt).toEqual(daysAgo(6));
  });
});

describe('selectSuggestions', () => {
  it('suggests needed products sorted by need, most needed first', () => {
    const suggestions = selectSuggestions(
      buildOverview(
        {
          products: [milk, coffee, pasta],
          observations: [...overdueMilk, ...emptyCoffee],
          shoppingItems: [],
        },
        NOW,
      ),
    );

    expect(suggestions.map((entry) => entry.product.name)).toEqual([
      'Coffee',
      'Milk',
    ]);
  });

  it('does not suggest what is already on the list', () => {
    const suggestions = selectSuggestions(
      buildOverview(
        {
          products: [milk],
          observations: overdueMilk,
          shoppingItems: [shoppingItem()],
        },
        NOW,
      ),
    );

    expect(suggestions).toEqual([]);
  });

  it('respects a dismissal until something new is observed', () => {
    const dismissed = shoppingItem({
      status: 'DISMISSED',
      origin: 'INFERRED',
      dismissedAt: daysAgo(1),
    });
    const snapshot = {
      products: [milk],
      observations: overdueMilk,
      shoppingItems: [dismissed],
    };

    expect(selectSuggestions(buildOverview(snapshot, NOW))).toEqual([]);

    const afterNewEvidence = buildOverview(
      {
        ...snapshot,
        observations: [...overdueMilk, observation('EMPTY', 0.5)],
      },
      NOW,
    );

    expect(selectSuggestions(afterNewEvidence)).toHaveLength(1);
  });
});

describe('selectProbablyNeeded', () => {
  it('lists items already on the list first, then suggestions', () => {
    const needed = selectProbablyNeeded(
      buildOverview(
        {
          products: [milk, coffee, pasta],
          observations: [...overdueMilk, ...emptyCoffee],
          shoppingItems: [
            shoppingItem({ productId: 'pasta', name: 'Pasta' }),
          ],
        },
        NOW,
      ),
    );

    expect(needed.map((entry) => entry.product.name)).toEqual([
      'Pasta',
      'Coffee',
      'Milk',
    ]);
  });
});
