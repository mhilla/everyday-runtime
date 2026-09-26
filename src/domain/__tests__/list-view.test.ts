import { describe, expect, it } from 'vitest';

import { buildListView } from 'src/domain/list-view';

import { daysAgo, NOW, product, shoppingItem } from './fixtures';

describe('buildListView', () => {
  it('lists open items oldest first, then recent purchases, and drops the rest', () => {
    const view = buildListView(
      [
        shoppingItem({ id: 'b', name: 'Bread', productId: null, createdAt: daysAgo(1) }),
        shoppingItem({ id: 'a', name: 'Milk', requestedQuantity: 2, createdAt: daysAgo(3), origin: 'INFERRED', explanation: 'usual interval ~5 days' }),
        shoppingItem({ id: 'p', name: 'Coffee', status: 'PURCHASED', purchasedAt: daysAgo(2) }),
        shoppingItem({ id: 'old', name: 'Tea', status: 'PURCHASED', purchasedAt: daysAgo(10) }),
        shoppingItem({ id: 'x', name: 'Soap', status: 'DISMISSED', dismissedAt: daysAgo(1) }),
      ],
      [product()],
      NOW,
    );

    expect(view.openCount).toBe(2);
    expect(view.items.map((item) => `${item.id}:${item.status}`)).toEqual(['a:OPEN', 'b:OPEN', 'p:PURCHASED']);
    expect(view.items[0]).toEqual({
      id: 'a',
      name: 'Milk',
      quantity: 2,
      unit: 'l',
      status: 'OPEN',
      suggested: true,
      reason: 'usual interval ~5 days',
      updatedAt: daysAgo(3).toISOString(),
    });
    expect(view.items[1].unit).toBeNull();
    expect(view.items[2].updatedAt).toBe(daysAgo(2).toISOString());
  });
});
