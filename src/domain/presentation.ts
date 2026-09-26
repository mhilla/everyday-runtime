import type { Lang } from 'src/domain/messages';
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

const HEADLINES_DE: Record<string, string> = {
  'Not enough data yet': 'Noch zu wenig Daten',
  Empty: 'Leer',
  Needed: 'Benötigt',
  'In stock': 'Vorhanden',
  'Unclear — please check': 'Unklar — bitte nachsehen',
  'Probably low': 'Wahrscheinlich knapp',
  'Possibly low': 'Möglicherweise knapp',
  'Likely getting low': 'Wird wahrscheinlich knapp',
  'Possibly getting low': 'Wird möglicherweise knapp',
  'Maybe soon': 'Vielleicht bald',
  'Probably fine': 'Wahrscheinlich genug da',
};

export const describeNeed = (assessment: NeedAssessment, lang: Lang = 'en'): NeedHeadline => {
  const headline = describeNeedEn(assessment);

  return lang === 'de' ? { ...headline, label: HEADLINES_DE[headline.label] ?? headline.label } : headline;
};

const describeNeedEn = (assessment: NeedAssessment): NeedHeadline => {
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

export const describeConfidence = (confidence: number, lang: Lang = 'en'): string => {
  const [high, medium, low, none] =
    lang === 'de'
      ? ['hohe Sicherheit', 'mittlere Sicherheit', 'geringe Sicherheit', 'kaum Anhaltspunkte']
      : ['high confidence', 'medium confidence', 'low confidence', 'very little evidence'];

  if (confidence >= 0.8) {
    return high;
  }
  if (confidence >= 0.55) {
    return medium;
  }
  if (confidence >= 0.25) {
    return low;
  }

  return none;
};

export const greetingForHour = (hour: number, lang: Lang = 'en'): string => {
  const [night, morning, afternoon, evening] =
    lang === 'de'
      ? ['Gute Nacht', 'Guten Morgen', 'Guten Tag', 'Guten Abend']
      : ['Good night', 'Good morning', 'Good afternoon', 'Good evening'];

  if (hour < 5) {
    return night;
  }
  if (hour < 12) {
    return morning;
  }
  if (hour < 18) {
    return afternoon;
  }

  return evening;
};

export const OBSERVATION_LABELS: Record<ObservationType, string> = {
  PURCHASED: 'Bought',
  CONSUMED: 'Used some',
  EMPTY: 'Marked empty',
  SEEN_IN_STOCK: 'Still have it',
  MANUAL_NEED: 'Added as needed',
};

export const OBSERVATION_LABELS_DE: Record<ObservationType, string> = {
  PURCHASED: 'Gekauft',
  CONSUMED: 'Etwas verbraucht',
  EMPTY: 'Als leer gemeldet',
  SEEN_IN_STOCK: 'Noch vorhanden',
  MANUAL_NEED: 'Als benötigt gemeldet',
};

export const CATEGORY_LABELS_DE: Record<ProductCategory, string> = {
  DAIRY: 'Milchprodukte',
  BAKERY: 'Backwaren',
  PRODUCE: 'Obst & Gemüse',
  PANTRY: 'Vorrat',
  BEVERAGES: 'Getränke',
  FROZEN: 'Tiefkühl',
  HOUSEHOLD: 'Haushalt',
  PERSONAL_CARE: 'Körperpflege',
  OTHER: 'Sonstiges',
};

export const observationLabel = (type: ObservationType, lang: Lang = 'en') =>
  (lang === 'de' ? OBSERVATION_LABELS_DE : OBSERVATION_LABELS)[type];

export const categoryLabel = (category: ProductCategory, lang: Lang = 'en') =>
  (lang === 'de' ? CATEGORY_LABELS_DE : CATEGORY_LABELS)[category];

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

export const summarizeCount = (count: number, lang: Lang = 'en'): string => {
  if (lang === 'de') {
    if (count === 0) {
      return 'Gerade nichts nötig';
    }

    return count === 1 ? '1 Sache wahrscheinlich nötig' : `${count} Sachen wahrscheinlich nötig`;
  }
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
