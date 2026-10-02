import { describe, expect, it } from 'vitest';

import { buildNeedsReport } from 'src/domain/needs-report';
import {
  buildOverview,
  groupItemsByAisle,
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

describe('buildNeedsReport', () => {
  it('serializes what is probably needed for integrations', () => {
    const report = buildNeedsReport(
      buildOverview(
        {
          products: [milk, coffee, pasta],
          observations: [...overdueMilk, ...emptyCoffee],
          shoppingItems: [shoppingItem({ productId: 'coffee', name: 'Coffee' })],
        },
        NOW,
      ),
      NOW,
    );

    expect(report).toEqual({
      generatedAt: NOW.toISOString(),
      count: 2,
      needed: [
        {
          productId: 'coffee',
          name: 'Coffee',
          state: 'CONFIRMED',
          needScore: 0.95,
          confidence: 0.95,
          label: 'Empty',
          isEstimate: false,
          reason: 'Marked empty today',
          onList: true,
        },
        {
          productId: 'milk',
          name: 'Milk',
          state: 'LIKELY',
          needScore: 0.86,
          confidence: 0.94,
          label: 'Probably low',
          isEstimate: true,
          reason: 'Last purchased 6 days ago · usual interval ~5 days',
          onList: false,
        },
      ],
    });
  });
});

describe('groupItemsByAisle', () => {
  const apples = product({ id: 'apples', name: 'Apples', category: 'PRODUCE' });
  const bananas = product({ id: 'bananas', name: 'Bananas', category: 'PRODUCE' });
  const toast = product({ id: 'toast', name: 'Toast', category: 'BAKERY' });
  const butter = product({ id: 'butter', name: 'Butter', category: 'DAIRY' });
  const peas = product({ id: 'peas', name: 'Frozen Peas', category: 'FROZEN' });
  const batteries = product({ id: 'batteries', name: 'Batteries', category: null });

  const productsMap = new Map([
    ['apples', apples],
    ['bananas', bananas],
    ['toast', toast],
    ['butter', butter],
    ['peas', peas],
    ['batteries', batteries],
  ]);

  it('groups items into aisle order and sorts alphabetically within category', () => {
    const items = [
      shoppingItem({ id: 'i1', name: 'Frozen Peas', productId: 'peas' }),
      shoppingItem({ id: 'i2', name: 'Bananas', productId: 'bananas' }),
      shoppingItem({ id: 'i3', name: 'Apples', productId: 'apples' }),
      shoppingItem({ id: 'i4', name: 'Butter', productId: 'butter' }),
      shoppingItem({ id: 'i5', name: 'Toast', productId: 'toast' }),
      shoppingItem({ id: 'i6', name: 'Batteries', productId: 'batteries' }),
    ];

    const groups = groupItemsByAisle(items, productsMap);

    expect(groups.map((g) => g.category)).toEqual([
      'PRODUCE',
      'BAKERY',
      'DAIRY',
      'FROZEN',
      'OTHER',
    ]);

    // PRODUCE has Apples before Bananas
    expect(groups[0].items.map((i) => i.name)).toEqual(['Apples', 'Bananas']);
    // OTHER has Batteries
    expect(groups[4].items.map((i) => i.name)).toEqual(['Batteries']);
  });

  it('handles items without a productId or unmapped products as OTHER', () => {
    const items = [
      shoppingItem({ id: 'i1', name: 'Sponges', productId: null }),
    ];

    const groups = groupItemsByAisle(items, productsMap);
    expect(groups).toEqual([
      { category: 'OTHER', items: [items[0]] },
    ]);
  });

  it('respects a custom aisle order', () => {
    const items = [
      shoppingItem({ id: 'i1', name: 'Butter', productId: 'butter' }),
      shoppingItem({ id: 'i2', name: 'Apples', productId: 'apples' }),
    ];

    const customOrder = ['DAIRY', 'PRODUCE'] as const;
    const groups = groupItemsByAisle(items, productsMap, customOrder);

    expect(groups.map((g) => g.category)).toEqual(['DAIRY', 'PRODUCE']);
  });
});
