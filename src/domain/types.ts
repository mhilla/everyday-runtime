import type { Message } from 'src/domain/messages';

// Framework-independent domain model of Everyday Runtime.
// Nothing in src/domain may import from Twenty, React or any runtime API:
// the inference engine must stay a pure, deterministic, testable function.

export const PRODUCT_CATEGORIES = [
  'DAIRY',
  'BAKERY',
  'PRODUCE',
  'PANTRY',
  'BEVERAGES',
  'FROZEN',
  'HOUSEHOLD',
  'PERSONAL_CARE',
  'OTHER',
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const OBSERVATION_TYPES = [
  'PURCHASED',
  'CONSUMED',
  'EMPTY',
  'SEEN_IN_STOCK',
  'MANUAL_NEED',
] as const;
export type ObservationType = (typeof OBSERVATION_TYPES)[number];

export const OBSERVATION_SOURCES = [
  'APP',
  'SHOPPING_LIST',
  'DEMO',
  'IMPORT',
  'API',
] as const;
export type ObservationSource = (typeof OBSERVATION_SOURCES)[number];

export const SHOPPING_ITEM_STATUSES = ['OPEN', 'PURCHASED', 'DISMISSED'] as const;
export type ShoppingItemStatus = (typeof SHOPPING_ITEM_STATUSES)[number];

export const SHOPPING_ITEM_ORIGINS = ['MANUAL', 'INFERRED'] as const;
export type ShoppingItemOrigin = (typeof SHOPPING_ITEM_ORIGINS)[number];

export const NEED_STATES = ['CONFIRMED', 'LIKELY', 'POSSIBLE', 'UNKNOWN'] as const;
export type NeedState = (typeof NEED_STATES)[number];

export type Product = {
  id: string;
  name: string;
  category: ProductCategory | null;
  defaultUnit: string | null;
  barcode: string | null;
  typicalPurchaseQuantity: number | null;
  archived: boolean;
  shelfLifeDays: number | null;
  priceAlertUnitPrice: number | null;
};

export type Observation = {
  id: string;
  productId: string;
  type: ObservationType;
  quantity: number | null;
  observedAt: Date;
  source: ObservationSource | null;
  note: string | null;
};

export type ShoppingItem = {
  id: string;
  productId: string | null;
  name: string;
  requestedQuantity: number;
  status: ShoppingItemStatus;
  origin: ShoppingItemOrigin;
  confidence: number | null;
  explanation: string | null;
  createdAt: Date;
  purchasedAt: Date | null;
  dismissedAt: Date | null;
};

export type PriceObservationSource = 'MANUAL' | 'RECEIPT' | 'OPEN_PRICES';

// A price seen somewhere (store shelf, flyer, receipt, community data).
export type PriceObservation = {
  id: string;
  productId: string;
  priceAmount: number;
  priceCurrency: string;
  // Quantity in the product's unit that the price is for.
  packQuantity: number;
  store: string | null;
  observedAt: Date;
  source: PriceObservationSource;
};

export type Purchase = {
  id: string;
  productId: string;
  quantity: number;
  purchasedAt: Date;
  priceAmount: number | null;
  priceCurrency: string | null;
  store: string | null;
};

// What the engine concluded and on which evidence. `basis` identifies the
// rule that produced the result, so callers can explain and tests can assert.
export type AssessmentBasis =
  | 'NO_DATA'
  | 'MARKED_EMPTY'
  | 'MANUAL_NEED'
  | 'RECENT_PURCHASE'
  | 'SEEN_IN_STOCK'
  | 'PURCHASE_PATTERN'
  | 'SINGLE_PURCHASE'
  | 'CONFLICT';

export type NeedAssessment = {
  state: NeedState;
  // How much the engine trusts its own estimate, 0..1.
  confidence: number;
  // How likely the product needs to be bought now, 0..1.
  needScore: number;
  needsShopping: boolean;
  basis: AssessmentBasis;
  // One short sentence for list rows, e.g.
  // "Last purchased 6 days ago · usual interval ~5 days".
  reason: string;
  // Longer, ordered explanation lines for the "why?" panel.
  factors: string[];
  // The same texts as translatable messages (render with renderMessage).
  reasonMessage: Message;
  factorMessages: Message[];
  lastPurchasedAt: Date | null;
  typicalIntervalDays: number | null;
  purchaseCount: number;
  // How long the current purchase is expected to last, in days (after
  // quantities and learned corrections). Null without a purchase rhythm.
  expectedDurationDays: number | null;
  // Typical use per day in the product's unit, when quantities are known.
  consumptionRatePerDay: number | null;
  // Multiplier learned from past "Empty" / "Still have it" reports, if any.
  calibrationFactor: number | null;
};
