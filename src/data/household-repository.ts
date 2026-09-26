import {
  mapObservation,
  mapPriceObservation,
  mapProduct,
  mapPurchase,
  mapShoppingItem,
} from 'src/data/record-mappers';
import type { RawRecord } from 'src/data/record-mappers';
import type { HouseholdSnapshot } from 'src/domain/shopping';
import type {
  Observation,
  ObservationSource,
  PriceObservation,
  PriceObservationSource,
  Purchase,
  ObservationType,
  Product,
  ProductCategory,
  ShoppingItem,
  ShoppingItemOrigin,
} from 'src/domain/types';

// The subset of twenty-client-sdk's RestApiClient the repository needs.
// Keeping it this small lets tests pass a fake without any network.
export type RestTransport = {
  get<T = unknown>(
    path: string,
    options?: { query?: Record<string, string | number | boolean | null | undefined> },
  ): Promise<T>;
  post<T = unknown>(path: string, body?: unknown): Promise<T>;
  patch<T = unknown>(path: string, body?: unknown): Promise<T>;
};

type ListResponse = {
  data?: Record<string, RawRecord[] | undefined>;
  pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
};

type CreateResponse = { data?: Record<string, RawRecord | undefined> };
type BatchResponse = { data?: Record<string, RawRecord[] | undefined> };

const PAGE_SIZE = 200;
// v0.1 keeps the whole household in memory; these caps protect the UI from
// unbounded growth until server-side aggregation exists (see ROADMAP.md).
const MAX_OBSERVATIONS = 2000;
const MAX_SHOPPING_ITEMS = 1000;
const MAX_PRICE_RECORDS = 1000;

const listAll = async (
  transport: RestTransport,
  objectNamePlural: string,
  orderBy: string,
  limit: number,
): Promise<RawRecord[]> => {
  const records: RawRecord[] = [];
  let cursor: string | null = null;

  while (records.length < limit) {
    const response: ListResponse = await transport.get<ListResponse>(
      `/rest/${objectNamePlural}`,
      {
        query: {
          limit: Math.min(PAGE_SIZE, limit - records.length),
          order_by: orderBy,
          starting_after: cursor,
        },
      },
    );

    records.push(...(response.data?.[objectNamePlural] ?? []));

    const pageInfo = response.pageInfo;

    if (!pageInfo?.hasNextPage || !pageInfo.endCursor) {
      break;
    }
    cursor = pageInfo.endCursor;
  }

  return records;
};

const created = (response: CreateResponse, key: string): RawRecord => {
  const record = response.data?.[key];

  if (!record) {
    throw new Error(`Unexpected response from Twenty: missing ${key}`);
  }

  return record;
};

export type NewProduct = {
  name: string;
  category?: ProductCategory | null;
  defaultUnit?: string | null;
  typicalPurchaseQuantity?: number | null;
  shelfLifeDays?: number | null;
};

export type NewObservation = {
  product: Pick<Product, 'id' | 'name'>;
  type: ObservationType;
  source: ObservationSource;
  observedAt?: Date;
  quantity?: number | null;
  note?: string | null;
};

export type NewShoppingItem = {
  product: Pick<Product, 'id' | 'name'>;
  origin: ShoppingItemOrigin;
  requestedQuantity: number;
  confidence?: number | null;
  explanation?: string | null;
  status?: ShoppingItem['status'];
  dismissedAt?: Date | null;
};

export type NewPurchase = {
  product: Pick<Product, 'id' | 'name'>;
  quantity: number;
  purchasedAt: Date;
  priceAmount?: number | null;
  priceCurrency?: string | null;
  store?: string | null;
};

const OBSERVATION_SUMMARY: Record<ObservationType, string> = {
  PURCHASED: 'bought',
  CONSUMED: 'used',
  EMPTY: 'empty',
  SEEN_IN_STOCK: 'in stock',
  MANUAL_NEED: 'needed',
};

const observationBody = (input: NewObservation) => ({
  summary: `${input.product.name} — ${OBSERVATION_SUMMARY[input.type]}`,
  productId: input.product.id,
  observationType: input.type,
  source: input.source,
  observedAt: (input.observedAt ?? new Date()).toISOString(),
  quantity: input.quantity ?? null,
  note: input.note ?? null,
});

export const createHouseholdRepository = (transport: RestTransport) => ({
  async loadSnapshot(): Promise<HouseholdSnapshot> {
    const [products, observations, shoppingItems, purchases, priceObservations] = await Promise.all([
      listAll(transport, 'products', 'name[AscNullsLast]', 1000),
      listAll(
        transport,
        'observations',
        'observedAt[DescNullsLast]',
        MAX_OBSERVATIONS,
      ),
      listAll(
        transport,
        'shoppingItems',
        'createdAt[DescNullsLast]',
        MAX_SHOPPING_ITEMS,
      ),
      listAll(transport, 'purchases', 'purchasedAt[DescNullsLast]', MAX_PRICE_RECORDS),
      listAll(transport, 'priceObservations', 'observedAt[DescNullsLast]', MAX_PRICE_RECORDS),
    ]);

    return {
      products: products.map(mapProduct),
      observations: observations
        .map(mapObservation)
        .filter((observation): observation is Observation => observation !== null),
      shoppingItems: shoppingItems.map(mapShoppingItem),
      purchases: purchases
        .map(mapPurchase)
        .filter((purchase): purchase is Purchase => purchase !== null),
      priceObservations: priceObservations
        .map(mapPriceObservation)
        .filter((price): price is PriceObservation => price !== null),
    };
  },

  async createProduct(input: NewProduct): Promise<Product> {
    const response = await transport.post<CreateResponse>('/rest/products', {
      name: input.name.trim(),
      category: input.category ?? 'OTHER',
      defaultUnit: input.defaultUnit ?? null,
      typicalPurchaseQuantity: input.typicalPurchaseQuantity ?? null,
      shelfLifeDays: input.shelfLifeDays ?? null,
      archived: false,
    });

    return mapProduct(created(response, 'createProduct'));
  },

  async updateProduct(
    productId: string,
    changes: Partial<
      Pick<
        Product,
        | 'archived'
        | 'name'
        | 'category'
        | 'defaultUnit'
        | 'barcode'
        | 'shelfLifeDays'
        | 'priceAlertUnitPrice'
        | 'typicalPurchaseQuantity'
      >
    >,
  ): Promise<void> {
    await transport.patch(`/rest/products/${productId}`, changes);
  },

  async recordObservation(input: NewObservation): Promise<void> {
    await transport.post('/rest/observations', observationBody(input));
  },

  async recordObservations(inputs: NewObservation[]): Promise<void> {
    if (inputs.length === 0) {
      return;
    }

    const response = await transport.post<BatchResponse>(
      '/rest/batch/observations',
      inputs.map(observationBody),
    );

    if (!response.data?.createObservations) {
      throw new Error('Unexpected response from Twenty: missing createObservations');
    }
  },

  async createShoppingItem(input: NewShoppingItem): Promise<void> {
    await transport.post('/rest/shoppingItems', {
      name: input.product.name,
      productId: input.product.id,
      requestedQuantity: input.requestedQuantity,
      status: input.status ?? 'OPEN',
      origin: input.origin,
      confidence: input.confidence ?? null,
      explanation: input.explanation ?? null,
      dismissedAt: input.dismissedAt ? input.dismissedAt.toISOString() : null,
    });
  },

  async updateShoppingItem(
    itemId: string,
    changes: {
      status?: ShoppingItem['status'];
      requestedQuantity?: number;
      purchasedAt?: Date | null;
      dismissedAt?: Date | null;
    },
  ): Promise<void> {
    await transport.patch(`/rest/shoppingItems/${itemId}`, {
      ...changes,
      purchasedAt:
        changes.purchasedAt === undefined
          ? undefined
          : (changes.purchasedAt?.toISOString() ?? null),
      dismissedAt:
        changes.dismissedAt === undefined
          ? undefined
          : (changes.dismissedAt?.toISOString() ?? null),
    });
  },

  async createPriceObservation(input: {
    product: Pick<Product, 'id' | 'name'>;
    priceAmount: number;
    priceCurrency?: string;
    packQuantity: number;
    store?: string | null;
    observedAt: Date;
    source: PriceObservationSource;
  }): Promise<void> {
    await transport.post('/rest/priceObservations', {
      name: `${input.product.name} — ${input.priceAmount.toFixed(2)}`,
      productId: input.product.id,
      price: {
        amountMicros: Math.round(input.priceAmount * 1_000_000),
        currencyCode: input.priceCurrency ?? 'EUR',
      },
      packQuantity: input.packQuantity,
      store: input.store?.trim() || null,
      observedAt: input.observedAt.toISOString(),
      source: input.source,
    });
  },

  async createPurchase(input: NewPurchase): Promise<void> {
    const hasPrice =
      typeof input.priceAmount === 'number' && Number.isFinite(input.priceAmount);

    await transport.post('/rest/purchases', {
      name: input.product.name,
      productId: input.product.id,
      quantity: input.quantity,
      purchasedAt: input.purchasedAt.toISOString(),
      store: input.store?.trim() || null,
      ...(hasPrice
        ? {
            price: {
              amountMicros: Math.round((input.priceAmount as number) * 1_000_000),
              currencyCode: input.priceCurrency ?? 'EUR',
            },
          }
        : {}),
    });
  },
});

export type HouseholdRepository = ReturnType<typeof createHouseholdRepository>;
