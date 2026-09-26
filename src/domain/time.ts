export const MS_PER_HOUR = 60 * 60 * 1000;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

export const daysBetween = (from: Date, to: Date): number =>
  (to.getTime() - from.getTime()) / MS_PER_DAY;

export const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * MS_PER_DAY);

export const median = (values: number[]): number | null => {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
};

export const mean = (values: number[]): number | null =>
  values.length === 0
    ? null
    : values.reduce((sum, value) => sum + value, 0) / values.length;

// Coefficient of variation: standard deviation relative to the mean.
// 0 means perfectly regular, ~1 means very irregular.
export const coefficientOfVariation = (values: number[]): number | null => {
  const average = mean(values);

  if (average === null || values.length < 2 || average === 0) {
    return null;
  }

  const variance =
    values.reduce((sum, value) => sum + (value - average) ** 2, 0) /
    values.length;

  return Math.sqrt(variance) / average;
};

export const clamp = (value: number, min = 0, max = 1): number =>
  Math.min(max, Math.max(min, value));

// "today", "yesterday", "3 days ago", "2 weeks ago", "3 months ago".
export const formatAgo = (from: Date, now: Date): string => {
  const days = Math.floor(daysBetween(from, now) + 1e-9);

  if (days <= 0) {
    return 'today';
  }
  if (days === 1) {
    return 'yesterday';
  }
  if (days < 14) {
    return `${days} days ago`;
  }
  if (days < 60) {
    return `${Math.round(days / 7)} weeks ago`;
  }

  return `${Math.round(days / 30)} months ago`;
};

// Deliberately coarse: "~5 days", "~2 weeks", "~1 month".
export const formatInterval = (days: number): string => {
  if (days < 1.5) {
    return '~1 day';
  }
  if (days < 13) {
    return `~${Math.round(days)} days`;
  }
  if (days < 45) {
    const weeks = Math.round(days / 7);

    return weeks === 1 ? '~1 week' : `~${weeks} weeks`;
  }

  const months = Math.round(days / 30);

  return months === 1 ? '~1 month' : `~${months} months`;
};

export const lastItem = <T>(items: readonly T[]): T | null =>
  items.length === 0 ? null : items[items.length - 1];
