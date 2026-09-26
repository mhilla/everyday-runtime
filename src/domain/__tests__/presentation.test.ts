import { describe, expect, it } from 'vitest';

import { assessProduct } from 'src/domain/inference';
import {
  describeConfidence,
  describeNeed,
  formatPercent,
  formatQuantity,
  formatRate,
  greetingForHour,
  summarizeCount,
} from 'src/domain/presentation';
import { formatAgo, formatInterval } from 'src/domain/time';

import { daysAgo, NOW, observation, purchases } from './fixtures';

describe('describeNeed', () => {
  it('separates confirmed information from estimates', () => {
    const empty = describeNeed(assessProduct([observation('EMPTY', 0)], NOW));
    const estimate = describeNeed(
      assessProduct(purchases(26, 21, 16, 11, 6), NOW),
    );

    expect(empty).toEqual({ label: 'Empty', tone: 'confirmed', isEstimate: false });
    expect(estimate).toEqual({
      label: 'Probably low',
      tone: 'high',
      isEstimate: true,
    });
  });

  it('never pretends to know without data', () => {
    expect(describeNeed(assessProduct([], NOW)).label).toBe(
      'Not enough data yet',
    );
  });

  it('asks for a check when reports conflict', () => {
    const conflict = assessProduct(
      [observation('EMPTY', 0.5), observation('SEEN_IN_STOCK', 0.2)],
      NOW,
    );

    expect(describeNeed(conflict).label).toBe('Unclear — please check');
  });

  it('shows a fresh purchase as in stock', () => {
    expect(describeNeed(assessProduct(purchases(0), NOW)).label).toBe(
      'In stock',
    );
  });
});

describe('formatting', () => {
  it('formats percentages as whole numbers', () => {
    expect(formatPercent(0.857)).toBe('86%');
    expect(formatPercent(0)).toBe('0%');
  });

  it('describes confidence in words', () => {
    expect(describeConfidence(0.94)).toBe('high confidence');
    expect(describeConfidence(0.6)).toBe('medium confidence');
    expect(describeConfidence(0.3)).toBe('low confidence');
    expect(describeConfidence(0.1)).toBe('very little evidence');
  });

  it('greets by time of day', () => {
    expect(greetingForHour(8)).toBe('Good morning');
    expect(greetingForHour(14)).toBe('Good afternoon');
    expect(greetingForHour(20)).toBe('Good evening');
    expect(greetingForHour(2)).toBe('Good night');
  });

  it('summarizes counts', () => {
    expect(summarizeCount(0)).toBe('Nothing needed right now');
    expect(summarizeCount(1)).toBe('1 thing probably needed');
    expect(summarizeCount(7)).toBe('7 things probably needed');
  });

  it('formats relative dates and coarse intervals', () => {
    expect(formatAgo(daysAgo(0.2), NOW)).toBe('today');
    expect(formatAgo(daysAgo(1), NOW)).toBe('yesterday');
    expect(formatAgo(daysAgo(6), NOW)).toBe('6 days ago');
    expect(formatAgo(daysAgo(21), NOW)).toBe('3 weeks ago');
    expect(formatAgo(daysAgo(95), NOW)).toBe('3 months ago');
    expect(formatInterval(5.2)).toBe('~5 days');
    expect(formatInterval(7)).toBe('~7 days');
    expect(formatInterval(14)).toBe('~2 weeks');
    expect(formatInterval(33)).toBe('~5 weeks');
    expect(formatInterval(60)).toBe('~2 months');
  });

  it('formats consumption rates coarsely', () => {
    expect(formatRate(0.4133, 'l')).toBe('~0.4 l');
    expect(formatRate(0.043, 'pack')).toBe('~0.04 pack');
    expect(formatRate(12.6, null)).toBe('~13');
  });

  it('formats quantities with units', () => {
    expect(formatQuantity(2, 'l')).toBe('2 l');
    expect(formatQuantity(1.5, null)).toBe('1.5');
  });
});
