import { describe, expect, it } from 'vitest';

import { selectQuestions } from 'src/domain/questions';
import { buildOverview } from 'src/domain/shopping';

import { NOW, observation, product, purchases, shoppingItem } from './fixtures';

const coffee = product({ id: 'coffee', name: 'Coffee' });
const pasta = product({ id: 'pasta', name: 'Pasta' });
const milk = product();

const at = (id: string, ...ages: number[]) =>
  ages.map((age) => observation('PURCHASED', age, { productId: id }));

describe('selectQuestions', () => {
  it('asks about uncertain estimates close to the decision threshold', () => {
    // Paper-towel-like: two purchases, ~needed, low confidence.
    const overview = buildOverview(
      { products: [coffee], observations: at('coffee', 50, 26), shoppingItems: [] },
      NOW,
    );
    const [question] = selectQuestions(overview, NOW);

    expect(question.overview.product.name).toBe('Coffee');
    expect(question.reason).toMatch(/uncertain|quick check/);
  });

  it('does not ask when the answer is already clear', () => {
    const overview = buildOverview(
      {
        products: [milk, pasta, coffee],
        observations: [
          ...purchases(0.5), // milk: just bought
          ...at('pasta', 26, 21, 16, 11, 6), // regular and clearly needed → high confidence
        ],
        shoppingItems: [],
      },
      NOW,
    );

    // coffee has no data at all → nothing to ask about either
    expect(selectQuestions(overview, NOW)).toEqual([]);
  });

  it('asks first where reports conflict', () => {
    const overview = buildOverview(
      {
        products: [milk, coffee],
        observations: [
          ...at('coffee', 50, 26),
          observation('EMPTY', 3, { productId: 'milk' }),
          observation('SEEN_IN_STOCK', 2.5, { productId: 'milk' }),
        ],
        shoppingItems: [],
      },
      NOW,
    );
    const questions = selectQuestions(overview, NOW);

    expect(questions[0].overview.product.name).toBe('Milk');
    expect(questions[0].priority).toBe(1);
    expect(questions[0].reason).toBe('Reports disagree — one answer settles it.');
  });

  it('skips products on the list, recently observed, or skipped by the person', () => {
    const snapshot = {
      products: [coffee, pasta, milk],
      observations: [
        ...at('coffee', 50, 26),
        ...at('pasta', 50, 26),
        ...at('milk', 50, 26),
        observation('CONSUMED', 1, { productId: 'pasta' }),
      ],
      shoppingItems: [shoppingItem({ productId: 'milk' })],
    };
    const questions = selectQuestions(buildOverview(snapshot, NOW), NOW, new Set(['coffee']));

    expect(questions).toEqual([]);
  });

  it('limits the number of questions and orders them deterministically', () => {
    const products = ['a', 'b', 'c', 'd'].map((id) => product({ id, name: id.toUpperCase() }));
    const overview = buildOverview(
      {
        products,
        observations: products.flatMap((p) => at(p.id, 50, 26)),
        shoppingItems: [],
      },
      NOW,
    );
    const questions = selectQuestions(overview, NOW);

    expect(questions.map((q) => q.overview.product.name)).toEqual(['A', 'B', 'C']);
  });
});
