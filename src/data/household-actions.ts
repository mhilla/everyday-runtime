import type { HouseholdRepository } from 'src/data/household-repository';
import { buildDemoHousehold } from 'src/domain/demo-data';
import type { Lang } from 'src/domain/messages';
import { findProductByName, parseQuickAdd, toDisplayName } from 'src/domain/quick-add';
import type { ProductOverview } from 'src/domain/shopping';
import type { Product, ShoppingItem } from 'src/domain/types';

// Every user interaction of the app, expressed as a small, explicit sequence
// of writes. The UI calls these and reloads; nothing else writes data.
export const createHouseholdActions = (
  repository: HouseholdRepository,
  clock: () => Date = () => new Date(),
) => {
  const ensureOnList = async (
    product: Product,
    openItem: ShoppingItem | null,
    explanation: string,
    requestedQuantity?: number | null,
  ) => {
    if (openItem) {
      return;
    }

    await repository.createShoppingItem({
      product,
      origin: 'MANUAL',
      requestedQuantity: requestedQuantity ?? product.typicalPurchaseQuantity ?? 1,
      explanation,
    });
  };

  return {
    // "2 milk" -> finds or creates Milk, records the need, puts it on the list.
    async quickAddToList(
      raw: string,
      products: Product[],
      openItems: ShoppingItem[],
    ): Promise<{ productName: string; alreadyOnList: boolean } | null> {
      const parsed = parseQuickAdd(raw);

      if (parsed === null) {
        return null;
      }

      let product = findProductByName(products, parsed.name);

      if (product === null) {
        product = await repository.createProduct({ name: toDisplayName(parsed.name) });
      } else if (product.archived) {
        await repository.updateProduct(product.id, { archived: false });
      }

      const productId = product.id;
      const openItem = openItems.find((item) => item.productId === productId) ?? null;

      if (openItem) {
        if (parsed.quantity !== null && parsed.quantity !== openItem.requestedQuantity) {
          await repository.updateShoppingItem(openItem.id, {
            requestedQuantity: parsed.quantity,
          });
        }

        return { productName: product.name, alreadyOnList: true };
      }

      await repository.recordObservation({
        product,
        type: 'MANUAL_NEED',
        source: 'SHOPPING_LIST',
        observedAt: clock(),
        quantity: parsed.quantity,
      });
      await ensureOnList(product, null, 'Added by you', parsed.quantity);

      return { productName: product.name, alreadyOnList: false };
    },

    async createProduct(raw: string, products: Product[]) {
      const name = toDisplayName(raw);

      if (name === '') {
        return null;
      }

      const existing = findProductByName(products, name);

      if (existing) {
        if (existing.archived) {
          await repository.updateProduct(existing.id, { archived: false });
        }

        return existing;
      }

      return repository.createProduct({ name });
    },

    async markEmpty(overview: ProductOverview) {
      await repository.recordObservation({
        product: overview.product,
        type: 'EMPTY',
        source: 'APP',
        observedAt: clock(),
      });
      await ensureOnList(overview.product, overview.openItem, 'Marked empty');
    },

    // "Still have it" also withdraws a suggestion the engine made, but never
    // removes something a person put on the list themselves.
    async markInStock(overview: ProductOverview) {
      const now = clock();

      await repository.recordObservation({
        product: overview.product,
        type: 'SEEN_IN_STOCK',
        source: 'APP',
        observedAt: now,
      });

      if (overview.openItem?.origin === 'INFERRED') {
        await repository.updateShoppingItem(overview.openItem.id, {
          status: 'DISMISSED',
          dismissedAt: now,
        });
      }
    },

    async addManually(overview: ProductOverview) {
      if (overview.openItem) {
        return;
      }

      await repository.recordObservation({
        product: overview.product,
        type: 'MANUAL_NEED',
        source: 'APP',
        observedAt: clock(),
      });
      await ensureOnList(overview.product, null, 'Added by you');
    },

    async acceptSuggestion(overview: ProductOverview) {
      if (overview.openItem) {
        return;
      }

      await repository.createShoppingItem({
        product: overview.product,
        origin: 'INFERRED',
        requestedQuantity: overview.product.typicalPurchaseQuantity ?? 1,
        confidence: overview.assessment.needScore,
        explanation: overview.assessment.reason,
      });
    },

    // Remembered as a dismissed item so the same suggestion stays quiet
    // until new evidence arrives (see isSuggestionSuppressed).
    async dismissSuggestion(overview: ProductOverview) {
      await repository.createShoppingItem({
        product: overview.product,
        origin: 'INFERRED',
        requestedQuantity: overview.product.typicalPurchaseQuantity ?? 1,
        confidence: overview.assessment.needScore,
        explanation: overview.assessment.reason,
        status: 'DISMISSED',
        dismissedAt: clock(),
      });
    },

    async removeFromList(item: ShoppingItem) {
      await repository.updateShoppingItem(item.id, {
        status: 'DISMISSED',
        dismissedAt: clock(),
      });
    },

    // Undo a check-off or removal from an external list (e.g. Home Assistant).
    // A purchase already recorded stays recorded.
    async reopenItem(item: ShoppingItem) {
      await repository.updateShoppingItem(item.id, {
        status: 'OPEN',
        purchasedAt: null,
        dismissedAt: null,
      });
    },

    // Works from the list (item given) or directly from a product.
    async markPurchased(
      item: ShoppingItem | null,
      product: Product,
      details: { quantity: number; priceAmount?: number | null; store?: string | null },
    ) {
      const now = clock();
      const quantity = details.quantity > 0 ? details.quantity : 1;

      if (item) {
        await repository.updateShoppingItem(item.id, {
          status: 'PURCHASED',
          purchasedAt: now,
        });
      }
      await repository.createPurchase({
        product,
        quantity,
        purchasedAt: now,
        priceAmount: details.priceAmount ?? null,
        store: details.store ?? null,
      });
      await repository.recordObservation({
        product,
        type: 'PURCHASED',
        source: 'SHOPPING_LIST',
        observedAt: now,
        quantity,
      });
    },

    // "Saw it for 2.99 € (6 × 1 l) at Corner shop".
    async logPrice(
      product: Product,
      details: { priceAmount: number; packQuantity: number; store: string | null },
    ) {
      if (!(details.priceAmount > 0) || !(details.packQuantity > 0)) {
        throw new Error('Enter a price and a pack size above zero.');
      }

      await repository.createPriceObservation({
        product,
        priceAmount: details.priceAmount,
        packQuantity: details.packQuantity,
        store: details.store,
        observedAt: clock(),
        source: 'MANUAL',
      });
    },

    // Stores community prices (Open Prices) as price observations; entries
    // without a comparable pack size are skipped.
    async importCommunityPrices(
      product: Product,
      prices: {
        price: number;
        currency: string;
        date: string;
        store: string | null;
        packQuantity: number | null;
      }[],
    ) {
      const usable = prices.filter((p) => p.packQuantity !== null && p.packQuantity > 0);

      for (const price of usable) {
        await repository.createPriceObservation({
          product,
          priceAmount: price.price,
          priceCurrency: price.currency,
          packQuantity: price.packQuantity as number,
          store: price.store,
          observedAt: new Date(`${price.date}T12:00:00Z`),
          source: 'OPEN_PRICES',
        });
      }

      return usable.length;
    },

    async updateProductSettings(
      product: Product,
      settings: {
        priceAlertUnitPrice?: number | null;
        shelfLifeDays?: number | null;
        barcode?: string | null;
      },
    ) {
      await repository.updateProduct(product.id, settings);
    },

    async archiveProduct(overview: ProductOverview) {
      await repository.updateProduct(overview.product.id, { archived: true });

      if (overview.openItem) {
        await repository.updateShoppingItem(overview.openItem.id, {
          status: 'DISMISSED',
          dismissedAt: clock(),
        });
      }
    },

    // Creates the documented demo household (see src/domain/demo-data.ts).
    // Existing products with the same name are reused, never duplicated.
    async loadDemoHousehold(existingProducts: Product[], lang: Lang = 'en') {
      const demo = buildDemoHousehold(clock(), lang);
      const productsByKey = new Map<string, Product>();

      for (const demoProduct of demo.products) {
        const existing = findProductByName(existingProducts, demoProduct.name);
        const product =
          existing ??
          (await repository.createProduct({
            name: demoProduct.name,
            category: demoProduct.category,
            defaultUnit: demoProduct.defaultUnit,
            typicalPurchaseQuantity: demoProduct.typicalPurchaseQuantity,
            shelfLifeDays: demoProduct.shelfLifeDays,
          }));

        if (existing?.archived) {
          await repository.updateProduct(existing.id, { archived: false });
        }
        productsByKey.set(demoProduct.key, product);
      }

      const productFor = (key: string) => {
        const product = productsByKey.get(key);

        if (!product) {
          throw new Error(`Demo data references unknown product "${key}"`);
        }

        return product;
      };

      await repository.recordObservations(
        demo.observations.map((observation) => ({
          product: productFor(observation.productKey),
          type: observation.type,
          source: 'DEMO' as const,
          observedAt: observation.observedAt,
          quantity: observation.quantity,
          note: observation.note,
        })),
      );

      for (const price of demo.prices) {
        await repository.createPriceObservation({
          product: productFor(price.productKey),
          priceAmount: price.priceAmount,
          packQuantity: price.packQuantity,
          store: price.store,
          observedAt: price.observedAt,
          source: 'MANUAL',
        });
      }

      for (const item of demo.shoppingItems) {
        await repository.createShoppingItem({
          product: productFor(item.productKey),
          origin: item.origin,
          requestedQuantity: item.requestedQuantity,
          explanation: item.explanation,
        });
      }
    },
  };
};

export type HouseholdActions = ReturnType<typeof createHouseholdActions>;
