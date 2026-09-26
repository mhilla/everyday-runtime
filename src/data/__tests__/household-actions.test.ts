import { describe, expect, it } from 'vitest';

import { createHouseholdActions } from 'src/data/household-actions';
import { createHouseholdRepository } from 'src/data/household-repository';
import { assessProduct } from 'src/domain/inference';
import type { ProductOverview } from 'src/domain/shopping';

import { NOW, product, purchases, shoppingItem } from 'src/domain/__tests__/fixtures';
import { createFakeTransport } from './fake-transport';

const setup = () => {
  const { transport, calls } = createFakeTransport();
  const actions = createHouseholdActions(
    createHouseholdRepository(transport),
    () => NOW,
  );

  return { actions, calls };
};

const overviewFor = (overrides: Partial<ProductOverview> = {}): ProductOverview => ({
  product: product(),
  assessment: assessProduct(purchases(26, 21, 16, 11, 6), NOW),
  openItem: null,
  isSuggestionSuppressed: false,
  lastObservation: null,
  ...overrides,
});

const writes = (calls: ReturnType<typeof setup>['calls']) =>
  calls.map((call) => `${call.method} ${call.path}`);

describe('household actions', () => {
  it('quick-adds a new product: creates it, records the need, adds it to the list', async () => {
    const { actions, calls } = setup();

    const result = await actions.quickAddToList('2 oat milk', [], []);

    expect(result).toEqual({ productName: 'Oat milk', alreadyOnList: false });
    expect(writes(calls)).toEqual([
      'POST /rest/products',
      'POST /rest/observations',
      'POST /rest/shoppingItems',
    ]);
    expect(calls[1].body).toMatchObject({
      observationType: 'MANUAL_NEED',
      source: 'SHOPPING_LIST',
      quantity: 2,
      summary: 'Oat milk — needed',
    });
    expect(calls[2].body).toMatchObject({
      name: 'Oat milk',
      origin: 'MANUAL',
      status: 'OPEN',
      requestedQuantity: 2,
    });
  });

  it('quick-add reuses an existing product and does not duplicate list entries', async () => {
    const { actions, calls } = setup();
    const open = shoppingItem({ requestedQuantity: 1 });

    const result = await actions.quickAddToList('MILK x3', [product()], [open]);

    expect(result).toEqual({ productName: 'Milk', alreadyOnList: true });
    expect(writes(calls)).toEqual([`PATCH /rest/shoppingItems/${open.id}`]);
    expect(calls[0].body).toMatchObject({ requestedQuantity: 3 });
  });

  it('quick-add revives an archived product instead of creating a new one', async () => {
    const { actions, calls } = setup();

    await actions.quickAddToList('milk', [product({ archived: true })], []);

    expect(writes(calls)[0]).toBe('PATCH /rest/products/milk');
    expect(calls[0].body).toEqual({ archived: false });
  });

  it('marking empty records the observation and puts the product on the list', async () => {
    const { actions, calls } = setup();

    await actions.markEmpty(overviewFor());

    expect(writes(calls)).toEqual(['POST /rest/observations', 'POST /rest/shoppingItems']);
    expect(calls[0].body).toMatchObject({
      observationType: 'EMPTY',
      observedAt: NOW.toISOString(),
    });
    expect(calls[1].body).toMatchObject({ explanation: 'Marked empty', requestedQuantity: 2 });
  });

  it('marking empty does not add a second list entry', async () => {
    const { actions, calls } = setup();

    await actions.markEmpty(overviewFor({ openItem: shoppingItem() }));

    expect(writes(calls)).toEqual(['POST /rest/observations']);
  });

  it('"still have it" withdraws an engine suggestion but keeps manual entries', async () => {
    const inferred = setup();
    const inferredItem = shoppingItem({ origin: 'INFERRED' });

    await inferred.actions.markInStock(overviewFor({ openItem: inferredItem }));
    expect(writes(inferred.calls)).toEqual([
      'POST /rest/observations',
      `PATCH /rest/shoppingItems/${inferredItem.id}`,
    ]);

    const manual = setup();

    await manual.actions.markInStock(overviewFor({ openItem: shoppingItem() }));
    expect(writes(manual.calls)).toEqual(['POST /rest/observations']);
  });

  it('accepting a suggestion stores confidence and explanation', async () => {
    const { actions, calls } = setup();

    await actions.acceptSuggestion(overviewFor());

    expect(calls[0].body).toMatchObject({
      origin: 'INFERRED',
      status: 'OPEN',
      confidence: 0.86,
      explanation: 'Last purchased 6 days ago · usual interval ~5 days',
    });
  });

  it('dismissing a suggestion is remembered as a dismissed item', async () => {
    const { actions, calls } = setup();

    await actions.dismissSuggestion(overviewFor());

    expect(calls[0].body).toMatchObject({
      origin: 'INFERRED',
      status: 'DISMISSED',
      dismissedAt: NOW.toISOString(),
    });
  });

  it('buying an item closes it, logs the purchase and records the observation', async () => {
    const { actions, calls } = setup();
    const item = shoppingItem();

    await actions.markPurchased(item, product(), {
      quantity: 2,
      priceAmount: 1.19,
      store: ' Corner shop ',
    });

    expect(writes(calls)).toEqual([
      `PATCH /rest/shoppingItems/${item.id}`,
      'POST /rest/purchases',
      'POST /rest/observations',
    ]);
    expect(calls[0].body).toMatchObject({
      status: 'PURCHASED',
      purchasedAt: NOW.toISOString(),
    });
    expect(calls[1].body).toMatchObject({
      quantity: 2,
      store: 'Corner shop',
      price: { amountMicros: 1_190_000, currencyCode: 'EUR' },
    });
    expect(calls[2].body).toMatchObject({
      observationType: 'PURCHASED',
      source: 'SHOPPING_LIST',
      quantity: 2,
    });
  });

  it('buying without price leaves the price empty', async () => {
    const { actions, calls } = setup();

    await actions.markPurchased(null, product(), { quantity: 0 });

    expect(writes(calls)).toEqual(['POST /rest/purchases', 'POST /rest/observations']);
    expect(calls[0].body).not.toHaveProperty('price');
    expect(calls[0].body).toMatchObject({ quantity: 1, store: null });
  });

  it('loads the demo household in one batch and reuses existing products', async () => {
    const { actions, calls } = setup();

    await actions.loadDemoHousehold([product()]);

    const created = calls.filter((call) => call.path === '/rest/products');
    const batch = calls.find((call) => call.path === '/rest/batch/observations');

    expect(created.map((call) => (call.body as { name: string }).name)).toEqual([
      'Coffee',
      'Paper towels',
      'Pasta',
      'Apples',
    ]);
    const observations = (batch?.body ?? []) as { productId: string; source: string }[];

    expect(observations).toHaveLength(17);
    expect(
      observations.every(
        (body) => body.source === 'DEMO' && body.productId !== undefined,
      ),
    ).toBe(true);
  });
});
