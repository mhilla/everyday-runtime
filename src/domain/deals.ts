import { judgePrice, matchPriceAlert, planStockUp, summarizePrices } from 'src/domain/prices';
import type { PriceJudgement, PricePoint, PriceSummary, StockUpPlan } from 'src/domain/prices';
import type { ProductOverview } from 'src/domain/shopping';
import { daysBetween } from 'src/domain/time';
import type { PriceObservation, Purchase } from 'src/domain/types';

// Turns purchases (with a price) and seen prices into comparable price
// points per unit of the product.
export const toPricePoints = (
  purchases: Purchase[],
  priceObservations: PriceObservation[],
): PricePoint[] => [
  ...purchases
    .filter((p) => p.priceAmount !== null && p.priceAmount > 0 && p.quantity > 0)
    .map((p) => ({
      productId: p.productId,
      unitPrice: (p.priceAmount as number) / p.quantity,
      currency: p.priceCurrency ?? 'EUR',
      store: p.store,
      observedAt: p.purchasedAt,
      source: 'PURCHASE' as const,
    })),
  ...priceObservations
    .filter((o) => o.priceAmount > 0 && o.packQuantity > 0)
    .map((o) => ({
      productId: o.productId,
      unitPrice: o.priceAmount / o.packQuantity,
      currency: o.priceCurrency,
      store: o.store,
      observedAt: o.observedAt,
      source: o.source,
    })),
];

export type ProductPrices = {
  points: PricePoint[];
  summary: PriceSummary;
};

export const pricesByProduct = (points: PricePoint[], now: Date) => {
  const groups = new Map<string, PricePoint[]>();

  for (const point of points) {
    groups.set(point.productId, [...(groups.get(point.productId) ?? []), point]);
  }

  const result = new Map<string, ProductPrices>();

  for (const [productId, productPoints] of groups) {
    result.set(productId, { points: productPoints, summary: summarizePrices(productPoints, now) });
  }

  return result;
};

export const DEAL_CONFIG = {
  // A seen price is "current" for this long.
  freshDays: 7,
  // Only show deals for things that will be needed within this horizon…
  maxDaysUntilRunOut: 21,
  // …or are already somewhat likely needed.
  minNeedScore: 0.4,
} as const;

export type Deal = {
  overview: ProductOverview;
  point: PricePoint;
  judgement: PriceJudgement;
  plan: StockUpPlan | null;
  alertTriggered: boolean;
};

const daysUntilRunOut = (overview: ProductOverview, now: Date): number | null => {
  const { lastPurchasedAt, expectedDurationDays } = overview.assessment;

  if (lastPurchasedAt === null || expectedDurationDays === null) {
    return null;
  }

  return expectedDurationDays - daysBetween(lastPurchasedAt, now);
};

// Current good prices for products the household will need soon, and
// prices that satisfy a price alert. Purchases are not "offers", so only
// seen prices (manual, receipt, community) count as current deals.
export const selectDeals = (
  overviews: ProductOverview[],
  prices: Map<string, ProductPrices>,
  now: Date,
  config = DEAL_CONFIG,
): Deal[] => {
  const deals: Deal[] = [];

  for (const overview of overviews) {
    const productPrices = prices.get(overview.product.id);

    if (!productPrices) {
      continue;
    }

    const fresh = productPrices.points
      .filter((p) => p.source !== 'PURCHASE' && p.observedAt <= now && daysBetween(p.observedAt, now) <= config.freshDays)
      .sort((a, b) => a.unitPrice - b.unitPrice);
    const best = fresh[0];

    if (!best) {
      continue;
    }

    const alertTriggered =
      matchPriceAlert(overview.product.priceAlertUnitPrice, [best], now, config.freshDays).length > 0;
    // Judge the offer against the *other* prices, so it does not lower its
    // own reference.
    const reference = summarizePrices(
      productPrices.points.filter((p) => p !== best),
      now,
    );
    const judgement = judgePrice(best.unitPrice, reference, overview.product.defaultUnit);
    const isGood = judgement.verdict === 'GOOD' || judgement.verdict === 'GREAT';
    const runOut = daysUntilRunOut(overview, now);
    const neededSoon =
      overview.assessment.needScore >= config.minNeedScore ||
      (runOut !== null && runOut <= config.maxDaysUntilRunOut);

    if (!alertTriggered && !(isGood && neededSoon)) {
      continue;
    }

    deals.push({
      overview,
      point: best,
      judgement,
      alertTriggered,
      plan: planStockUp({
        ratePerDay: overview.assessment.consumptionRatePerDay,
        usualDurationDays: overview.assessment.expectedDurationDays,
        packSize: overview.product.typicalPurchaseQuantity,
        shelfLifeDays: overview.product.shelfLifeDays,
        judgement,
        unitPrice: best.unitPrice,
        typicalUnitPrice: reference.typicalUnitPrice,
        unit: overview.product.defaultUnit,
        currency: best.currency,
      }),
    });
  }

  return deals.sort(
    (a, b) =>
      Number(b.alertTriggered) - Number(a.alertTriggered) ||
      (b.judgement.discount ?? 0) - (a.judgement.discount ?? 0) ||
      a.overview.product.name.localeCompare(b.overview.product.name),
  );
};
