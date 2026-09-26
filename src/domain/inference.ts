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
  // Quantity-aware durations stay within these multiples of the buying rhythm.
  minQuantityDurationFactor: 0.25,
  maxQuantityDurationFactor: 4,
  // Reported consumption with quantities can move the run-out up to this share.
  maxQuantityConsumptionAdvance: 0.9,
  // Learning from corrections: how many past reports count, how many give
  // full weight, the allowed range and the dead band around "no change".
  maxCalibrationSignals: 4,
  calibrationFullWeightSignals: 2,
  minCalibrationFactor: 0.5,
  maxCalibrationFactor: 2,
  calibrationDeadband: 0.1,
  // The reason line mentions the expected duration instead of the buying
  // rhythm once they differ by at least this share.
  reasonDurationDifference: 0.15,
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
  // Total quantity bought per trip; null when any purchase lacked a quantity.
  tripQuantities: (number | null)[];
  intervals: number[];
  typicalIntervalDays: number | null;
  variation: number | null;
  // Median of quantity bought / days until the next trip, over recent trips.
  typicalRatePerDay: number | null;
};

const addQuantities = (a: number | null, b: number | null) =>
  a === null || b === null ? null : a + b;

// Groups PURCHASED observations into shopping trips and derives the recent
// buying rhythm. Median + coefficient of variation keep single outliers
// (holidays, a guest visit) from dominating the estimate.
export const analysePurchases = (
  sortedObservations: Observation[],
  config: InferenceConfig = INFERENCE_CONFIG,
): PurchaseHistory => {
  const trips: Date[] = [];
  const tripQuantities: (number | null)[] = [];
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
      tripQuantities[tripQuantities.length - 1] = addQuantities(
        tripQuantities[tripQuantities.length - 1],
        observation.quantity,
      );
    } else {
      tripStart = observation.observedAt;
      trips.push(observation.observedAt);
      tripQuantities.push(observation.quantity);
    }
  }

  const intervals: number[] = [];
  const rates: number[] = [];

  for (let index = 1; index < trips.length; index++) {
    const days = daysBetween(trips[index - 1], trips[index]);
    const quantity = tripQuantities[index - 1];

    intervals.push(days);
    if (quantity !== null && quantity > 0 && days >= 0.5) {
      rates.push(quantity / days);
    }
  }

  const recentIntervals = intervals.slice(-config.maxIntervalsConsidered);

  return {
    trips,
    tripQuantities,
    intervals: recentIntervals,
    typicalIntervalDays: median(recentIntervals),
    variation: coefficientOfVariation(recentIntervals),
    typicalRatePerDay: median(rates.slice(-config.maxIntervalsConsidered)),
  };
};

// How long one purchase is expected to last. With quantities and a known
// consumption rate, 3 l last three times as long as 1 l; otherwise the buying
// rhythm is used. Bounded so a single odd quantity cannot run away.
export const expectedDurationFor = (
  quantity: number | null,
  history: PurchaseHistory,
  rhythmDays: number,
  config: InferenceConfig = INFERENCE_CONFIG,
): number => {
  if (quantity === null || quantity <= 0 || history.typicalRatePerDay === null) {
    return rhythmDays;
  }

  return clamp(
    quantity / history.typicalRatePerDay,
    rhythmDays * config.minQuantityDurationFactor,
    rhythmDays * config.maxQuantityDurationFactor,
  );
};

export type Calibration = {
  // Multiplier applied to the expected duration (1 = no change).
  factor: number;
  signalCount: number;
};

// Learns from past corrections. In every completed purchase cycle, an "Empty"
// report tells how long the purchase really lasted, and a "Still have it"
// report later than expected tells it lasted at least that long. The median
// ratio of actual to expected duration becomes a bounded multiplier; a
// single report counts half. The current cycle is never used here — its
// reports are handled directly by the main rules.
export const estimateCalibration = (
  sortedObservations: Observation[],
  history: PurchaseHistory,
  rhythmDays: number,
  config: InferenceConfig = INFERENCE_CONFIG,
): Calibration | null => {
  const ratios: number[] = [];

  for (let index = 0; index + 1 < history.trips.length; index++) {
    const start = history.trips[index];
    const end = history.trips[index + 1];
    const expected = expectedDurationFor(
      history.tripQuantities[index],
      history,
      rhythmDays,
      config,
    );
    const inCycle = sortedObservations.filter(
      (o) => o.observedAt > start && o.observedAt <= end && o.type !== 'PURCHASED',
    );
    const empty = inCycle.find((o) => o.type === 'EMPTY');

    if (empty) {
      ratios.push(daysBetween(start, empty.observedAt) / expected);
      continue;
    }

    const lastSighting = lastOf(inCycle, ['SEEN_IN_STOCK']);

    if (lastSighting && daysBetween(start, lastSighting.observedAt) > expected) {
      ratios.push(daysBetween(start, lastSighting.observedAt) / expected);
    }
  }

  const recent = ratios.slice(-config.maxCalibrationSignals);
  const typical = median(recent);

  if (typical === null) {
    return null;
  }

  const weight = Math.min(1, recent.length / config.calibrationFullWeightSignals);
  const factor = clamp(
    1 + (typical - 1) * weight,
    config.minCalibrationFactor,
    config.maxCalibrationFactor,
  );

  if (Math.abs(factor - 1) < config.calibrationDeadband) {
    return null;
  }

  return { factor: round2(factor), signalCount: recent.length };
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
  duration?: {
    expectedDurationDays: number;
    consumptionRatePerDay: number | null;
    calibrationFactor: number | null;
  };
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
    expectedDurationDays: draft.duration
      ? round2(draft.duration.expectedDurationDays)
      : null,
    consumptionRatePerDay:
      draft.duration?.consumptionRatePerDay === null ||
      draft.duration?.consumptionRatePerDay === undefined
        ? null
        : Math.round(draft.duration.consumptionRatePerDay * 1000) / 1000,
    calibrationFactor: draft.duration?.calibrationFactor ?? null,
  };
};

const formatAmount = (value: number, unit: string | null) => {
  const rounded =
    value >= 10
      ? Math.round(value)
      : value >= 0.1
        ? Math.round(value * 10) / 10
        : Math.round(value * 100) / 100;

  return unit ? `${rounded} ${unit}` : `${rounded}`;
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
export type AssessmentContext = {
  // Unit of the product ("l", "pack"), only used in explanations.
  unit?: string | null;
};

export const assessProduct = (
  observations: Observation[],
  now: Date,
  config: InferenceConfig = INFERENCE_CONFIG,
  context: AssessmentContext = {},
): NeedAssessment => {
  const unit = context.unit ?? null;
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
  const rhythm = Math.max(
    1,
    history.typicalIntervalDays ?? config.defaultIntervalDays,
  );
  const lastQuantity = lastItem(history.tripQuantities);
  const usesQuantity =
    hasPattern &&
    lastQuantity !== null &&
    lastQuantity > 0 &&
    history.typicalRatePerDay !== null;
  const quantityDuration = hasPattern
    ? expectedDurationFor(lastQuantity, history, rhythm, config)
    : rhythm;
  const calibration = hasPattern
    ? estimateCalibration(valid, history, rhythm, config)
    : null;
  // Expected duration of the current purchase; everything below uses it.
  const interval = Math.max(1, quantityDuration * (calibration?.factor ?? 1));
  const durationDiffers =
    Math.abs(interval - rhythm) / rhythm >= config.reasonDurationDifference;
  const durationPhrase = !durationDiffers
    ? `usual interval ${formatInterval(rhythm)}`
    : usesQuantity && lastQuantity !== null
      ? `${formatAmount(lastQuantity, unit)} usually lasts ${formatInterval(interval)}`
      : `usually lasts ${formatInterval(interval)}`;
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

  if (usesQuantity && lastQuantity !== null && history.typicalRatePerDay !== null) {
    factors.push(
      `Bought ${formatAmount(lastQuantity, unit)} last time and you use about ${formatAmount(history.typicalRatePerDay, unit)} per day, so it should last ${formatInterval(quantityDuration)}.`,
    );
  }

  if (calibration) {
    const percent = Math.round(Math.abs(calibration.factor - 1) * 100);
    const reports =
      calibration.signalCount === 1
        ? 'one earlier “Empty”/“Still have it” report'
        : `${calibration.signalCount} earlier “Empty”/“Still have it” reports`;

    factors.push(
      `Learned from ${reports}: it usually lasts about ${percent}% ${calibration.factor < 1 ? 'less' : 'longer'} than expected, so the estimate is adjusted to ${formatInterval(interval)}.`,
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

  const consumptions = valid.filter(
    (o) => o.type === 'CONSUMED' && o.observedAt > lastPurchase,
  );
  const consumedSincePurchase = consumptions.length;
  // With quantities on both sides the share used is known exactly;
  // otherwise each report counts as a fixed share of an interval.
  const consumedQuantity =
    lastQuantity !== null &&
    lastQuantity > 0 &&
    consumptions.every((o) => o.quantity !== null)
      ? consumptions.reduce((sum, o) => sum + (o.quantity ?? 0), 0)
      : null;

  if (consumedSincePurchase > 0) {
    const advance =
      consumedQuantity !== null && lastQuantity !== null
        ? Math.min(config.maxQuantityConsumptionAdvance, consumedQuantity / lastQuantity)
        : Math.min(
            config.maxConsumptionAdvance,
            consumedSincePurchase * config.consumptionAdvanceFraction,
          );

    expectedRunOut = addDays(expectedRunOut, -advance * interval);
    factors.push(
      consumedQuantity !== null && lastQuantity !== null
        ? `Used ${formatAmount(consumedQuantity, unit)} of ${formatAmount(lastQuantity, unit)} since the last purchase, so it may run out sooner.`
        : `Used ${consumedSincePurchase === 1 ? 'once' : `${consumedSincePurchase} times`} since the last purchase, so it may run out sooner.`,
    );
  }

  const duration = hasPattern
    ? {
        expectedDurationDays: interval,
        consumptionRatePerDay: usesQuantity ? history.typicalRatePerDay : null,
        calibrationFactor: calibration?.factor ?? null,
      }
    : undefined;

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
        reason: hasPattern ? `Bought ${purchaseAgo} · ${durationPhrase}` : `Bought ${purchaseAgo}`,
        factors,
        duration,
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
        duration,
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
      ? `Seen in stock ${formatAgo(sightingAfterPurchase.observedAt, now)} · ${durationPhrase}`
      : hasPattern
        ? `Last purchased ${purchaseAgo} · ${durationPhrase}`
        : `Last purchased ${purchaseAgo} · only one purchase so far`;

  return finalize(
    {
      basis: hasPattern ? 'PURCHASE_PATTERN' : 'SINGLE_PURCHASE',
      state: stateFromConfidence(confidence),
      confidence,
      needScore,
      reason,
      factors,
      duration,
    },
    history,
    ignoredFutureCount,
    config,
  );
};
