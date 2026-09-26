// Open Food Facts (product data) and Open Prices (community prices).
// Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
//       https://prices.openfoodfacts.org/api/docs
// Parsing is pure and unit-tested; fetching happens server-side only, with a
// user agent that identifies the app as Open Food Facts asks.

export const OFF_USER_AGENT =
  'everyday-runtime (https://github.com/micha16372/everyday-runtime)';

export type CommunityProduct = {
  barcode: string;
  name: string | null;
  brand: string | null;
  quantity: number | null;
  quantityUnit: string | null;
};

export type CommunityPrice = {
  price: number;
  currency: string;
  date: string;
  isDiscounted: boolean;
  store: string | null;
  // Pack size converted to the product's unit, if the units are compatible.
  packQuantity: number | null;
};

type Json = Record<string, unknown>;

const asObject = (value: unknown): Json | null =>
  typeof value === 'object' && value !== null ? (value as Json) : null;
const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
const asNumber = (value: unknown): number | null => {
  const number = typeof value === 'string' ? Number(value) : value;

  return typeof number === 'number' && Number.isFinite(number) ? number : null;
};

const UNIT_FACTORS: Record<string, { base: string; factor: number }> = {
  ml: { base: 'l', factor: 0.001 },
  cl: { base: 'l', factor: 0.01 },
  l: { base: 'l', factor: 1 },
  g: { base: 'kg', factor: 0.001 },
  kg: { base: 'kg', factor: 1 },
};

// 1500 ml → 1.5 l. Returns null when the units cannot be compared.
export const convertQuantity = (
  quantity: number,
  fromUnit: string | null,
  toUnit: string | null,
): number | null => {
  const from = fromUnit ? UNIT_FACTORS[fromUnit.toLowerCase()] : undefined;
  const to = toUnit ? UNIT_FACTORS[toUnit.toLowerCase()] : undefined;

  if (!from || !to || from.base !== to.base) {
    return null;
  }

  return Math.round(((quantity * from.factor) / to.factor) * 1000) / 1000;
};

export const isValidBarcode = (barcode: string) => /^\d{8,14}$/.test(barcode);

export const parseProduct = (barcode: string, json: unknown): CommunityProduct | null => {
  const root = asObject(json);
  const product = asObject(root?.product);

  if (!product || root?.status === 0) {
    return null;
  }

  return {
    barcode,
    name: asString(product.product_name),
    brand: asString(product.brands),
    quantity: asNumber(product.product_quantity),
    quantityUnit: asString(product.product_quantity_unit),
  };
};

export const parsePrices = (json: unknown, productUnit: string | null): CommunityPrice[] => {
  const items = asObject(json)?.items;

  if (!Array.isArray(items)) {
    return [];
  }

  return items.flatMap((raw) => {
    const item = asObject(raw);
    const price = asNumber(item?.price);
    const currency = asString(item?.currency);
    const date = asString(item?.date);

    if (!item || price === null || price <= 0 || !currency || !date) {
      return [];
    }

    const product = asObject(item.product);
    const location = asObject(item.location);
    const quantity = asNumber(product?.product_quantity);
    const name = asString(location?.osm_name);
    const place = [asString(location?.osm_address_city), asString(location?.osm_address_country)]
      .filter(Boolean)
      .join(', ');

    return [
      {
        price,
        currency,
        date,
        isDiscounted: item.price_is_discounted === true,
        store: name ? (place ? `${name} (${place})` : name) : null,
        packQuantity:
          quantity === null
            ? null
            : convertQuantity(quantity, asString(product?.product_quantity_unit), productUnit),
      },
    ];
  });
};

const getJson = async (url: string, fetchImpl: typeof fetch): Promise<unknown> => {
  const response = await fetchImpl(url, { headers: { 'User-Agent': OFF_USER_AGENT } });

  if (!response.ok) {
    throw new Error(`Open Food Facts request failed with ${response.status}`);
  }

  return response.json();
};

export const lookupCommunityData = async (
  barcode: string,
  productUnit: string | null,
  fetchImpl: typeof fetch = fetch,
) => {
  if (!isValidBarcode(barcode)) {
    throw new Error('A barcode has 8 to 14 digits.');
  }

  const [productJson, pricesJson] = await Promise.all([
    getJson(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=product_name,brands,product_quantity,product_quantity_unit`,
      fetchImpl,
    ),
    getJson(
      `https://prices.openfoodfacts.org/api/v1/prices?product_code=${barcode}&order_by=-date&size=20`,
      fetchImpl,
    ),
  ]);

  return {
    product: parseProduct(barcode, productJson),
    prices: parsePrices(pricesJson, productUnit),
    source: 'Open Food Facts / Open Prices (ODbL, community data)',
  };
};
