import type { Command } from 'src/domain/commands';
import type { ProductPrices } from 'src/domain/deals';
import { money, msg, renderMessage } from 'src/domain/messages';
import type { Lang, Message } from 'src/domain/messages';
import { describeNeed } from 'src/domain/presentation';
import { selectProbablyNeeded } from 'src/domain/shopping';
import type { ProductOverview } from 'src/domain/shopping';
import type { Product } from 'src/domain/types';

// Pure helpers for the conversation: find the product a person means and
// answer questions from the same engine the screens use.

const normalize = (text: string) =>
  text
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ß ]/g, '')
    .trim();

// Strip common German/English plural endings: "Eier"→"ei", "apples"→"apple".
const stem = (word: string) => word.replace(/(ern|er|en|es|e|n|s)$/u, '');

const distance = (a: string, b: string): number => {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];

    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j];

      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }

  return row[b.length];
};

// Best matching active product, or null. Exact > same stem > contained word
// > small typo (one edit per five letters).
export const matchProduct = (products: Product[], name: string): Product | null => {
  const wanted = normalize(name);

  if (wanted === '') {
    return null;
  }

  const active = products.filter((product) => !product.archived);
  const scored = active
    .map((product) => {
      const candidate = normalize(product.name);
      const score =
        candidate === wanted
          ? 0
          : stem(candidate) === stem(wanted)
            ? 1
            : candidate.split(' ').includes(wanted) || wanted.split(' ').includes(candidate)
              ? 2
              : distance(candidate, wanted) <= Math.max(1, Math.floor(wanted.length / 5))
                ? 3
                : Number.POSITIVE_INFINITY;

      return { product, score };
    })
    .filter((entry) => Number.isFinite(entry.score))
    .sort((a, b) => a.score - b.score || a.product.name.localeCompare(b.product.name));

  return scored[0]?.product ?? null;
};

const needsAnswer = (overviews: ProductOverview[], lang: Lang): Message[] => {
  const needed = selectProbablyNeeded(overviews).slice(0, 8);

  if (needed.length === 0) {
    return [msg('talk.needsNone')];
  }

  return [
    msg('talk.needsIntro', { count: needed.length }),
    ...needed.map((entry) =>
      msg('talk.needsLine', {
        name: entry.product.name,
        label: describeNeed(entry.assessment, lang).label,
        percent: Math.round(entry.assessment.needScore * 100),
        onList: entry.openItem ? msg('talk.onList') : '',
      }),
    ),
  ];
};

// Answers ASK_* commands; returns null for commands that change data.
export const answerQuestion = (
  command: Command,
  overviews: ProductOverview[],
  prices: Map<string, ProductPrices>,
  lang: Lang,
): Message[] | null => {
  if (command.intent === 'ASK_NEEDS') {
    return needsAnswer(overviews, lang);
  }
  if (command.intent !== 'ASK_PRODUCT' && command.intent !== 'ASK_PRICE') {
    return null;
  }

  const products = overviews.map((entry) => entry.product);

  return command.items.map((item) => {
    const product = matchProduct(products, item.name);

    if (!product) {
      return msg('talk.unknownProduct', { name: item.name });
    }

    const overview = overviews.find((entry) => entry.product.id === product.id) as ProductOverview;

    if (command.intent === 'ASK_PRODUCT') {
      return msg('talk.productStatus', {
        name: product.name,
        label: describeNeed(overview.assessment, lang).label,
        percent: Math.round(overview.assessment.needScore * 100),
        reason: overview.assessment.reasonMessage,
      });
    }

    const summary = prices.get(product.id)?.summary;

    if (!summary || summary.typicalUnitPrice === null) {
      return msg('talk.priceNone', { name: product.name });
    }

    return msg('talk.priceStatus', {
      name: product.name,
      usual: money(summary.typicalUnitPrice, summary.currency),
      per: product.defaultUnit ? `/${product.defaultUnit}` : '',
      // Only worth mentioning when it is actually below the usual price.
      hasLow:
        summary.lowestRecent && summary.lowestRecent.unitPrice < summary.typicalUnitPrice ? 1 : 0,
      low: summary.lowestRecent ? money(summary.lowestRecent.unitPrice, summary.currency) : '',
      lowStore: summary.lowestRecent?.store ?? '',
    });
  });
};

export const renderReply = (messages: Message[], lang: Lang) =>
  messages.map((message) => renderMessage(message, lang)).join('\n');
