import { describeNeed } from 'src/domain/presentation';
import { selectProbablyNeeded } from 'src/domain/shopping';
import type { ProductOverview } from 'src/domain/shopping';
import type { NeedState } from 'src/domain/types';

export type NeedsReportEntry = {
  productId: string;
  name: string;
  state: NeedState;
  needScore: number;
  confidence: number;
  label: string;
  isEstimate: boolean;
  reason: string;
  onList: boolean;
};

export type NeedsReport = {
  generatedAt: string;
  count: number;
  needed: NeedsReportEntry[];
};

// Stable, integration-friendly JSON view of what is probably needed.
// Served by the /needs route; meant for dashboards, voice assistants, etc.
export const buildNeedsReport = (
  overviews: ProductOverview[],
  now: Date,
): NeedsReport => {
  const needed = selectProbablyNeeded(overviews).map((entry) => {
    const headline = describeNeed(entry.assessment);

    return {
      productId: entry.product.id,
      name: entry.product.name,
      state: entry.assessment.state,
      needScore: entry.assessment.needScore,
      confidence: entry.assessment.confidence,
      label: headline.label,
      isEstimate: headline.isEstimate,
      reason: entry.assessment.reason,
      onList: entry.openItem !== null,
    };
  });

  return { generatedAt: now.toISOString(), count: needed.length, needed };
};
