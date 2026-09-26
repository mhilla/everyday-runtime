import type {
  NeedAssessment,
  ObservationType,
  ProductCategory,
} from 'src/domain/types';

export type NeedTone = 'confirmed' | 'high' | 'medium' | 'low' | 'unknown';

export type NeedHeadline = {
  label: string;
  tone: NeedTone;
  // Direct reports (empty, needed, bought, seen) are confirmed information;
  // everything else is an estimate and must be shown as such.
  isEstimate: boolean;
};

export const describeNeed = (assessment: NeedAssessment): NeedHeadline => {
  const { state, needScore, basis } = assessment;

  if (state === 'UNKNOWN') {
    return { label: 'Not enough data yet', tone: 'unknown', isEstimate: true };
  }

  if (state === 'CONFIRMED') {
    if (basis === 'MARKED_EMPTY') {
      return { label: 'Empty', tone: 'confirmed', isEstimate: false };
    }
    if (basis === 'MANUAL_NEED') {
      return { label: 'Needed', tone: 'confirmed', isEstimate: false };
    }

    return { label: 'In stock', tone: 'low', isEstimate: false };
  }

  if (basis === 'CONFLICT') {
    return { label: 'Unclear — please check', tone: 'medium', isEstimate: true };
  }

  if (needScore >= 0.8) {
    return {
      label: state === 'LIKELY' ? 'Probably low' : 'Possibly low',
      tone: 'high',
      isEstimate: true,
    };
  }
  if (needScore >= 0.6) {
    return {
      label: state === 'LIKELY' ? 'Likely getting low' : 'Possibly getting low',
      tone: 'medium',
      isEstimate: true,
    };
  }
  if (needScore >= 0.4) {
    return { label: 'Maybe soon', tone: 'low', isEstimate: true };
  }

  return { label: 'Probably fine', tone: 'low', isEstimate: true };
};

// Percentages are shown as whole numbers only; anything more precise would
// suggest an accuracy the engine does not have.
export const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export const describeConfidence = (confidence: number): string => {
  if (confidence >= 0.8) {
    return 'high confidence';
  }
  if (confidence >= 0.55) {
    return 'medium confidence';
  }
  if (confidence >= 0.25) {
    return 'low confidence';
  }

  return 'very little evidence';
};

export const greetingForHour = (hour: number): string => {
  if (hour < 5) {
    return 'Good night';
  }
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 18) {
    return 'Good afternoon';
  }

  return 'Good evening';
};

export const OBSERVATION_LABELS: Record<ObservationType, string> = {
  PURCHASED: 'Bought',
  CONSUMED: 'Used some',
  EMPTY: 'Marked empty',
  SEEN_IN_STOCK: 'Still have it',
  MANUAL_NEED: 'Added as needed',
};

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  DAIRY: 'Dairy',
  BAKERY: 'Bakery',
  PRODUCE: 'Fruit & vegetables',
  PANTRY: 'Pantry',
  BEVERAGES: 'Beverages',
  FROZEN: 'Frozen',
  HOUSEHOLD: 'Household',
  PERSONAL_CARE: 'Personal care',
  OTHER: 'Other',
};

export const summarizeCount = (count: number): string => {
  if (count === 0) {
    return 'Nothing needed right now';
  }
  if (count === 1) {
    return '1 thing probably needed';
  }

  return `${count} things probably needed`;
};

// Coarse on purpose: a rate derived from a few purchases is an estimate.
export const formatRate = (ratePerDay: number, unit: string | null) => {
  const rounded =
    ratePerDay >= 10
      ? Math.round(ratePerDay)
      : ratePerDay >= 0.1
        ? Math.round(ratePerDay * 10) / 10
        : Math.round(ratePerDay * 100) / 100;

  return unit ? `~${rounded} ${unit}` : `~${rounded}`;
};

export const formatQuantity = (quantity: number, unit: string | null) => {
  const rounded = Math.round(quantity * 100) / 100;

  return unit ? `${rounded} ${unit}` : `${rounded}`;
};
