import { describe, expect, it } from 'vitest';

import {
  analysePurchases,
  assessProduct,
  estimateCalibration,
  expectedDurationFor,
  INFERENCE_CONFIG,
} from 'src/domain/inference';
import { addDays } from 'src/domain/time';

import { NOW, observation, purchases } from './fixtures';

// Purchases with quantities: [daysAgo, quantity][]
const bought = (...entries: [number, number][]) =>
  entries.map(([age, quantity]) => observation('PURCHASED', age, { quantity }));

describe('assessProduct', () => {
  describe('without history', () => {
    it('returns UNKNOWN with zero need and zero confidence', () => {
      const result = assessProduct([], NOW);

      expect(result.state).toBe('UNKNOWN');
      expect(result.basis).toBe('NO_DATA');
      expect(result.needScore).toBe(0);
      expect(result.confidence).toBe(0);
      expect(result.needsShopping).toBe(false);
      expect(result.reason).toBe('No history yet');
      expect(result.purchaseCount).toBe(0);
    });

    it('stays UNKNOWN when only consumption was recorded', () => {
      const result = assessProduct([observation('CONSUMED', 1)], NOW);

      expect(result.state).toBe('UNKNOWN');
      expect(result.needsShopping).toBe(false);
    });
  });

  describe('fresh purchase', () => {
    it('drops the need to almost zero right after buying', () => {
      const result = assessProduct(purchases(0.2), NOW);

      expect(result.basis).toBe('RECENT_PURCHASE');
      expect(result.state).toBe('CONFIRMED');
      expect(result.needScore).toBeLessThanOrEqual(0.05);
      expect(result.needsShopping).toBe(false);
      expect(result.reason).toBe('Bought today');
    });

    it('overrides an overdue pattern and an earlier EMPTY report', () => {
      const result = assessProduct(
        [...purchases(30, 25, 20, 15), observation('EMPTY', 3), ...purchases(1)],
        NOW,
      );

      expect(result.basis).toBe('RECENT_PURCHASE');
      expect(result.needScore).toBeLessThanOrEqual(0.05);
      // The completed cycle ran 12 days until "empty" (rhythm: 5), which the
      // engine learns from with half weight (one report): ~8.5 days.
      expect(result.reason).toBe('Bought yesterday · usually lasts ~9 days');
    });

    it('treats a purchase recorded at the same moment as an EMPTY report as coming after it', () => {
      const emptyAndBought = [
        observation('EMPTY', 0.5),
        observation('PURCHASED', 0.5),
      ];

      expect(assessProduct(emptyAndBought, NOW).basis).toBe('RECENT_PURCHASE');
    });
  });

  describe('product marked empty', () => {
    it('is a confirmed, very high need', () => {
      const result = assessProduct(
        [...purchases(10, 5), observation('EMPTY', 0.1)],
        NOW,
      );

      expect(result.basis).toBe('MARKED_EMPTY');
      expect(result.state).toBe('CONFIRMED');
      expect(result.needScore).toBe(0.95);
      expect(result.needsShopping).toBe(true);
      expect(result.reason).toBe('Marked empty today');
    });

    it('wins over an earlier sighting (things run out)', () => {
      const result = assessProduct(
        [observation('SEEN_IN_STOCK', 3), observation('EMPTY', 1)],
        NOW,
      );

      expect(result.basis).toBe('MARKED_EMPTY');
      expect(result.needsShopping).toBe(true);
    });
  });

  describe('manual need', () => {
    it('is a confirmed, high need even for a product bought recently', () => {
      const result = assessProduct(
        [...purchases(3), observation('MANUAL_NEED', 0)],
        NOW,
      );

      expect(result.basis).toBe('MANUAL_NEED');
      expect(result.state).toBe('CONFIRMED');
      expect(result.needScore).toBe(0.9);
      expect(result.needsShopping).toBe(true);
      expect(result.reason).toBe('Added as needed today');
    });
  });

  describe('recently seen in stock', () => {
    it('confirms stock and lowers the need even when the pattern is overdue', () => {
      const overdue = purchases(40, 30, 20, 10);
      const withoutSighting = assessProduct(overdue, NOW);
      const withSighting = assessProduct(
        [...overdue, observation('SEEN_IN_STOCK', 0.5)],
        NOW,
      );

      expect(withoutSighting.needsShopping).toBe(true);
      expect(withSighting.basis).toBe('SEEN_IN_STOCK');
      expect(withSighting.state).toBe('CONFIRMED');
      expect(withSighting.needScore).toBeLessThanOrEqual(0.1);
      expect(withSighting.needsShopping).toBe(false);
    });

    it('keeps pushing the estimate back a few days after the sighting', () => {
      const history = purchases(24, 16, 8);
      const withoutSighting = assessProduct(history, NOW);
      const withSighting = assessProduct(
        [...history, observation('SEEN_IN_STOCK', 3)],
        NOW,
      );

      expect(withSighting.needScore).toBeLessThan(withoutSighting.needScore);
      expect(withSighting.reason).toBe(
        'Seen in stock 3 days ago · usual interval ~8 days',
      );
    });

    it('gives a weak estimate when a product was only ever seen', () => {
      const result = assessProduct([observation('SEEN_IN_STOCK', 10)], NOW);

      expect(result.state).toBe('POSSIBLE');
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('regular purchase history', () => {
    it('is LIKELY with high confidence and low need before the usual interval', () => {
      const result = assessProduct(purchases(27, 19, 11, 3), NOW);

      expect(result.basis).toBe('PURCHASE_PATTERN');
      expect(result.state).toBe('LIKELY');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.needScore).toBeLessThan(0.1);
      expect(result.needsShopping).toBe(false);
      expect(result.typicalIntervalDays).toBe(8);
    });

    it('explains itself in one line', () => {
      const result = assessProduct(purchases(26, 21, 16, 11, 6), NOW);

      expect(result.reason).toBe(
        'Last purchased 6 days ago · usual interval ~5 days',
      );
      expect(result.factors).toContain(
        'Purchases are regular: usually every ~5 days.',
      );
    });

    it('merges purchases within one shopping trip', () => {
      const history = analysePurchases(
        [
          observation('PURCHASED', 10),
          observation('PURCHASED', 10 - 2 / 24),
          observation('PURCHASED', 5),
        ],
        INFERENCE_CONFIG,
      );

      expect(history.trips).toHaveLength(2);
      expect(history.intervals[0]).toBeCloseTo(5 - 2 / 24, 5);
    });

    it('uses the median, so a single outlier does not move the rhythm', () => {
      const history = analysePurchases(
        purchases(40, 35, 30, 25, 5, 0.5),
        INFERENCE_CONFIG,
      );

      expect(history.typicalIntervalDays).toBe(5);
    });
  });

  describe('irregular purchase history', () => {
    it('has lower confidence than a regular history with the same median', () => {
      const regular = assessProduct(purchases(33, 26, 19, 12, 5), NOW);
      const irregular = assessProduct(purchases(33, 31, 24, 12, 5), NOW);

      expect(irregular.typicalIntervalDays).toBe(regular.typicalIntervalDays);
      expect(irregular.confidence).toBeLessThan(regular.confidence);
      expect(irregular.state).toBe('POSSIBLE');
      expect(
        irregular.factors.some((factor) => factor.includes('irregular')),
      ).toBe(true);
    });

    it('stays cautious with a single purchase', () => {
      const result = assessProduct(purchases(20), NOW);

      expect(result.basis).toBe('SINGLE_PURCHASE');
      expect(result.state).toBe('POSSIBLE');
      expect(result.confidence).toBe(0.3);
      expect(result.needScore).toBeLessThanOrEqual(0.8);
      expect(result.reason).toBe(
        'Last purchased 3 weeks ago · only one purchase so far',
      );
    });
  });

  describe('exceeded purchase interval', () => {
    it('raises the need once the usual interval has passed', () => {
      const history = purchases(26, 21, 16, 11, 6);
      const result = assessProduct(history, NOW);

      expect(result.needScore).toBeGreaterThanOrEqual(0.8);
      expect(result.needsShopping).toBe(true);
      expect(result.state).toBe('LIKELY');
    });

    it('increases monotonically while nothing new happens', () => {
      const history = purchases(18, 13, 8, 3);
      const scores = [0, 2, 4, 5, 6, 8].map(
        (days) => assessProduct(history, addDays(NOW, days)).needScore,
      );

      for (let index = 1; index < scores.length; index++) {
        expect(scores[index]).toBeGreaterThanOrEqual(scores[index - 1]);
      }
      expect(scores[0]).toBeLessThan(INFERENCE_CONFIG.needThreshold);
      expect(scores[scores.length - 1]).toBeGreaterThanOrEqual(
        INFERENCE_CONFIG.needThreshold,
      );
    });

    it('brings the run-out forward when consumption is reported', () => {
      const history = purchases(24, 16, 8);
      const plain = assessProduct(history, NOW);
      const consumed = assessProduct(
        [...history, observation('CONSUMED', 2), observation('CONSUMED', 1)],
        NOW,
      );

      expect(consumed.needScore).toBeGreaterThan(plain.needScore);
      expect(consumed.factors).toContain(
        'Used 2 times since the last purchase, so it may run out sooner.',
      );
    });
  });

  describe('conflicting observations', () => {
    it('treats "empty" followed by "seen in stock" within a day as unclear', () => {
      const result = assessProduct(
        [
          ...purchases(20, 10),
          observation('EMPTY', 0.5),
          observation('SEEN_IN_STOCK', 0.25),
        ],
        NOW,
      );

      expect(result.basis).toBe('CONFLICT');
      expect(result.state).toBe('POSSIBLE');
      expect(result.confidence).toBe(0.35);
      expect(result.needScore).toBeGreaterThan(0.3);
      expect(result.needScore).toBeLessThan(0.6);
      expect(result.needsShopping).toBe(false);
      expect(result.reason).toBe(
        'Conflicting reports: marked empty today, then seen in stock',
      );
    });

    it('is not a conflict when a purchase explains the change', () => {
      const result = assessProduct(
        [observation('EMPTY', 3), ...purchases(2.5), observation('SEEN_IN_STOCK', 2.4)],
        NOW,
      );

      expect(result.basis).not.toBe('CONFLICT');
      expect(result.needsShopping).toBe(false);
    });

    it('lets a much later sighting simply win', () => {
      const result = assessProduct(
        [...purchases(20), observation('EMPTY', 10), observation('SEEN_IN_STOCK', 0.5)],
        NOW,
      );

      expect(result.basis).toBe('SEEN_IN_STOCK');
      expect(result.needsShopping).toBe(false);
    });
  });

  describe('stale evidence', () => {
    it('loses confidence when the last purchase is far beyond the usual rhythm', () => {
      const result = assessProduct(purchases(105, 100, 95, 90), NOW);

      expect(result.confidence).toBeLessThan(0.25);
      expect(result.state).toBe('UNKNOWN');
      expect(result.needsShopping).toBe(false);
      expect(result.needScore).toBeCloseTo(0.5, 1);
      expect(result.reason).toBe(
        'Last purchased 3 months ago · pattern may be out of date',
      );
    });

    it('lets an old EMPTY report fade instead of staying confirmed forever', () => {
      const fresh = assessProduct([observation('EMPTY', 1)], NOW);
      const old = assessProduct([observation('EMPTY', 60)], NOW);

      expect(fresh.state).toBe('CONFIRMED');
      expect(old.state).not.toBe('CONFIRMED');
      expect(old.confidence).toBeLessThan(fresh.confidence);
      expect(old.needScore).toBeLessThan(fresh.needScore);
      expect(old.needScore).toBeGreaterThanOrEqual(0.5);
    });

    it('ignores observations dated in the future and says so', () => {
      const result = assessProduct(
        [...purchases(26, 21, 16, 11, 6), observation('PURCHASED', -3)],
        NOW,
      );

      expect(result.basis).toBe('PURCHASE_PATTERN');
      expect(result.factors).toContain('Ignored 1 observation dated in the future.');
    });
  });

  describe('determinism', () => {
    it('does not depend on input order', () => {
      const history = [
        ...purchases(30, 22, 15, 7),
        observation('CONSUMED', 3),
        observation('SEEN_IN_STOCK', 4),
      ];
      const reversed = [...history].reverse();

      expect(assessProduct(reversed, NOW)).toEqual(assessProduct(history, NOW));
    });

    it('keeps scores within 0..1 and rounded to two decimals', () => {
      const cases = [
        [],
        purchases(1),
        purchases(300, 200),
        [observation('EMPTY', 400)],
        [...purchases(9, 6, 3), observation('CONSUMED', 1)],
      ];

      for (const history of cases) {
        const { needScore, confidence } = assessProduct(history, NOW);

        for (const value of [needScore, confidence]) {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(1);
          expect(Math.round(value * 100) / 100).toBe(value);
        }
      }
    });
  });

  describe('purchase quantities', () => {
    it('lets a bulk purchase last longer', () => {
      const bulk = assessProduct(bought([20, 1], [15, 1], [10, 1], [6, 3]), NOW, INFERENCE_CONFIG, {
        unit: 'l',
      });
      const usual = assessProduct(bought([20, 1], [15, 1], [10, 1], [6, 1]), NOW);

      expect(bulk.consumptionRatePerDay).toBe(0.2);
      expect(bulk.expectedDurationDays).toBe(15);
      expect(bulk.needScore).toBeLessThan(0.2);
      expect(bulk.needsShopping).toBe(false);
      expect(bulk.reason).toBe('Last purchased 6 days ago · 3 l usually lasts ~2 weeks');
      expect(bulk.factors).toContain(
        'Bought 3 l last time and you use about 0.2 l per day, so it should last ~2 weeks.',
      );
      expect(usual.needsShopping).toBe(true);
    });

    it('lets a small purchase run out sooner', () => {
      const small = assessProduct(bought([24, 2], [18, 2], [12, 2], [4, 1]), NOW);
      const usual = assessProduct(bought([24, 2], [18, 2], [12, 2], [4, 2]), NOW);

      expect(small.expectedDurationDays).toBe(3);
      expect(small.needScore).toBeGreaterThan(usual.needScore);
      expect(small.needsShopping).toBe(true);
    });

    it('keeps the buying rhythm when quantities are missing', () => {
      const result = assessProduct(purchases(26, 21, 16, 11, 6), NOW);

      expect(result.consumptionRatePerDay).toBeNull();
      expect(result.expectedDurationDays).toBe(5);
      expect(result.reason).toBe('Last purchased 6 days ago · usual interval ~5 days');
    });

    it('keeps the wording when quantities do not change the estimate', () => {
      const result = assessProduct(bought([26, 2], [21, 2], [16, 2], [11, 2], [6, 2]), NOW);

      expect(result.expectedDurationDays).toBe(5);
      expect(result.reason).toBe('Last purchased 6 days ago · usual interval ~5 days');
    });

    it('uses reported amounts to move the run-out precisely', () => {
      const history = bought([20, 2], [10, 2], [4, 2]);
      const half = assessProduct([...history, observation('CONSUMED', 1, { quantity: 1 })], NOW, INFERENCE_CONFIG, { unit: 'l' });
      const most = assessProduct([...history, observation('CONSUMED', 1, { quantity: 1.8 })], NOW);

      expect(most.needScore).toBeGreaterThan(half.needScore);
      expect(half.factors).toContain('Used 1 l of 2 l since the last purchase, so it may run out sooner.');
    });

    it('bounds odd quantities to a multiple of the buying rhythm', () => {
      const history = analysePurchases(bought([15, 1], [10, 1], [5, 1]), INFERENCE_CONFIG);

      expect(expectedDurationFor(100, history, 5)).toBe(20);
      expect(expectedDurationFor(0.01, history, 5)).toBe(1.25);
      expect(expectedDurationFor(null, history, 5)).toBe(5);
    });

    it('adds up purchases within one shopping trip', () => {
      const history = analysePurchases(
        [observation('PURCHASED', 5, { quantity: 1 }), observation('PURCHASED', 5 - 1 / 24, { quantity: 2 })],
        INFERENCE_CONFIG,
      );

      expect(history.tripQuantities).toEqual([3]);
    });
  });

  describe('learning from corrections', () => {
    // Rhythm: every 10 days. In both completed cycles it was empty after 7.
    const emptiesEarly = [
      ...purchases(26, 16, 6),
      observation('EMPTY', 19),
      observation('EMPTY', 9),
    ];

    it('learns that a product runs out sooner than the buying rhythm', () => {
      const learned = assessProduct(emptiesEarly, NOW);
      const plain = assessProduct(purchases(26, 16, 6), NOW);

      expect(learned.calibrationFactor).toBe(0.7);
      expect(learned.expectedDurationDays).toBe(7);
      expect(learned.needScore).toBeGreaterThan(plain.needScore);
      expect(learned.reason).toBe('Last purchased 6 days ago · usually lasts ~7 days');
      expect(learned.factors).toContain(
        'Learned from 2 earlier “Empty”/“Still have it” reports: it usually lasts about 30% less than expected, so the estimate is adjusted to ~7 days.',
      );
    });

    it('learns that a product lasts longer from a late "still have it"', () => {
      // Rhythm 10 days; one cycle lasted 16 days and it was still there after 13.
      const history = [...purchases(40, 30, 20, 4), observation('SEEN_IN_STOCK', 7)];
      const learned = assessProduct(history, NOW);

      expect(learned.calibrationFactor).toBe(1.15);
      expect(learned.needScore).toBeLessThan(assessProduct(purchases(40, 30, 20, 4), NOW).needScore);
    });

    it('gives a single report only half the weight', () => {
      const calibration = estimateCalibration(
        [...purchases(26, 16, 6), observation('EMPTY', 19)],
        analysePurchases(purchases(26, 16, 6), INFERENCE_CONFIG),
        10,
      );

      expect(calibration).toEqual({ factor: 0.85, signalCount: 1 });
    });

    it('stays within bounds after extreme reports', () => {
      const history = [
        ...purchases(40, 30, 20, 10),
        observation('EMPTY', 39.9),
        observation('EMPTY', 29.9),
        observation('EMPTY', 19.9),
      ];

      expect(assessProduct(history, NOW).calibrationFactor).toBe(0.5);
    });

    it('ignores small deviations', () => {
      const history = [...purchases(26, 16, 6), observation('EMPTY', 16.5), observation('EMPTY', 6.5)];

      expect(assessProduct(history, NOW).calibrationFactor).toBeNull();
    });

    it('does not learn from the current cycle', () => {
      const result = assessProduct([...purchases(26, 16, 6), observation('SEEN_IN_STOCK', 3)], NOW);

      expect(result.calibrationFactor).toBeNull();
    });
  });
});
