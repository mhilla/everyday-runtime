import {
  OBSERVATION_SOURCES,
  OBSERVATION_TYPES,
  PRODUCT_CATEGORIES,
  SHOPPING_ITEM_ORIGINS,
  SHOPPING_ITEM_STATUSES,
} from 'src/domain/types';
import type {
  Observation,
  PriceObservation,
  Product,
  Purchase,
  ShoppingItem,
} from 'src/domain/types';

// Records as returned by Twenty's REST API. Every field is optional/unknown
// on purpose: the mappers below are the single place that validates them.
export type RawRecord = Record<string, unknown>;

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value : null;

const numberOrNull = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const dateOrNull = (value: unknown): Date | null => {
  if (typeof value !== 'string' || value === '') {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const oneOf = <T extends string>(
  allowed: readonly T[],
  value: unknown,
): T | null =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;

export const mapProduct = (record: RawRecord): Product => ({
  id: String(record.id),
  name: text(record.name) ?? 'Unnamed product',
  category: oneOf(PRODUCT_CATEGORIES, record.category),
  defaultUnit: text(record.defaultUnit),
  barcode: text(record.barcode),
  typicalPurchaseQuantity: numberOrNull(record.typicalPurchaseQuantity),
  archived: record.archived === true,
  shelfLifeDays: numberOrNull(record.shelfLifeDays),
  priceAlertUnitPrice: numberOrNull(record.priceAlertUnitPrice),
});

export const mapPriceObservation = (record: RawRecord): PriceObservation | null => {
  const productId = text(record.productId);
  const observedAt = dateOrNull(record.observedAt);
  const price =
    typeof record.price === 'object' && record.price !== null
      ? (record.price as RawRecord)
      : null;
  const amountMicros = numberOrNull(price?.amountMicros);
  const packQuantity = numberOrNull(record.packQuantity) ?? 1;

  if (productId === null || observedAt === null || amountMicros === null || packQuantity <= 0) {
    return null;
  }

  return {
    id: String(record.id),
    productId,
    priceAmount: amountMicros / 1_000_000,
    priceCurrency: text(price?.currencyCode) ?? 'EUR',
    packQuantity,
    store: text(record.store),
    observedAt,
    source: oneOf(['MANUAL', 'RECEIPT', 'OPEN_PRICES'] as const, record.source) ?? 'MANUAL',
  };
};

// Observations with an unknown type or no product cannot be reasoned about
// and are dropped rather than guessed.
export const mapObservation = (record: RawRecord): Observation | null => {
  const type = oneOf(OBSERVATION_TYPES, record.observationType);
  const productId = text(record.productId);
  const observedAt = dateOrNull(record.observedAt) ?? dateOrNull(record.createdAt);

  if (type === null || productId === null || observedAt === null) {
    return null;
  }

  return {
    id: String(record.id),
    productId,
    type,
    quantity: numberOrNull(record.quantity),
    observedAt,
    source: oneOf(OBSERVATION_SOURCES, record.source),
    note: text(record.note),
  };
};

export const mapShoppingItem = (record: RawRecord): ShoppingItem => ({
  id: String(record.id),
  productId: text(record.productId),
  name: text(record.name) ?? 'Unnamed item',
  requestedQuantity: numberOrNull(record.requestedQuantity) ?? 1,
  status: oneOf(SHOPPING_ITEM_STATUSES, record.status) ?? 'OPEN',
  origin: oneOf(SHOPPING_ITEM_ORIGINS, record.origin) ?? 'MANUAL',
  confidence: numberOrNull(record.confidence),
  explanation: text(record.explanation),
  createdAt: dateOrNull(record.createdAt) ?? new Date(0),
  purchasedAt: dateOrNull(record.purchasedAt),
  dismissedAt: dateOrNull(record.dismissedAt),
});

export const mapPurchase = (record: RawRecord): Purchase | null => {
  const productId = text(record.productId);
  const purchasedAt = dateOrNull(record.purchasedAt);

  if (productId === null || purchasedAt === null) {
    return null;
  }

  const price =
    typeof record.price === 'object' && record.price !== null
      ? (record.price as RawRecord)
      : null;
  const amountMicros = numberOrNull(price?.amountMicros);

  return {
    id: String(record.id),
    productId,
    quantity: numberOrNull(record.quantity) ?? 1,
    purchasedAt,
    priceAmount: amountMicros === null ? null : amountMicros / 1_000_000,
    priceCurrency: text(price?.currencyCode),
    store: text(record.store),
  };
};
