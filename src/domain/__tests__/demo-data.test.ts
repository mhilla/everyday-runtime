import { describe, expect, it } from 'vitest';

import { buildDemoHousehold } from 'src/domain/demo-data';
import { describeNeed } from 'src/domain/presentation';
import { pricesByProduct, selectDeals, toPricePoints } from 'src/domain/deals';
import { selectQuestions } from 'src/domain/questions';
import { buildOverview, selectProbablyNeeded } from 'src/domain/shopping';
import type { HouseholdSnapshot } from 'src/domain/shopping';

import { NOW } from './fixtures';

// Mirrors what the app does when "Load demo household" is pressed.
const toSnapshot = (now: Date): HouseholdSnapshot => {
  const demo = buildDemoHousehold(now);

  return {
    products: demo.products.map((product) => ({
      id: product.key,
      name: product.name,
      category: product.category,
      defaultUnit: product.defaultUnit,
      barcode: null,
      typicalPurchaseQuantity: product.typicalPurchaseQuantity,
      archived: false,
      shelfLifeDays: product.shelfLifeDays,
      priceAlertUnitPrice: null,
    })),
    observations: demo.observations.map((observation, index) => ({
      id: `demo-${index}`,
      productId: observation.productKey,
      type: observation.type,
      quantity: observation.quantity,
      observedAt: observation.observedAt,
      source: 'DEMO',
      note: observation.note,
    })),
    priceObservations: demo.prices.map((price, index) => ({
      id: `demo-price-${index}`,
      productId: price.productKey,
      priceAmount: price.priceAmount,
      priceCurrency: 'EUR',
      packQuantity: price.packQuantity,
      store: price.store,
      observedAt: price.observedAt,
      source: 'MANUAL' as const,
    })),
    shoppingItems: demo.shoppingItems.map((item, index) => ({
      id: `demo-item-${index}`,
      productId: item.productKey,
      name: item.productKey,
      requestedQuantity: item.requestedQuantity,
      status: 'OPEN',
      origin: item.origin,
      confidence: null,
      explanation: item.explanation,
      createdAt: now,
      purchasedAt: null,
      dismissedAt: null,
    })),
  };
};

describe('demo household', () => {
  it('is deterministic for a given moment', () => {
    expect(buildDemoHousehold(NOW)).toEqual(buildDemoHousehold(NOW));
  });

  it('contains the five documented products', () => {
    expect(buildDemoHousehold(NOW).products.map((p) => p.name)).toEqual([
      'Milk',
      'Coffee',
      'Paper towels',
      'Pasta',
      'Apples',
    ]);
  });

  it('never creates observations in the future', () => {
    for (const observation of buildDemoHousehold(NOW).observations) {
      expect(observation.observedAt.getTime()).toBeLessThanOrEqual(
        NOW.getTime(),
      );
    }
  });

  it('shows every kind of engine result right after loading', () => {
    const overview = buildOverview(toSnapshot(NOW), NOW);
    const byName = Object.fromEntries(
      overview.map((entry) => [entry.product.name, entry]),
    );

    expect(describeNeed(byName.Milk.assessment).label).toBe('Probably low');
    expect(byName.Milk.assessment.reason).toBe(
      'Last purchased 6 days ago · usual interval ~5 days',
    );
    expect(byName.Coffee.assessment.state).toBe('LIKELY');
    expect(byName.Coffee.assessment.needsShopping).toBe(true);
    expect(byName['Paper towels'].assessment.state).toBe('POSSIBLE');
    expect(byName.Pasta.assessment.needsShopping).toBe(false);
    expect(byName.Apples.assessment.basis).toBe('MARKED_EMPTY');
    expect(byName.Apples.openItem).not.toBeNull();

    expect(
      selectProbablyNeeded(overview).map((entry) => entry.product.name),
    ).toEqual(['Apples', 'Milk', 'Paper towels', 'Coffee']);
  });

  it('shows the price radar and asks sensible questions', () => {
    const snapshot = toSnapshot(NOW);
    const overview = buildOverview(snapshot, NOW);
    const prices = pricesByProduct(toPricePoints([], snapshot.priceObservations ?? []), NOW);
    const deals = selectDeals(overview, prices, NOW);

    expect(deals.map((d) => d.overview.product.name)).toEqual(['Coffee']);
    expect(deals[0].judgement.verdict).toBe('GREAT');
    expect(deals[0].point.store).toBe('Discounter');
    expect(deals[0].plan?.reason).toMatch(/^Good price: buy 4 packs — lasts about \d+ days, saves about/);

    const questions = selectQuestions(overview, NOW).map((q) => q.overview.product.name);

    expect(questions).toContain('Paper towels');
    expect(questions).not.toContain('Apples');
  });
});
