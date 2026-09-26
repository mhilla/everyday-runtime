import { describe, expect, it } from 'vitest';

import { formatAmountWithUnit, judgePrice, matchPriceAlert, planStockUp, summarizePrices } from 'src/domain/prices';
import type { PricePoint } from 'src/domain/prices';

import { daysAgo, NOW } from './fixtures';

const point = (unitPrice: number, age: number, store: string | null = 'Corner shop'): PricePoint => ({
  productId: 'volvic',
  unitPrice,
  currency: 'EUR',
  store,
  observedAt: daysAgo(age),
  source: 'PURCHASE',
});

// Volvic, per litre: usually ~0.60 €/l
const history = [point(0.6, 150), point(0.62, 100), point(0.58, 60), point(0.6, 30), point(0.61, 10)];

describe('summarizePrices', () => {
  it('uses the median as the usual price and finds the recent low', () => {
    const summary = summarizePrices(history, NOW);

    expect(summary.typicalUnitPrice).toBe(0.6);
    expect(summary.lowestRecent?.unitPrice).toBe(0.58);
    expect(summary.latest?.unitPrice).toBe(0.61);
    expect(summary.pointCount).toBe(5);
  });

  it('ignores future, zero and old prices', () => {
    const summary = summarizePrices([point(0.4, 400), point(0, 5), point(0.5, -3), point(0.7, 5)], NOW);

    expect(summary.pointCount).toBe(1);
    expect(summary.typicalUnitPrice).toBe(0.7);
  });
});

describe('judgePrice', () => {
  const summary = summarizePrices(history, NOW);

  it('calls a price 25% below usual a great deal', () => {
    const judgement = judgePrice(0.45, summary, 'l');

    expect(judgement.verdict).toBe('GREAT');
    expect(judgement.discount).toBe(0.25);
    expect(judgement.reason).toBe('25% below your usual price (usually 0.60 €/l) — lowest in 90 days.');
  });

  it('distinguishes good, normal and expensive', () => {
    // With an even lower price seen recently, 12% off is "good", not "great".
    const withLow = summarizePrices([...history, point(0.5, 20)], NOW);

    expect(judgePrice(0.53, withLow, 'l').verdict).toBe('GOOD');
    expect(judgePrice(0.6, summary, 'l').verdict).toBe('NORMAL');
    expect(judgePrice(0.7, summary, 'l').verdict).toBe('EXPENSIVE');
  });

  it('does not judge without enough prices', () => {
    const judgement = judgePrice(0.3, summarizePrices([point(0.6, 5)], NOW), 'l');

    expect(judgement.verdict).toBe('UNKNOWN');
  });
});

describe('planStockUp', () => {
  const summary = summarizePrices(history, NOW);
  const base = {
    ratePerDay: 1.5, // litres per day
    usualDurationDays: 6,
    packSize: 6, // a crate of 6 × 1 l
    shelfLifeDays: 365,
    judgement: judgePrice(0.45, summary, 'l'),
    unitPrice: 0.45,
    typicalUnitPrice: summary.typicalUnitPrice,
    unit: 'l',
    currency: 'EUR',
  };

  it('recommends stocking up on a great price, in whole packs, with the saving', () => {
    const plan = planStockUp(base);

    expect(plan).toEqual({
      quantity: 36,
      coversDays: 24,
      saving: 5.4,
      reason: 'Good price: buy 36 l — lasts about 24 days, saves about 5.40 €.',
    });
  });

  it('covers one cycle at a normal price', () => {
    const plan = planStockUp({ ...base, unitPrice: 0.6, judgement: judgePrice(0.6, summary, 'l') });

    expect(plan?.quantity).toBe(12);
    expect(plan?.reason).toBe('Buy 12 l — enough for about 8 days. Not worth stocking up at this price.');
  });

  it('respects shelf life', () => {
    const plan = planStockUp({ ...base, packSize: 1, shelfLifeDays: 5 });

    expect(plan?.coversDays).toBe(5);
    expect(plan?.reason).toContain('limited by shelf life');
  });

  it('needs a known consumption rate', () => {
    expect(planStockUp({ ...base, ratePerDay: null })).toBeNull();
  });
});

describe('matchPriceAlert', () => {
  it('returns recent prices at or below the alert, newest first', () => {
    const matches = matchPriceAlert(0.59, [point(0.58, 10), point(0.5, 3), point(0.4, 40), point(0.7, 1)], NOW);

    expect(matches.map((m) => m.unitPrice)).toEqual([0.5, 0.58]);
    expect(matchPriceAlert(null, history, NOW)).toEqual([]);
  });
});

describe('formatAmountWithUnit', () => {
  it('pluralises word units only', () => {
    expect(formatAmountWithUnit(4, 'pack')).toBe('4 packs');
    expect(formatAmountWithUnit(1, 'pack')).toBe('1 pack');
    expect(formatAmountWithUnit(36, 'l')).toBe('36 l');
    expect(formatAmountWithUnit(2, 'rolls')).toBe('2 rolls');
  });
});
