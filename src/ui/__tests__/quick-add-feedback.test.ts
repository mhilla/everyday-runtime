import { describe, expect, it } from 'vitest';

import { translate } from 'src/ui/i18n';
import { quickAddFeedback } from 'src/ui/quick-add-feedback';

describe('quickAddFeedback', () => {
  it('returns undefined when result is null', () => {
    const t = (text: string, values?: Record<string, string | number>) => translate('en', text, values);

    expect(quickAddFeedback(null, t)).toBeUndefined();
  });

  it('shows "<Name> added to your list" when item was not on the list', () => {
    const tEn = (text: string, values?: Record<string, string | number>) => translate('en', text, values);
    const tDe = (text: string, values?: Record<string, string | number>) => translate('de', text, values);

    expect(quickAddFeedback({ productName: 'Milk', alreadyOnList: false }, tEn)).toBe('Milk added to your list');
    expect(quickAddFeedback({ productName: 'Milch', alreadyOnList: false }, tDe)).toBe('Milch auf die Liste gesetzt');
  });

  it('shows "<Name> is already on your list" when item was already on the list', () => {
    const tEn = (text: string, values?: Record<string, string | number>) => translate('en', text, values);
    const tDe = (text: string, values?: Record<string, string | number>) => translate('de', text, values);

    expect(quickAddFeedback({ productName: 'Milk', alreadyOnList: true }, tEn)).toBe('Milk is already on your list');
    expect(quickAddFeedback({ productName: 'Milch', alreadyOnList: true }, tDe)).toBe('Milch steht schon auf der Liste');
  });
});
