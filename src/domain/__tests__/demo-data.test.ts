import { describe, expect, it } from 'vitest';

import { buildDemoHousehold } from 'src/domain/demo-data';
import { describeNeed } from 'src/domain/presentation';
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
});
