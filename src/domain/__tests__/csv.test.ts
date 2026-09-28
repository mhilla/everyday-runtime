import { describe, expect, it } from 'vitest';

import {
  escapeCsvCell,
  exportProductsCsv,
  matchCategory,
  parseCsv,
  parseProductsCsv,
} from 'src/domain/csv';
import type { Product } from 'src/domain/types';

describe('CSV module', () => {
  describe('escapeCsvCell', () => {
    it('returns empty string for null and undefined', () => {
      expect(escapeCsvCell(null)).toBe('');
      expect(escapeCsvCell(undefined)).toBe('');
    });

    it('returns simple strings untouched', () => {
      expect(escapeCsvCell('Milk')).toBe('Milk');
      expect(escapeCsvCell(42)).toBe('42');
    });

    it('escapes cells containing commas, quotes, semicolons or newlines', () => {
      expect(escapeCsvCell('Apples, red')).toBe('"Apples, red"');
      expect(escapeCsvCell('Salt; pepper')).toBe('"Salt; pepper"');
      expect(escapeCsvCell('12" Pizza')).toBe('"12"" Pizza"');
      expect(escapeCsvCell('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
    });
  });

  describe('matchCategory', () => {
    it('matches standard category names case-insensitively', () => {
      expect(matchCategory('DAIRY')).toBe('DAIRY');
      expect(matchCategory('dairy')).toBe('DAIRY');
      expect(matchCategory('Produce')).toBe('PRODUCE');
      expect(matchCategory('household')).toBe('HOUSEHOLD');
    });

    it('matches German category aliases', () => {
      expect(matchCategory('Milchprodukte')).toBe('DAIRY');
      expect(matchCategory('Obst & Gemüse')).toBe('PRODUCE');
      expect(matchCategory('Gemüse')).toBe('PRODUCE');
      expect(matchCategory('Backwaren')).toBe('BAKERY');
      expect(matchCategory('Getränke')).toBe('BEVERAGES');
      expect(matchCategory('Vorrat')).toBe('PANTRY');
      expect(matchCategory('Drogerie')).toBe('HOUSEHOLD');
      expect(matchCategory('Tiefkühl')).toBe('FROZEN');
    });

    it('returns null for unknown categories', () => {
      expect(matchCategory('')).toBeNull();
      expect(matchCategory('Cars')).toBeNull();
      expect(matchCategory(null)).toBeNull();
    });
  });

  describe('parseCsv', () => {
    it('parses comma-separated values', () => {
      const csv = 'name,category\nMilk,dairy\nCoffee,pantry';
      expect(parseCsv(csv)).toEqual([
        ['name', 'category'],
        ['Milk', 'dairy'],
        ['Coffee', 'pantry'],
      ]);
    });

    it('auto-detects semicolons in German CSVs', () => {
      const csv = 'Name;Kategorie;Einheit\nMilch;Molkerei;l\nBrot;Bäckerei;Stk';
      expect(parseCsv(csv)).toEqual([
        ['Name', 'Kategorie', 'Einheit'],
        ['Milch', 'Molkerei', 'l'],
        ['Brot', 'Bäckerei', 'Stk'],
      ]);
    });

    it('handles quoted fields and escaped quotes', () => {
      const csv = 'name,note\n"Pizza, frozen","Very ""tasty"""\nApples,crisp';
      expect(parseCsv(csv)).toEqual([
        ['name', 'note'],
        ['Pizza, frozen', 'Very "tasty"'],
        ['Apples', 'crisp'],
      ]);
    });

    it('handles empty and trailing lines gracefully', () => {
      const csv = '\n\nMilk,dairy\n\n\n';
      expect(parseCsv(csv)).toEqual([['Milk', 'dairy']]);
    });
  });

  describe('exportProductsCsv and parseProductsCsv round-trip', () => {
    const products: Product[] = [
      {
        id: '1',
        name: 'Whole Milk',
        category: 'DAIRY',
        defaultUnit: 'l',
        typicalPurchaseQuantity: 2,
        shelfLifeDays: 7,
        barcode: '4008400401025',
        archived: false,
        priceAlertUnitPrice: null,
      },
      {
        id: '2',
        name: 'Organic Apples',
        category: 'PRODUCE',
        defaultUnit: 'kg',
        typicalPurchaseQuantity: 1.5,
        shelfLifeDays: 14,
        barcode: null,
        archived: false,
        priceAlertUnitPrice: null,
      },
      {
        id: '3',
        name: 'Old Bread',
        category: 'BAKERY',
        defaultUnit: null,
        typicalPurchaseQuantity: null,
        shelfLifeDays: null,
        barcode: null,
        archived: true, // should be excluded from export
        priceAlertUnitPrice: null,
      },
    ];

    it('exports active products to CSV format', () => {
      const exported = exportProductsCsv(products);
      expect(exported).toContain('name,category,defaultUnit,typicalPurchaseQuantity,shelfLifeDays,barcode');
      expect(exported).toContain('Whole Milk,dairy,l,2,7,4008400401025');
      expect(exported).toContain('Organic Apples,produce,kg,1.5,14,');
      expect(exported).not.toContain('Old Bread');
    });

    it('round-trips products faithfully', () => {
      const exported = exportProductsCsv(products);
      const parsed = parseProductsCsv(exported);

      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toEqual({
        name: 'Whole Milk',
        category: 'DAIRY',
        defaultUnit: 'l',
        typicalPurchaseQuantity: 2,
        shelfLifeDays: 7,
        barcode: '4008400401025',
      });
      expect(parsed[1]).toEqual({
        name: 'Organic Apples',
        category: 'PRODUCE',
        defaultUnit: 'kg',
        typicalPurchaseQuantity: 1.5,
        shelfLifeDays: 14,
        barcode: null,
      });
    });

    it('parses German headers and formats', () => {
      const germanCsv = 'Produkt;Kategorie;Einheit;Standardmenge;Haltbarkeit\nHafermilch;Milch;l;3;10';
      const parsed = parseProductsCsv(germanCsv);

      expect(parsed).toEqual([
        {
          name: 'Hafermilch',
          category: 'DAIRY',
          defaultUnit: 'l',
          typicalPurchaseQuantity: 3,
          shelfLifeDays: 10,
          barcode: null,
        },
      ]);
    });

    it('parses headerless CSV with fallback column positions', () => {
      const headerless = 'Butter,dairy,pack\nTomatoes,produce,kg';
      const parsed = parseProductsCsv(headerless);

      expect(parsed).toEqual([
        {
          name: 'Butter',
          category: 'DAIRY',
          defaultUnit: 'pack',
          typicalPurchaseQuantity: null,
          shelfLifeDays: null,
          barcode: null,
        },
        {
          name: 'Tomatoes',
          category: 'PRODUCE',
          defaultUnit: 'kg',
          typicalPurchaseQuantity: null,
          shelfLifeDays: null,
          barcode: null,
        },
      ]);
    });
  });
});
