import { describe, expect, it } from 'vitest';

import { createHouseholdRepository } from 'src/data/household-repository';
import {
  mapObservation,
  mapProduct,
  mapPurchase,
  mapShoppingItem,
} from 'src/data/record-mappers';

import { createFakeTransport } from './fake-transport';

describe('record mappers', () => {
  it('maps products and turns Twenty\'s empty strings into null', () => {
    expect(
      mapProduct({
        id: 'p1',
        name: 'Milk',
        category: 'DAIRY',
        defaultUnit: '',
        barcode: '',
        typicalPurchaseQuantity: null,
        archived: false,
      }),
    ).toEqual({
      id: 'p1',
      name: 'Milk',
      category: 'DAIRY',
      defaultUnit: null,
      barcode: null,
      typicalPurchaseQuantity: null,
      archived: false,
      shelfLifeDays: null,
      priceAlertUnitPrice: null,
    });
  });

  it('drops observations it cannot reason about', () => {
    expect(mapObservation({ id: 'o1', observationType: 'NOPE', productId: 'p1' })).toBeNull();
    expect(mapObservation({ id: 'o2', observationType: 'EMPTY', productId: '' })).toBeNull();
    expect(
      mapObservation({
        id: 'o3',
        observationType: 'EMPTY',
        productId: 'p1',
        observedAt: '2026-09-20T10:00:00.000Z',
        source: 'APP',
        note: '',
      }),
    ).toEqual({
      id: 'o3',
      productId: 'p1',
      type: 'EMPTY',
      quantity: null,
      observedAt: new Date('2026-09-20T10:00:00.000Z'),
      source: 'APP',
      note: null,
    });
  });

  it('defaults unknown shopping item values safely', () => {
    const item = mapShoppingItem({ id: 'i1', name: 'Milk', status: 'WEIRD' });

    expect(item.status).toBe('OPEN');
    expect(item.origin).toBe('MANUAL');
    expect(item.requestedQuantity).toBe(1);
  });

  it('converts currency micros', () => {
    expect(
      mapPurchase({
        id: 'x',
        productId: 'p1',
        purchasedAt: '2026-09-20T10:00:00.000Z',
        quantity: 2,
        price: { amountMicros: 1_990_000, currencyCode: 'EUR' },
      }),
    ).toMatchObject({ priceAmount: 1.99, priceCurrency: 'EUR', quantity: 2 });
  });
});

describe('household repository', () => {
  it('pages through all records and maps them', async () => {
    const { transport, calls } = createFakeTransport({
      products: [[{ id: 'p1', name: 'Milk' }], [{ id: 'p2', name: 'Coffee' }]],
      observations: [
        [
          {
            id: 'o1',
            productId: 'p1',
            observationType: 'PURCHASED',
            observedAt: '2026-09-20T10:00:00.000Z',
          },
        ],
      ],
      shoppingItems: [[]],
    });

    const snapshot = await createHouseholdRepository(transport).loadSnapshot();

    expect(snapshot.products.map((p) => p.name)).toEqual(['Milk', 'Coffee']);
    expect(snapshot.observations).toHaveLength(1);
    expect(snapshot.shoppingItems).toEqual([]);

    const productCalls = calls.filter((call) => call.path === '/rest/products');

    expect(productCalls).toHaveLength(2);
    expect(productCalls[1].query?.starting_after).toBe('1');
    expect(calls.find((call) => call.path === '/rest/observations')?.query).toMatchObject({
      order_by: 'observedAt[DescNullsLast]',
    });
  });
});
