import { INFERENCE_CONFIG } from 'src/domain/inference';
import type { ProductOverview } from 'src/domain/shopping';
import { daysBetween } from 'src/domain/time';

// Active questions: instead of guessing silently, ask the household where one
// tap ("still enough" / "empty") would change the decision the most.
export const QUESTION_CONFIG = {
  maxQuestions: 3,
  // Any observation this recent means we already know enough.
  cooldownDays: 2,
  // Only uncertain estimates are worth a question.
  minNeedScore: 0.35,
  maxNeedScore: 0.9,
  maxConfidence: 0.8,
} as const;

export type QuestionConfig = typeof QUESTION_CONFIG;

export type Question = {
  overview: ProductOverview;
  // 0..1, higher = more useful to ask.
  priority: number;
  // Why the app is asking, in one sentence.
  reason: string;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

export const selectQuestions = (
  overviews: ProductOverview[],
  now: Date,
  // Products the person skipped recently (e.g. "not now"); never re-asked here.
  skippedProductIds: ReadonlySet<string> = new Set(),
  config: QuestionConfig = QUESTION_CONFIG,
): Question[] => {
  const threshold = INFERENCE_CONFIG.needThreshold;
  const questions: Question[] = [];

  for (const overview of overviews) {
    const { assessment, openItem, lastObservation, product } = overview;

    if (openItem !== null || skippedProductIds.has(product.id)) {
      continue;
    }
    if (
      lastObservation !== null &&
      daysBetween(lastObservation.observedAt, now) < config.cooldownDays
    ) {
      continue;
    }

    const isConflict = assessment.basis === 'CONFLICT';
    const isUncertain =
      assessment.basis !== 'NO_DATA' &&
      assessment.state !== 'CONFIRMED' &&
      assessment.needScore >= config.minNeedScore &&
      assessment.needScore <= config.maxNeedScore &&
      assessment.confidence <= config.maxConfidence;

    if (!isConflict && !isUncertain) {
      continue;
    }

    // Closest to the buy/don't-buy threshold and least confident first.
    const closeness = 1 - Math.min(1, Math.abs(assessment.needScore - threshold) / threshold);
    const priority = isConflict
      ? 1
      : round2(closeness * 0.6 + (1 - assessment.confidence) * 0.4);

    const reason = isConflict
      ? 'Reports disagree — one answer settles it.'
      : assessment.needScore >= threshold
        ? `Probably needed (${Math.round(assessment.needScore * 100)}%), but the estimate is uncertain.`
        : `Might be needed soon (${Math.round(assessment.needScore * 100)}%) — a quick check avoids a surprise.`;

    questions.push({ overview, priority, reason });
  }

  return questions
    .sort(
      (a, b) =>
        b.priority - a.priority ||
        a.overview.product.name.localeCompare(b.overview.product.name),
    )
    .slice(0, config.maxQuestions);
};
