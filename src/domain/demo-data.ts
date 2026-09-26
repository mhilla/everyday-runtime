import { addDays } from 'src/domain/time';
import type {
  ObservationType,
  ProductCategory,
  ShoppingItemOrigin,
} from 'src/domain/types';

export type DemoProduct = {
  key: string;
  name: string;
  category: ProductCategory;
  defaultUnit: string;
  typicalPurchaseQuantity: number;
};

export type DemoObservation = {
  productKey: string;
  type: ObservationType;
  observedAt: Date;
  quantity: number | null;
  note: string | null;
};

export type DemoShoppingItem = {
  productKey: string;
  origin: ShoppingItemOrigin;
  requestedQuantity: number;
  explanation: string;
};

export type DemoHousehold = {
  products: DemoProduct[];
  observations: DemoObservation[];
  shoppingItems: DemoShoppingItem[];
};

export const DEMO_PRODUCTS: DemoProduct[] = [
  { key: 'milk', name: 'Milk', category: 'DAIRY', defaultUnit: 'l', typicalPurchaseQuantity: 2 },
  { key: 'coffee', name: 'Coffee', category: 'BEVERAGES', defaultUnit: 'pack', typicalPurchaseQuantity: 1 },
  { key: 'paper-towels', name: 'Paper towels', category: 'HOUSEHOLD', defaultUnit: 'pack', typicalPurchaseQuantity: 1 },
  { key: 'pasta', name: 'Pasta', category: 'PANTRY', defaultUnit: 'pack', typicalPurchaseQuantity: 2 },
  { key: 'apples', name: 'Apples', category: 'PRODUCE', defaultUnit: 'kg', typicalPurchaseQuantity: 1 },
];

// [productKey, type, days before `now`, quantity, note]
type DemoEvent = [string, ObservationType, number, number | null, string | null];

// Chosen so that each product demonstrates one rule of the engine:
// - Milk: very regular 5-day rhythm, 6 days since the last purchase.
// - Coffee: regular ~12-day rhythm with consumption reported since.
// - Paper towels: only two purchases, so the estimate stays "possible".
// - Pasta: bought two weeks ago but seen in stock yesterday.
// - Apples: marked empty yesterday and already on the list.
const DEMO_EVENTS: DemoEvent[] = [
  ['milk', 'PURCHASED', 26, 2, null],
  ['milk', 'PURCHASED', 21, 2, null],
  ['milk', 'PURCHASED', 16, 2, null],
  ['milk', 'PURCHASED', 11, 2, null],
  ['milk', 'PURCHASED', 6, 2, null],
  ['coffee', 'PURCHASED', 35, 1, null],
  ['coffee', 'PURCHASED', 23, 1, null],
  ['coffee', 'PURCHASED', 11, 1, null],
  ['coffee', 'CONSUMED', 4, null, 'Opened the last bag'],
  ['paper-towels', 'PURCHASED', 50, 1, null],
  ['paper-towels', 'PURCHASED', 26, 1, null],
  ['pasta', 'PURCHASED', 30, 2, null],
  ['pasta', 'PURCHASED', 14, 2, null],
  ['pasta', 'SEEN_IN_STOCK', 1, null, 'Two packs left in the pantry'],
  ['apples', 'PURCHASED', 16, 1, null],
  ['apples', 'PURCHASED', 9, 1, null],
  ['apples', 'EMPTY', 1, null, null],
];

const DEMO_ITEMS: DemoShoppingItem[] = [
  {
    productKey: 'apples',
    origin: 'MANUAL',
    requestedQuantity: 1,
    explanation: 'Marked empty',
  },
];

// Deterministic for a given `now`: the same household every time, always
// expressed relative to the moment it is loaded so the story stays current.
export const buildDemoHousehold = (now: Date): DemoHousehold => ({
  products: DEMO_PRODUCTS,
  observations: DEMO_EVENTS.map(([productKey, type, daysAgo, quantity, note]) => ({
    productKey,
    type,
    observedAt: addDays(now, -daysAgo),
    quantity,
    note,
  })),
  shoppingItems: DEMO_ITEMS,
});
