import { describe, expect, it } from 'vitest';

import { assessProduct, INFERENCE_CONFIG } from 'src/domain/inference';
import { amount, interval, money, msg, renderMessage } from 'src/domain/messages';
import { describeConfidence, describeNeed, greetingForHour, summarizeCount } from 'src/domain/presentation';

import { NOW, observation, purchases } from './fixtures';

const de = (m: Parameters<typeof renderMessage>[0]) => renderMessage(m, 'de');

describe('German explanations', () => {
  it('renders the engine reason and factors in German', () => {
    const result = assessProduct(purchases(26, 21, 16, 11, 6), NOW);

    expect(de(result.reasonMessage)).toBe('Zuletzt gekauft vor 6 Tagen · üblicher Abstand ~5 Tage');
    expect(result.factorMessages.map(de)).toEqual([
      'Basierend auf 5 Einkäufen, zuletzt vor 6 Tagen.',
      'Die Einkäufe sind regelmäßig: meist alle ~5 Tage.',
      'Sollte gestern ausgegangen sein.',
    ]);
  });

  it('keeps English identical to the plain reason', () => {
    const result = assessProduct([observation('EMPTY', 0)], NOW);

    expect(renderMessage(result.reasonMessage, 'en')).toBe(result.reason);
    expect(de(result.reasonMessage)).toBe('heute als leer gemeldet');
  });

  it('uses German plurals, decimals and currency', () => {
    expect(de(msg('factor.lastsMore', { days: 1 }))).toBe('Sollte noch etwa 1 Tag reichen.');
    expect(de(msg('factor.lastsMore', { days: 3 }))).toBe('Sollte noch etwa 3 Tage reichen.');
    expect(de(msg('duration.quantityLasts', { amount: amount(1.5, 'l'), interval: interval(14) }))).toBe(
      '1,5 l reichen meist ~2 Wochen',
    );
    expect(
      de(msg('price.good', { percent: 12, usual: money(0.6, 'EUR'), per: '/l', lowest: 0 })),
    ).toBe('12 % unter deinem üblichen Preis (sonst 0,60 €/l).');
  });

  it('translates headlines, confidence, greetings and counts', () => {
    const likely = assessProduct(purchases(26, 21, 16, 11, 6), NOW, INFERENCE_CONFIG);

    expect(describeNeed(likely, 'de').label).toBe('Wahrscheinlich knapp');
    expect(describeConfidence(0.9, 'de')).toBe('hohe Sicherheit');
    expect(greetingForHour(9, 'de')).toBe('Guten Morgen');
    expect(summarizeCount(7, 'de')).toBe('7 Sachen wahrscheinlich nötig');
  });
});
