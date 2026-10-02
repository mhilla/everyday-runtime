import { assessProduct, INFERENCE_CONFIG } from 'src/domain/inference';
import type { InferenceConfig } from 'src/domain/inference';
import type {
  NeedAssessment,
  Observation,
  PriceObservation,
  Product,
  ProductCategory,
  Purchase,
  ShoppingItem,
} from 'src/domain/types';

export type ProductOverview = {
  product: Product;
  assessment: NeedAssessment;
  openItem: ShoppingItem | null;
  // True when the user dismissed a suggestion and nothing new was observed
  // since — the engine must not nag about the same product again.
  isSuggestionSuppressed: boolean;
  lastObservation: Observation | null;
};

export type HouseholdSnapshot = {
  products: Product[];
  observations: Observation[];
  shoppingItems: ShoppingItem[];
  purchases?: Purchase[];
  priceObservations?: PriceObservation[];
};

const groupByProduct = <T extends { productId: string | null }>(items: T[]) => {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    if (item.productId === null) {
      continue;
    }

    const group = groups.get(item.productId);

    if (group) {
      group.push(item);
    } else {
      groups.set(item.productId, [item]);
    }
  }

  return groups;
};

const latestObservation = (observations: Observation[]): Observation | null =>
  observations.reduce<Observation | null>(
    (latest, observation) =>
      latest === null || observation.observedAt > latest.observedAt
        ? observation
        : latest,
    null,
  );

export const isSuggestionSuppressed = (
  items: ShoppingItem[],
  latest: Observation | null,
): boolean =>
  items.some(
    (item) =>
      item.status === 'DISMISSED' &&
      item.dismissedAt !== null &&
      (latest === null || item.dismissedAt > latest.observedAt),
  );

export const buildOverview = (
  snapshot: HouseholdSnapshot,
  now: Date,
  config: InferenceConfig = INFERENCE_CONFIG,
): ProductOverview[] => {
  const observationsByProduct = groupByProduct(snapshot.observations);
  const itemsByProduct = groupByProduct(snapshot.shoppingItems);

  return snapshot.products
    .filter((product) => !product.archived)
    .map((product) => {
      const observations = observationsByProduct.get(product.id) ?? [];
      const items = itemsByProduct.get(product.id) ?? [];
      const latest = latestObservation(observations);
      const openItem =
        items
          .filter((item) => item.status === 'OPEN')
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ??
        null;

      return {
        product,
        assessment: assessProduct(observations, now, config, {
          unit: product.defaultUnit,
        }),
        openItem,
        isSuggestionSuppressed: isSuggestionSuppressed(items, latest),
        lastObservation: latest,
      };
    });
};

const byNeed = (a: ProductOverview, b: ProductOverview) =>
  b.assessment.needScore - a.assessment.needScore ||
  b.assessment.confidence - a.assessment.confidence ||
  a.product.name.localeCompare(b.product.name);

// Products the engine thinks are needed and that are not on the list yet.
export const selectSuggestions = (overviews: ProductOverview[]) =>
  overviews
    .filter(
      (overview) =>
        overview.assessment.needsShopping &&
        overview.openItem === null &&
        !overview.isSuggestionSuppressed,
    )
    .sort(byNeed);

// Everything that probably has to be bought: open list items first (they are
// explicit), then engine suggestions.
export const selectProbablyNeeded = (overviews: ProductOverview[]) => {
  const onList = overviews
    .filter((overview) => overview.openItem !== null)
    .sort(byNeed);

  return [...onList, ...selectSuggestions(overviews)];
};

export const sortProductsForBrowsing = (overviews: ProductOverview[]) =>
  [...overviews].sort(byNeed);

// Open items that are not linked to any product (should be rare, but the
// data model allows it) still belong on the list.
export const selectOpenItems = (items: ShoppingItem[]) =>
  items
    .filter((item) => item.status === 'OPEN')
    .sort(
      (a, b) =>
        (b.confidence ?? 1) - (a.confidence ?? 1) ||
        a.name.localeCompare(b.name),
    );

export const DEFAULT_CATEGORY_AISLE_ORDER: ProductCategory[] = [
  'PRODUCE',
  'BAKERY',
  'DAIRY',
  'PANTRY',
  'BEVERAGES',
  'HOUSEHOLD',
  'PERSONAL_CARE',
  'FROZEN',
  'OTHER',
];

export type AisleGroup<T> = {
  category: ProductCategory;
  items: T[];
};

export const groupItemsByAisle = (
  items: ShoppingItem[],
  productsById: Map<string, Product>,
  aisleOrder: readonly ProductCategory[] = DEFAULT_CATEGORY_AISLE_ORDER,
): AisleGroup<ShoppingItem>[] => {
  const groups = new Map<ProductCategory, ShoppingItem[]>();

  for (const item of items) {
    const product = item.productId ? productsById.get(item.productId) : null;
    const category: ProductCategory = product?.category ?? 'OTHER';
    const list = groups.get(category);

    if (list) {
      list.push(item);
    } else {
      groups.set(category, [item]);
    }
  }

  const result: AisleGroup<ShoppingItem>[] = [];

  for (const category of aisleOrder) {
    const list = groups.get(category);

    if (list && list.length > 0) {
      result.push({
        category,
        items: [...list].sort((a, b) => a.name.localeCompare(b.name)),
      });
      groups.delete(category);
    }
  }

  for (const [category, list] of groups.entries()) {
    if (list.length > 0) {
      result.push({
        category,
        items: [...list].sort((a, b) => a.name.localeCompare(b.name)),
      });
    }
  }

  return result;
};
