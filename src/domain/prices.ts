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
};

// Is this unit price a good deal for this household?
export const judgePrice = (
  unitPrice: number,
  summary: PriceSummary,
  unit: string | null,
  config: PriceConfig = PRICE_CONFIG,
): PriceJudgement => {
  const per = unit ? `/${unit}` : '';

  if (summary.typicalUnitPrice === null || summary.pointCount < config.minPoints) {
    return {
      verdict: 'UNKNOWN',
      discount: null,
      isLowestRecent: false,
      reason: 'Not enough prices yet to say whether this is cheap. Every price you log helps.',
    };
  }

  const discount = round2(1 - unitPrice / summary.typicalUnitPrice);
  const isLowestRecent =
    summary.lowestRecent !== null && unitPrice <= summary.lowestRecent.unitPrice;
  const usual = `usually ${formatMoney(summary.typicalUnitPrice, summary.currency)}${per}`;
  const percent = Math.round(Math.abs(discount) * 100);

  if (discount >= config.greatDiscount || (isLowestRecent && discount >= config.goodDiscount)) {
    return {
      verdict: 'GREAT',
      discount,
      isLowestRecent,
      reason: `${percent}% below your usual price (${usual})${isLowestRecent ? ' — lowest in 90 days' : ''}.`,
    };
  }
  if (discount >= config.goodDiscount) {
    return { verdict: 'GOOD', discount, isLowestRecent, reason: `${percent}% below your usual price (${usual}).` };
  }
  if (discount <= -config.expensiveMarkup) {
    return { verdict: 'EXPENSIVE', discount, isLowestRecent, reason: `${percent}% above your usual price (${usual}).` };
  }

  return { verdict: 'NORMAL', discount, isLowestRecent, reason: `About your usual price (${usual}).` };
};

export type StockUpPlan = {
  // Recommended amount in the product unit, rounded up to whole packs.
  quantity: number;
  coversDays: number;
  // Estimated saving against the usual price, or null if unknown.
  saving: number | null;
  reason: string;
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
  const limit = Math.min(storageLimit, input.shelfLifeDays ?? Number.POSITIVE_INFINITY);
  const wanted =
    judgement.verdict === 'GREAT'
      ? cycle * 4
      : judgement.verdict === 'GOOD'
        ? cycle * 2
        : cycle;
  const coverDays = Math.max(1, Math.min(wanted, limit));
  const pack = input.packSize && input.packSize > 0 ? input.packSize : 1;
  const quantity = Math.max(pack, Math.ceil((ratePerDay * coverDays) / pack) * pack);
  const coversDays = Math.round(quantity / ratePerDay);
  const saving =
    input.typicalUnitPrice !== null && input.typicalUnitPrice > input.unitPrice
      ? round2((input.typicalUnitPrice - input.unitPrice) * quantity)
      : null;
  const amount = formatAmountWithUnit(quantity, input.unit);
  const limitNote =
    coverDays < wanted
      ? input.shelfLifeDays !== null && input.shelfLifeDays <= storageLimit
        ? ' (limited by shelf life)'
        : ' (limited by storage)'
      : '';
  const reason =
    judgement.verdict === 'GREAT' || judgement.verdict === 'GOOD'
      ? `Good price: buy ${amount} — lasts about ${coversDays} days${limitNote}${saving !== null ? `, saves about ${formatMoney(saving, input.currency)}` : ''}.`
      : `Buy ${amount} — enough for about ${coversDays} days. Not worth stocking up at this price.`;

  return { quantity: round2(quantity), coversDays, saving, reason };
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
