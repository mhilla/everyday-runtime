import { describe, expect, it } from 'vitest';

import { findProductByName, parseQuickAdd, toDisplayName } from 'src/domain/quick-add';

import { product } from './fixtures';

describe('parseQuickAdd', () => {
  it.each([
    ['milk', { name: 'milk', quantity: null }],
    ['  2   milk ', { name: 'milk', quantity: 2 }],
    ['2x paper towels', { name: 'paper towels', quantity: 2 }],
    ['coffee x3', { name: 'coffee', quantity: 3 }],
    ['1,5 apples', { name: 'apples', quantity: 1.5 }],
    ['7up', { name: '7up', quantity: null }],
  ])('parses %j', (input, expected) => {
    expect(parseQuickAdd(input)).toEqual(expected);
  });

  it('ignores empty input', () => {
    expect(parseQuickAdd('   ')).toBeNull();
  });
});

describe('findProductByName', () => {
  it('matches case-insensitively and prefers active products', () => {
    const archived = product({ id: 'a', archived: true });
    const active = product({ id: 'b' });

    expect(findProductByName([archived, active], ' MILK ')?.id).toBe('b');
    expect(findProductByName([archived], 'milk')?.id).toBe('a');
    expect(findProductByName([active], 'oat milk')).toBeNull();
  });
});

describe('toDisplayName', () => {
  it('capitalizes the first letter only', () => {
    expect(toDisplayName(' paper towels')).toBe('Paper towels');
  });
});
