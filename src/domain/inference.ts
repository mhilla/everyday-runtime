import {
  addDays,
  clamp,
  coefficientOfVariation,
  daysBetween,
  formatAgo,
  formatInterval,
  lastItem,
  MS_PER_HOUR,
  median,
} from 'src/domain/time';
import type {
  AssessmentBasis,
  NeedAssessment,
  NeedState,
  Observation,
  ObservationType,
} from 'src/domain/types';

// Every tunable number of the engine lives here, so behaviour changes are
// explicit, reviewable and covered by tests.
export const INFERENCE_CONFIG = {
  // needScore at or above which a product is considered worth buying.
  needThreshold: 0.6,
  // Purchases closer together than this are one shopping trip.
  purchaseMergeWindowHours: 12,
  // Only the most recent intervals describe current habits.
  maxIntervalsConsidered: 6,
  // A purchase this young means "we have it" regardless of history.
  freshPurchaseDays: 2,
  // A sighting this young means "we have it" regardless of history.
  freshSightingDays: 1,
  // EMPTY / MANUAL_NEED count as confirmed for this long ...
  directSignalConfirmedDays: 3,
  // ... and afterwards lose half of their weight every this many days.
  directSignalHalfLifeDays: 21,
  // Opposite reports closer together than this are treated as a conflict.
  conflictWindowHours: 24,
  // Prior interval used when only one purchase is known.
  defaultIntervalDays: 14,
  // Seeing a product in stock means roughly this share of an interval is left.
  sightingRemainingFraction: 0.5,
  // Each CONSUMED report brings the expected run-out forward by this share
  // of an interval (capped at maxConsumptionAdvance).
  consumptionAdvanceFraction: 0.15,
  maxConsumptionAdvance: 0.5,
  // A purchase pattern older than this many intervals starts to lose weight.
  staleAfterIntervals: 3,
  // Evidence older than this many days starts to lose weight in any case.
  staleAfterDays: 120,
  // Shape of the need curve around the expected run-out date.
  curveSteepness: 6,
  curveMidpoint: 0.9,
  // Observations dated further in the future than this are ignored.
  futureToleranceMinutes: 5,
} as const;

export type InferenceConfig = typeof INFERENCE_CONFIG;

const NEED_TYPES: ObservationType[] = ['EMPTY', 'MANUAL_NEED'];

// Stable ordering for observations sharing the same timestamp: a purchase or
// sighting recorded "at the same time" as an empty report is assumed to come
// after it (you notice it's empty, then you buy it).
const TYPE_ORDER: Record<ObservationType, number> = {
  CONSUMED: 0,
  EMPTY: 1,
  MANUAL_NEED: 2,
  SEEN_IN_STOCK: 3,
  PURCHASED: 4,
};

const round2 = (value: number) => Math.round(value * 100) / 100;

const sigmoid = (value: number) => 1 / (1 + Math.exp(-value));

export const stateFromConfidence = (confidence: number): NeedState => {
  if (confidence >= 0.6) {
    return 'LIKELY';
  }
  if (confidence >= 0.25) {
    return 'POSSIBLE';
  }

  return 'UNKNOWN';
};

type PurchaseHistory = {
  trips: Date[];
  intervals: number[];
  typicalIntervalDays: number | null;
  variation: number | null;
};

// Groups PURCHASED observations into shopping trips and derives the recent
// buying rhythm. Median + coefficient of variation keep single outliers
// (holidays, a guest visit) from dominating the estimate.
export const analysePurchases = (
  sortedObservations: Observation[],
  config: InferenceConfig = INFERENCE_CONFIG,
): PurchaseHistory => {
  const trips: Date[] = [];
  let tripStart: Date | null = null;

  for (const observation of sortedObservations) {
    if (observation.type !== 'PURCHASED') {
      continue;
    }

    const isSameTrip =
      tripStart !== null &&
      observation.observedAt.getTime() - tripStart.getTime() <=
        config.purchaseMergeWindowHours * MS_PER_HOUR;

    if (isSameTrip) {
      trips[trips.length - 1] = observation.observedAt;
    } else {
      tripStart = observation.observedAt;
      trips.push(observation.observedAt);
    }
  }

  const intervals: number[] = [];

  for (let index = 1; index < trips.length; index++) {
    intervals.push(daysBetween(trips[index - 1], trips[index]));
  }

  const recentIntervals = intervals.slice(-config.maxIntervalsConsidered);

  return {
    trips,
    intervals: recentIntervals,
    typicalIntervalDays: median(recentIntervals),
    variation: coefficientOfVariation(recentIntervals),
  };
};

const sortObservations = (observations: Observation[]) =>
  [...observations].sort(
    (a, b) =>
      a.observedAt.getTime() - b.observedAt.getTime() ||
      TYPE_ORDER[a.type] - TYPE_ORDER[b.type] ||
      a.id.localeCompare(b.id),
  );

const lastOf = (
  observations: Observation[],
  types: ObservationType[],
): Observation | null => {
  for (let index = observations.length - 1; index >= 0; index--) {
    if (types.includes(observations[index].type)) {
      return observations[index];
    }
  }

  return null;
};

type Draft = {
  basis: AssessmentBasis;
  state: NeedState;
  confidence: number;
  needScore: number;
  reason: string;
  factors: string[];
};

const finalize = (
  draft: Draft,
  history: PurchaseHistory,
  ignoredFutureCount: number,
  config: InferenceConfig,
): NeedAssessment => {
  const needScore = round2(clamp(draft.needScore));
  const confidence = round2(clamp(draft.confidence));
  const factors = [...draft.factors];

  if (ignoredFutureCount > 0) {
    factors.push(
      `Ignored ${ignoredFutureCount} observation${ignoredFutureCount === 1 ? '' : 's'} dated in the future.`,
    );
  }

  return {
    state: draft.state,
    confidence,
    needScore,
    needsShopping: draft.state !== 'UNKNOWN' && needScore >= config.needThreshold,
    basis: draft.basis,
    reason: draft.reason,
    factors,
    lastPurchasedAt: lastItem(history.trips),
    typicalIntervalDays:
      history.typicalIntervalDays === null
        ? null
        : round2(history.typicalIntervalDays),
    purchaseCount: history.trips.length,
  };
};

const describeRegularity = (history: PurchaseHistory): string | null => {
  if (history.typicalIntervalDays === null) {
    return null;
  }
  if (history.variation === null) {
    return `Only one interval so far (${formatInterval(history.typicalIntervalDays)}), so the rhythm is a first guess.`;
  }
  if (history.variation <= 0.25) {
    return `Purchases are regular: usually every ${formatInterval(history.typicalIntervalDays)}.`;
  }

  const shortest = Math.min(...history.intervals);
  const longest = Math.max(...history.intervals);

  return `Purchases are irregular (between ${formatInterval(shortest).slice(1)} and ${formatInterval(longest).slice(1)} apart), so this is a rough estimate.`;
};

// Estimates whether one product needs to be bought, from its observations
// only. Pure and deterministic: same input, same output — `now` is explicit.
export const assessProduct = (
  observations: Observation[],
  now: Date,
  config: InferenceConfig = INFERENCE_CONFIG,
): NeedAssessment => {
  const futureLimit = now.getTime() + config.futureToleranceMinutes * 60_000;
  const valid = sortObservations(
    observations.filter((o) => o.observedAt.getTime() <= futureLimit),
  );
  const ignoredFutureCount = observations.length - valid.length;
  const history = analysePurchases(valid, config);

  if (valid.length === 0) {
    return finalize(
      {
        basis: 'NO_DATA',
        state: 'UNKNOWN',
        confidence: 0,
        needScore: 0,
        reason: 'No history yet',
        factors: [
          'Nothing has been recorded for this product yet. Mark it as bought, empty or in stock to start learning.',
        ],
      },
      history,
      ignoredFutureCount,
      config,
    );
  }

  const latestNeed = lastOf(valid, NEED_TYPES);
  const latestSighting = lastOf(valid, ['SEEN_IN_STOCK']);
  const lastPurchase = lastItem(history.trips);
  const latestHaveTime = Math.max(
    lastPurchase?.getTime() ?? -Infinity,
    latestSighting?.observedAt.getTime() ?? -Infinity,
  );

  // 1. A direct "we need it" report that nothing has contradicted since.
  if (latestNeed && latestNeed.observedAt.getTime() > latestHaveTime) {
    const isEmpty = latestNeed.type === 'EMPTY';
    const base = isEmpty ? 0.95 : 0.9;
    const age = daysBetween(latestNeed.observedAt, now);
    const freshness =
      age <= config.directSignalConfirmedDays
        ? 1
        : 0.5 **
          ((age - config.directSignalConfirmedDays) /
            config.directSignalHalfLifeDays);
    const confidence = 0.95 * freshness;
    const ago = formatAgo(latestNeed.observedAt, now);
    const factors = [
      isEmpty
        ? `Marked empty ${ago} — a direct report, so it counts as confirmed.`
        : `Added as needed ${ago} — a direct request, so it counts as confirmed.`,
    ];

    if (freshness < 1) {
      factors.push(
        'That report is getting old and nothing was bought since, so the estimate is less certain.',
      );
    }

    return finalize(
      {
        basis: isEmpty ? 'MARKED_EMPTY' : 'MANUAL_NEED',
        state:
          age <= config.directSignalConfirmedDays
            ? 'CONFIRMED'
            : stateFromConfidence(confidence),
        confidence,
        needScore: 0.5 + (base - 0.5) * freshness,
        reason: isEmpty ? `Marked empty ${ago}` : `Added as needed ${ago}`,
        factors,
      },
      history,
      ignoredFutureCount,
      config,
    );
  }

  // 2. A need report followed shortly by a sighting, without a purchase in
  //    between: someone is probably mistaken. Latest report wins, but only
  //    weakly — the product stays visible as "possible" instead of flipping.
  if (
    latestNeed &&
    latestSighting &&
    latestSighting.observedAt > latestNeed.observedAt &&
    (lastPurchase === null || lastPurchase < latestNeed.observedAt) &&
    latestSighting.observedAt.getTime() - latestNeed.observedAt.getTime() <=
      config.conflictWindowHours * MS_PER_HOUR
  ) {
    const needLabel =
      latestNeed.type === 'EMPTY' ? 'marked empty' : 'added as needed';

    return finalize(
      {
        basis: 'CONFLICT',
        state: 'POSSIBLE',
        confidence: 0.35,
        needScore: 0.6 * 0.15 + 0.4 * 0.95,
        reason: `Conflicting reports: ${needLabel} ${formatAgo(latestNeed.observedAt, now)}, then seen in stock`,
        factors: [
          `It was ${needLabel} ${formatAgo(latestNeed.observedAt, now)}, but seen in stock ${formatAgo(latestSighting.observedAt, now)} with no purchase in between.`,
          'The most recent report weighs more, but confidence is low until someone checks again.',
        ],
      },
      history,
      ignoredFutureCount,
      config,
    );
  }

  // 3. No purchase recorded yet: only sightings and/or consumption.
  if (lastPurchase === null) {
    if (latestSighting === null) {
      return finalize(
        {
          basis: 'NO_DATA',
          state: 'UNKNOWN',
          confidence: 0.15,
          needScore: 0.4,
          reason: 'Used recently, but no purchases recorded yet',
          factors: [
            'Only consumption was recorded. Record a purchase or mark it empty to get an estimate.',
          ],
        },
        history,
        ignoredFutureCount,
        config,
      );
    }

    const age = daysBetween(latestSighting.observedAt, now);
    const ago = formatAgo(latestSighting.observedAt, now);

    if (age <= config.freshSightingDays) {
      return finalize(
        {
          basis: 'SEEN_IN_STOCK',
          state: 'CONFIRMED',
          confidence: 0.85,
          needScore: 0.1,
          reason: `Seen in stock ${ago}`,
          factors: [`Seen in stock ${ago}, so it is very likely still there.`],
        },
        history,
        ignoredFutureCount,
        config,
      );
    }

    const expected = config.defaultIntervalDays * config.sightingRemainingFraction;
    const overdue = (age - expected) / config.defaultIntervalDays;

    return finalize(
      {
        basis: 'SEEN_IN_STOCK',
        state: 'POSSIBLE',
        confidence: 0.3,
        needScore:
          0.5 +
          (sigmoid(
            config.curveSteepness * (overdue + (1 - config.curveMidpoint)),
          ) -
            0.5) *
            0.5,
        reason: `Seen in stock ${ago} · no purchase history yet`,
        factors: [
          `Seen in stock ${ago}.`,
          'Without any recorded purchase the engine can only guess how fast it is used.',
        ],
      },
      history,
      ignoredFutureCount,
      config,
    );
  }

  // 4. Purchase-based estimate: when should the last purchase run out?
  const purchaseAge = daysBetween(lastPurchase, now);
  const purchaseAgo = formatAgo(lastPurchase, now);
  const hasPattern = history.typicalIntervalDays !== null;
  const interval = Math.max(
    1,
    history.typicalIntervalDays ?? config.defaultIntervalDays,
  );
  const factors: string[] = [];

  if (hasPattern) {
    factors.push(
      `Based on ${history.trips.length} purchases, last one ${purchaseAgo}.`,
    );
    const regularity = describeRegularity(history);

    if (regularity) {
      factors.push(regularity);
    }
  } else {
    factors.push(
      `Only one purchase so far (${purchaseAgo}); assuming a typical rhythm of ${formatInterval(config.defaultIntervalDays)} until there is more history.`,
    );
  }

  let expectedRunOut = addDays(lastPurchase, interval);
  const sightingAfterPurchase =
    latestSighting && latestSighting.observedAt > lastPurchase
      ? latestSighting
      : null;

  if (sightingAfterPurchase) {
    const pushedRunOut = addDays(
      sightingAfterPurchase.observedAt,
      interval * config.sightingRemainingFraction,
    );

    if (pushedRunOut > expectedRunOut) {
      expectedRunOut = pushedRunOut;
    }
    factors.push(
      `Seen in stock ${formatAgo(sightingAfterPurchase.observedAt, now)}, which pushes the estimate back.`,
    );
  }

  const consumedSincePurchase = valid.filter(
    (o) => o.type === 'CONSUMED' && o.observedAt > lastPurchase,
  ).length;

  if (consumedSincePurchase > 0) {
    const advance = Math.min(
      config.maxConsumptionAdvance,
      consumedSincePurchase * config.consumptionAdvanceFraction,
    );

    expectedRunOut = addDays(expectedRunOut, -advance * interval);
    factors.push(
      `Used ${consumedSincePurchase === 1 ? 'once' : `${consumedSincePurchase} times`} since the last purchase, so it may run out sooner.`,
    );
  }

  const daysPastRunOut = daysBetween(expectedRunOut, now);

  factors.push(
    daysPastRunOut >= 0
      ? `Expected to have run out ${formatAgo(expectedRunOut, now).replace('today', 'about now')}.`
      : `Expected to last about ${Math.max(1, Math.round(-daysPastRunOut))} more day${Math.round(-daysPastRunOut) === 1 ? '' : 's'}.`,
  );

  const curveNeed = sigmoid(
    config.curveSteepness *
      (daysPastRunOut / interval + (1 - config.curveMidpoint)),
  );

  // Fresh, direct evidence of stock overrides the curve.
  if (purchaseAge <= config.freshPurchaseDays) {
    return finalize(
      {
        basis: 'RECENT_PURCHASE',
        state: 'CONFIRMED',
        confidence: 0.9,
        needScore: Math.min(curveNeed, 0.05),
        reason: hasPattern
          ? `Bought ${purchaseAgo} · usual interval ${formatInterval(interval)}`
          : `Bought ${purchaseAgo}`,
        factors,
      },
      history,
      ignoredFutureCount,
      config,
    );
  }

  if (
    sightingAfterPurchase &&
    daysBetween(sightingAfterPurchase.observedAt, now) <= config.freshSightingDays
  ) {
    return finalize(
      {
        basis: 'SEEN_IN_STOCK',
        state: 'CONFIRMED',
        confidence: 0.85,
        needScore: Math.min(curveNeed, 0.1),
        reason: `Seen in stock ${formatAgo(sightingAfterPurchase.observedAt, now)} · last purchased ${purchaseAgo}`,
        factors,
      },
      history,
      ignoredFutureCount,
      config,
    );
  }

  let confidence: number;
  let needScore = curveNeed;

  if (hasPattern) {
    const sampleFactor = Math.min(0.95, 1 - 0.5 ** history.intervals.length);
    const regularityFactor =
      history.variation === null ? 0.85 : 1 / (1 + 1.5 * history.variation);

    confidence = sampleFactor * regularityFactor;
  } else {
    // A single purchase says little about the rhythm: keep both the
    // confidence and the need estimate close to "don't know".
    confidence = 0.3;
    needScore = 0.5 + (curveNeed - 0.5) * 0.6;
  }

  // Old evidence loses weight: long past the usual rhythm, or simply old.
  const evidenceAgeDays = daysBetween(
    new Date(Math.max(latestHaveTime, lastPurchase.getTime())),
    now,
  );
  const intervalsSincePurchase = purchaseAge / interval;
  let staleness = 1;

  if (intervalsSincePurchase > config.staleAfterIntervals) {
    staleness *= Math.exp(
      -(intervalsSincePurchase - config.staleAfterIntervals) / 2,
    );
  }
  if (evidenceAgeDays > config.staleAfterDays) {
    staleness *= Math.exp(-(evidenceAgeDays - config.staleAfterDays) / 60);
  }

  const isStale = staleness < 0.999;

  if (isStale) {
    confidence *= staleness;
    needScore = 0.5 + (needScore - 0.5) * staleness;
    factors.push(
      'The last evidence is old compared to the usual rhythm, so the estimate carries little weight.',
    );
  }

  const reason = isStale
    ? `Last purchased ${purchaseAgo} · pattern may be out of date`
    : sightingAfterPurchase
      ? `Seen in stock ${formatAgo(sightingAfterPurchase.observedAt, now)} · usual interval ${formatInterval(interval)}`
      : hasPattern
        ? `Last purchased ${purchaseAgo} · usual interval ${formatInterval(interval)}`
        : `Last purchased ${purchaseAgo} · only one purchase so far`;

  return finalize(
    {
      basis: hasPattern ? 'PURCHASE_PATTERN' : 'SINGLE_PURCHASE',
      state: stateFromConfidence(confidence),
      confidence,
      needScore,
      reason,
      factors,
    },
    history,
    ignoredFutureCount,
    config,
  );
};
