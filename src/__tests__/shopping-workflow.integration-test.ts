import { afterAll, describe, expect, it } from 'vitest';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { RestApiClient } from 'twenty-client-sdk/rest';

import { APPLICATION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { createHouseholdActions } from 'src/data/household-actions';
import { createHouseholdRepository } from 'src/data/household-repository';
import { buildOverview, selectSuggestions } from 'src/domain/shopping';

// Runs the main shopping workflow against a real Twenty server with the app
// installed by global-setup: quick add -> list -> bought -> estimate drops.
const client = new RestApiClient({
  baseUrl: process.env.TWENTY_API_URL,
  token: process.env.TWENTY_API_KEY,
});
const repository = createHouseholdRepository(client);
const actions = createHouseholdActions(repository);
const productName = `Integration oat milk ${Date.now()}`;
const createdProductIds: string[] = [];

afterAll(async () => {
  for (const id of createdProductIds) {
    await client.delete(`/rest/products/${id}`, { query: { soft_delete: false } });
  }
});

describe('installation', () => {
  it('registers the application', async () => {
    const result = await new MetadataApiClient().query({
      findManyApplications: { universalIdentifier: true },
    });

    expect(
      result.findManyApplications.some(
        (app: { universalIdentifier: string }) =>
          app.universalIdentifier === APPLICATION_UNIVERSAL_IDENTIFIER,
      ),
    ).toBe(true);
  });
});

describe('shopping workflow', () => {
  it('adds, buys and re-estimates a product end to end', async () => {
    const before = await repository.loadSnapshot();

    const added = await actions.quickAddToList(`2 ${productName}`, before.products, []);

    expect(added).toEqual({ productName, alreadyOnList: false });

    const afterAdd = await repository.loadSnapshot();
    const product = afterAdd.products.find((p) => p.name === productName);

    expect(product).toBeDefined();
    if (!product) {
      return;
    }
    createdProductIds.push(product.id);

    const item = afterAdd.shoppingItems.find(
      (i) => i.productId === product.id && i.status === 'OPEN',
    );

    expect(item).toMatchObject({ origin: 'MANUAL', requestedQuantity: 2 });

    const needed = buildOverview(afterAdd, new Date()).find(
      (entry) => entry.product.id === product.id,
    );

    expect(needed?.assessment).toMatchObject({
      basis: 'MANUAL_NEED',
      state: 'CONFIRMED',
      needsShopping: true,
    });

    if (!item) {
      return;
    }
    await actions.markPurchased(item, product, { quantity: 2, priceAmount: 1.29 });

    const afterPurchase = await repository.loadSnapshot();
    const closed = afterPurchase.shoppingItems.find((i) => i.id === item.id);
    const bought = buildOverview(afterPurchase, new Date()).find(
      (entry) => entry.product.id === product.id,
    );

    expect(closed?.status).toBe('PURCHASED');
    expect(closed?.purchasedAt).toBeInstanceOf(Date);
    expect(bought?.assessment).toMatchObject({
      basis: 'RECENT_PURCHASE',
      needsShopping: false,
      purchaseCount: 1,
    });
    expect(selectSuggestions(buildOverview(afterPurchase, new Date()))).not.toContainEqual(
      expect.objectContaining({ product }),
    );

    const purchases = await client.get<{ data: { purchases: { productId: string }[] } }>(
      '/rest/purchases',
      { query: { filter: `productId[eq]:${product.id}` } },
    );

    expect(purchases.data.purchases).toHaveLength(1);
  });

  it('marks a product empty and puts it on the list once', async () => {
    const snapshot = await repository.loadSnapshot();
    const product = snapshot.products.find((p) => p.name === productName);

    expect(product).toBeDefined();
    const entry = buildOverview(snapshot, new Date()).find(
      (overview) => overview.product.id === product?.id,
    );

    if (!entry) {
      return;
    }
    await actions.markEmpty(entry);

    const after = await repository.loadSnapshot();
    const open = after.shoppingItems.filter(
      (i) => i.productId === entry.product.id && i.status === 'OPEN',
    );
    const assessed = buildOverview(after, new Date()).find(
      (overview) => overview.product.id === entry.product.id,
    );

    expect(open).toHaveLength(1);
    expect(open[0].explanation).toBe('Marked empty');
    expect(assessed?.assessment.basis).toBe('MARKED_EMPTY');
  });
});
