import { describe, expect, it } from 'vitest';

import { analysePurchases, assessProduct, INFERENCE_CONFIG } from 'src/domain/inference';
import { addDays } from 'src/domain/time';

import { NOW, observation, purchases } from './fixtures';

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
      expect(result.reason).toBe('Bought yesterday · usual interval ~5 days');
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
});
