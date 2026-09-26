import { describe, expect, it } from 'vitest';

import { pricesByProduct, selectDeals, toPricePoints } from 'src/domain/deals';
import { buildOverview } from 'src/domain/shopping';
import type { PriceObservation, Purchase } from 'src/domain/types';

import { daysAgo, NOW, observation, product } from './fixtures';

// Volvic, unit "l": bought as crates of 6 l every ~4 days → 1.5 l per day.
const volvic = product({
  id: 'volvic',
  name: 'Volvic',
  defaultUnit: 'l',
  typicalPurchaseQuantity: 6,
  shelfLifeDays: 365,
});
const purchasesAt = (ages: number[], price = 3.6): Purchase[] =>
  ages.map((age, index) => ({
    id: `p-${index}`,
    productId: 'volvic',
    quantity: 6,
    purchasedAt: daysAgo(age),
    priceAmount: price,
    priceCurrency: 'EUR',
    store: 'Corner shop',
  }));
const observationsAt = (ages: number[]) =>
  ages.map((age) => observation('PURCHASED', age, { productId: 'volvic', quantity: 6 }));
const seen = (price: number, age: number, store = 'Discounter'): PriceObservation => ({
  id: `seen-${price}-${age}`,
  productId: 'volvic',
  priceAmount: price,
  priceCurrency: 'EUR',
  packQuantity: 6,
  store,
  observedAt: daysAgo(age),
  source: 'MANUAL',
});

const ages = [14, 10, 6, 2];
const setup = (priceObservations: PriceObservation[], alert: number | null = null) => {
  const products = [{ ...volvic, priceAlertUnitPrice: alert }];
  const overview = buildOverview(
    { products, observations: observationsAt(ages), shoppingItems: [] },
    NOW,
  );
  const prices = pricesByProduct(toPricePoints(purchasesAt(ages), priceObservations), NOW);

  return selectDeals(overview, prices, NOW);
};

describe('toPricePoints', () => {
  it('turns purchases and seen prices into unit prices', () => {
    const points = toPricePoints(purchasesAt([5]), [seen(2.7, 1)]);

    expect(points.map((p) => [p.source, p.unitPrice])).toEqual([
      ['PURCHASE', 0.6],
      ['MANUAL', 0.45],
    ]);
  });

  it('skips purchases without a price', () => {
    expect(toPricePoints([{ ...purchasesAt([5])[0], priceAmount: null }], [])).toEqual([]);
  });
});

describe('selectDeals', () => {
  it('shows a great price for something needed soon, with a stock-up plan', () => {
    const [deal] = setup([seen(2.7, 1)]);

    expect(deal.judgement.verdict).toBe('GREAT');
    expect(deal.point.store).toBe('Discounter');
    expect(deal.plan?.reason).toMatch(/^Good price: buy \d+ l — lasts about \d+ days, saves about/);
  });

  it('ignores normal prices and old sightings', () => {
    expect(setup([seen(3.6, 1)])).toEqual([]);
    expect(setup([seen(2.7, 20)])).toEqual([]);
  });

  it('always reports a triggered price alert', () => {
    const [deal] = setup([seen(3.3, 1)], 0.56);

    expect(deal.alertTriggered).toBe(true);
    expect(deal.judgement.verdict).toBe('NORMAL');
  });
});
