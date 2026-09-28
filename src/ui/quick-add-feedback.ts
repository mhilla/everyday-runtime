import type { Translate } from 'src/ui/i18n';

export type QuickAddResult = {
  productName: string;
  alreadyOnList: boolean;
} | null;

export const quickAddFeedback = (
  result: QuickAddResult,
  t: Translate,
): string | undefined => {
  if (!result) {
    return undefined;
  }

  return result.alreadyOnList
    ? t('{name} is already on your list', { name: result.productName })
    : t('{name} added to your list', { name: result.productName });
};
