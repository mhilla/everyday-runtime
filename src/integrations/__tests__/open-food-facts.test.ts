import { describe, expect, it } from 'vitest';

import {
  convertQuantity,
  isValidBarcode,
  lookupCommunityData,
  OFF_USER_AGENT,
  parsePrices,
  parseProduct,
} from 'src/integrations/open-food-facts';

// Shapes recorded from the real APIs (2026-09-26), trimmed.
const PRODUCT = {
  code: '3057640257773',
  status: 1,
  product: {
    brands: 'Volvic',
    product_name: 'Eau Minérale Naturelle',
    product_quantity: 1500,
    product_quantity_unit: 'ml',
  },
};
const PRICES = {
  total: 1,
  items: [
    {
      price: 0.64,
      price_is_discounted: false,
      currency: 'EUR',
      date: '2026-02-18',
      product: { product_quantity: 1500, product_quantity_unit: 'ml' },
      location: { osm_name: 'Carrefour City', osm_address_city: 'Clichy', osm_address_country: 'France' },
    },
    { price: 'oops', currency: 'EUR', date: '2026-02-01' },
  ],
};

describe('convertQuantity', () => {
  it('converts between compatible units', () => {
    expect(convertQuantity(1500, 'ml', 'l')).toBe(1.5);
    expect(convertQuantity(500, 'g', 'kg')).toBe(0.5);
    expect(convertQuantity(2, 'l', 'l')).toBe(2);
  });

  it('refuses incompatible or unknown units', () => {
    expect(convertQuantity(1500, 'ml', 'kg')).toBeNull();
    expect(convertQuantity(6, 'pack', 'pack')).toBeNull();
    expect(convertQuantity(1, null, 'l')).toBeNull();
  });
});

describe('parsers', () => {
  it('reads product data', () => {
    expect(parseProduct('3057640257773', PRODUCT)).toEqual({
      barcode: '3057640257773',
      name: 'Eau Minérale Naturelle',
      brand: 'Volvic',
      quantity: 1500,
      quantityUnit: 'ml',
    });
    expect(parseProduct('1', { status: 0 })).toBeNull();
  });

  it('reads prices, converts pack size and skips broken entries', () => {
    expect(parsePrices(PRICES, 'l')).toEqual([
      {
        price: 0.64,
        currency: 'EUR',
        date: '2026-02-18',
        isDiscounted: false,
        store: 'Carrefour City (Clichy, France)',
        packQuantity: 1.5,
      },
    ]);
    expect(parsePrices({ items: 'nope' }, 'l')).toEqual([]);
  });
});

describe('lookupCommunityData', () => {
  it('validates barcodes', async () => {
    expect(isValidBarcode('3057640257773')).toBe(true);
    expect(isValidBarcode('12ab')).toBe(false);
    await expect(lookupCommunityData('12ab', 'l')).rejects.toThrow('8 to 14 digits');
  });

  it('calls both APIs with an identifying user agent', async () => {
    const requested: { url: string; agent: string | null }[] = [];
    const fakeFetch = (async (url: string, init?: RequestInit) => {
      requested.push({ url, agent: new Headers(init?.headers).get('User-Agent') });

      return new Response(JSON.stringify(url.includes('prices') ? PRICES : PRODUCT));
    }) as typeof fetch;

    const result = await lookupCommunityData('3057640257773', 'l', fakeFetch);

    expect(result.product?.brand).toBe('Volvic');
    expect(result.prices).toHaveLength(1);
    expect(requested.map((r) => r.agent)).toEqual([OFF_USER_AGENT, OFF_USER_AGENT]);
    expect(requested[1].url).toContain('product_code=3057640257773');
  });
});
