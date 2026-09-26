import { addDays } from 'src/domain/time';
import type {
  Observation,
  ObservationType,
  Product,
  ShoppingItem,
} from 'src/domain/types';

export const NOW = new Date('2026-09-26T12:00:00.000Z');

let sequence = 0;

export const daysAgo = (days: number) => addDays(NOW, -days);

export const observation = (
  type: ObservationType,
  ageInDays: number,
  overrides: Partial<Observation> = {},
): Observation => {
  sequence += 1;

  return {
    id: `obs-${String(sequence).padStart(4, '0')}`,
    productId: 'milk',
    type,
    quantity: null,
    observedAt: daysAgo(ageInDays),
    source: 'APP',
    note: null,
    ...overrides,
  };
};

// Purchases at the given ages (days before NOW).
export const purchases = (...ages: number[]) =>
  ages.map((age) => observation('PURCHASED', age));

export const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'milk',
  name: 'Milk',
  category: 'DAIRY',
  defaultUnit: 'l',
  barcode: null,
  typicalPurchaseQuantity: 2,
  archived: false,
  shelfLifeDays: null,
  priceAlertUnitPrice: null,
  ...overrides,
});

export const shoppingItem = (
  overrides: Partial<ShoppingItem> = {},
): ShoppingItem => {
  sequence += 1;

  return {
    id: `item-${String(sequence).padStart(4, '0')}`,
    productId: 'milk',
    name: 'Milk',
    requestedQuantity: 1,
    status: 'OPEN',
    origin: 'MANUAL',
    confidence: null,
    explanation: null,
    createdAt: daysAgo(1),
    purchasedAt: null,
    dismissedAt: null,
    ...overrides,
  };
};
