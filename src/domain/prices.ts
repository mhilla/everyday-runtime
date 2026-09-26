import { amount, money, msg, renderMessage } from 'src/domain/messages';
import type { Message } from 'src/domain/messages';
import { daysBetween, median } from 'src/domain/time';

// Price radar: deterministic, explainable price judgements from the
// household's own purchases, logged prices and open community data.

export type PriceSource = 'PURCHASE' | 'MANUAL' | 'RECEIPT' | 'OPEN_PRICES';

export type PricePoint = {
  productId: string;
  // Price per product unit (e.g. per litre when the product unit is "l").
  unitPrice: number;
  currency: string;
  store: string | null;
  observedAt: Date;
  source: PriceSource;
};

export const PRICE_CONFIG = {
  // The "usual" price is the median over this window.
  typicalWindowDays: 180,
  // "Lowest recently" looks back this far.
  lowWindowDays: 90,
  // Discount against the usual price that counts as good / great.
  goodDiscount: 0.1,
  greatDiscount: 0.2,
  // More than this above the usual price is expensive.
  expensiveMarkup: 0.1,
  // Need at least this many points to judge a price.
  minPoints: 2,
  // Stock-up defaults when the product does not say otherwise.
  defaultMaxStockDays: 60,
} as const;

export type PriceConfig = typeof PRICE_CONFIG;

export type PriceSummary = {
  pointCount: number;
  typicalUnitPrice: number | null;
  lowestRecent: PricePoint | null;
  latest: PricePoint | null;
  currency: string | null;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

// "4 packs", "2 rolls", but "4 l", "1.5 kg".
export const formatAmountWithUnit = (amount: number, unit: string | null) => {
  const rounded = round2(amount);

  if (!unit) {
    return `${rounded}`;
  }

  const isWord = unit.length > 2 && !unit.endsWith('s');

  return `${rounded} ${isWord && rounded !== 1 ? `${unit}s` : unit}`;
};

export const formatMoney = (amount: number, currency: string | null) =>
  `${amount.toFixed(2)} ${currency === 'EUR' || currency === null ? '€' : currency}`;

export const summarizePrices = (
  points: PricePoint[],
  now: Date,
  config: PriceConfig = PRICE_CONFIG,
): PriceSummary => {
  const valid = points
    .filter((p) => Number.isFinite(p.unitPrice) && p.unitPrice > 0)
    .filter((p) => p.observedAt <= now)
    .sort((a, b) => a.observedAt.getTime() - b.observedAt.getTime());
  const typicalWindow = valid.filter(
    (p) => daysBetween(p.observedAt, now) <= config.typicalWindowDays,
  );
  const lowWindow = valid.filter(
    (p) => daysBetween(p.observedAt, now) <= config.lowWindowDays,
  );
  const lowestRecent = lowWindow.reduce<PricePoint | null>(
    (lowest, p) => (lowest === null || p.unitPrice < lowest.unitPrice ? p : lowest),
    null,
  );
  const typical = median(typicalWindow.map((p) => p.unitPrice));

  return {
    pointCount: typicalWindow.length,
    typicalUnitPrice: typical === null ? null : round2(typical),
    lowestRecent,
    latest: valid.length > 0 ? valid[valid.length - 1] : null,
    currency: valid.length > 0 ? valid[valid.length - 1].currency : null,
  };
};

export type PriceVerdict = 'GREAT' | 'GOOD' | 'NORMAL' | 'EXPENSIVE' | 'UNKNOWN';

export type PriceJudgement = {
  verdict: PriceVerdict;
  // Relative to the usual price: 0.2 = 20% cheaper, -0.1 = 10% more expensive.
  discount: number | null;
  isLowestRecent: boolean;
  reason: string;
  reasonMessage: Message;
};

// Is this unit price a good deal for this household?
export const judgePrice = (
  unitPrice: number,
  summary: PriceSummary,
  unit: string | null,
  config: PriceConfig = PRICE_CONFIG,
): PriceJudgement => {
  const per = unit ? `/${unit}` : '';
  const withMessage = (
    judgement: Omit<PriceJudgement, 'reason' | 'reasonMessage'>,
    message: Message,
  ): PriceJudgement => ({ ...judgement, reason: renderMessage(message, 'en'), reasonMessage: message });

  if (summary.typicalUnitPrice === null || summary.pointCount < config.minPoints) {
    return withMessage(
      { verdict: 'UNKNOWN', discount: null, isLowestRecent: false },
      msg('price.notEnough'),
    );
  }

  const discount = round2(1 - unitPrice / summary.typicalUnitPrice);
  const isLowestRecent =
    summary.lowestRecent !== null && unitPrice <= summary.lowestRecent.unitPrice;
  const values = {
    percent: Math.round(Math.abs(discount) * 100),
    usual: money(summary.typicalUnitPrice, summary.currency),
    per,
    lowest: isLowestRecent ? 1 : 0,
  };

  if (discount >= config.greatDiscount || (isLowestRecent && discount >= config.goodDiscount)) {
    return withMessage({ verdict: 'GREAT', discount, isLowestRecent }, msg('price.great', values));
  }
  if (discount >= config.goodDiscount) {
    return withMessage({ verdict: 'GOOD', discount, isLowestRecent }, msg('price.good', values));
  }
  if (discount <= -config.expensiveMarkup) {
    return withMessage({ verdict: 'EXPENSIVE', discount, isLowestRecent }, msg('price.expensive', values));
  }

  return withMessage({ verdict: 'NORMAL', discount, isLowestRecent }, msg('price.normal', values));
};

export type StockUpPlan = {
  // Recommended amount in the product unit, rounded up to whole packs.
  quantity: number;
  coversDays: number;
  // Estimated saving against the usual price, or null if unknown.
  saving: number | null;
  reason: string;
  reasonMessage: Message;
};

// How much to buy at this price. Cheap prices justify covering more days,
// bounded by shelf life and storage; normal prices cover one usual cycle.
export const planStockUp = (
  input: {
    ratePerDay: number | null;
    usualDurationDays: number | null;
    packSize: number | null;
    shelfLifeDays: number | null;
    maxStockDays?: number | null;
    judgement: PriceJudgement;
    unitPrice: number;
    typicalUnitPrice: number | null;
    unit: string | null;
    currency: string | null;
  },
  config: PriceConfig = PRICE_CONFIG,
): StockUpPlan | null => {
  const { ratePerDay, judgement } = input;

  if (ratePerDay === null || ratePerDay <= 0) {
    return null;
  }

  const cycle = Math.max(1, input.usualDurationDays ?? 14);
  const storageLimit = input.maxStockDays ?? config.defaultMaxStockDays;
  const maxDays = Math.min(storageLimit, input.shelfLifeDays ?? Number.POSITIVE_INFINITY);
  const wanted =
    judgement.verdict === 'GREAT'
      ? cycle * 4
      : judgement.verdict === 'GOOD'
        ? cycle * 2
        : cycle;
  const coverDays = Math.max(1, Math.min(wanted, maxDays));
  const pack = input.packSize && input.packSize > 0 ? input.packSize : 1;
  const quantity = Math.max(pack, Math.ceil((ratePerDay * coverDays) / pack) * pack);
  const coversDays = Math.round(quantity / ratePerDay);
  const saving =
    input.typicalUnitPrice !== null && input.typicalUnitPrice > input.unitPrice
      ? round2((input.typicalUnitPrice - input.unitPrice) * quantity)
      : null;
  const limit =
    coverDays < wanted
      ? input.shelfLifeDays !== null && input.shelfLifeDays <= storageLimit
        ? 1
        : 2
      : 0;
  const message =
    judgement.verdict === 'GREAT' || judgement.verdict === 'GOOD'
      ? msg('stock.good', {
          amount: amount(quantity, input.unit, { plural: true }),
          days: coversDays,
          limit,
          saving: saving !== null ? money(saving, input.currency) : '',
        })
      : msg('stock.normal', { amount: amount(quantity, input.unit, { plural: true }), days: coversDays });

  return {
    quantity: round2(quantity),
    coversDays,
    saving,
    reason: renderMessage(message, 'en'),
    reasonMessage: message,
  };
};

// Returns the points that satisfy a "tell me below X" alert, newest first.
export const matchPriceAlert = (
  maxUnitPrice: number | null,
  points: PricePoint[],
  now: Date,
  withinDays = 14,
): PricePoint[] =>
  maxUnitPrice === null
    ? []
    : points
        .filter((p) => p.unitPrice <= maxUnitPrice && daysBetween(p.observedAt, now) <= withinDays && p.observedAt <= now)
        .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime());
