import type { Product, ProductCategory } from 'src/domain/types';
import { PRODUCT_CATEGORIES } from 'src/domain/types';
import { toDisplayName } from 'src/domain/quick-add';

export type ParsedProductInput = {
  name: string;
  category: ProductCategory | null;
  defaultUnit: string | null;
  typicalPurchaseQuantity: number | null;
  shelfLifeDays: number | null;
  barcode: string | null;
};

const CATEGORY_MAP: Record<string, ProductCategory> = {
  dairy: 'DAIRY',
  milch: 'DAIRY',
  milchprodukte: 'DAIRY',
  molkerei: 'DAIRY',
  bakery: 'BAKERY',
  bäckerei: 'BAKERY',
  backwaren: 'BAKERY',
  brot: 'BAKERY',
  produce: 'PRODUCE',
  obst: 'PRODUCE',
  gemüse: 'PRODUCE',
  'obst & gemüse': 'PRODUCE',
  'fruit & veg': 'PRODUCE',
  fruits: 'PRODUCE',
  vegetables: 'PRODUCE',
  pantry: 'PANTRY',
  vorrat: 'PANTRY',
  grundnahrungsmittel: 'PANTRY',
  beverages: 'BEVERAGES',
  getränke: 'BEVERAGES',
  drinks: 'BEVERAGES',
  frozen: 'FROZEN',
  tiefkühl: 'FROZEN',
  tk: 'FROZEN',
  household: 'HOUSEHOLD',
  haushalt: 'HOUSEHOLD',
  drogerie: 'HOUSEHOLD',
  cleaning: 'HOUSEHOLD',
  personal_care: 'PERSONAL_CARE',
  körperpflege: 'PERSONAL_CARE',
  pflege: 'PERSONAL_CARE',
  hygiene: 'PERSONAL_CARE',
  other: 'OTHER',
  sonstiges: 'OTHER',
};

export const matchCategory = (raw: string | null | undefined): ProductCategory | null => {
  if (!raw) {
    return null;
  }

  const normalized = raw.trim().toLowerCase();

  if (normalized === '') {
    return null;
  }

  const upper = normalized.toUpperCase();

  if (PRODUCT_CATEGORIES.includes(upper as ProductCategory)) {
    return upper as ProductCategory;
  }

  return CATEGORY_MAP[normalized] ?? null;
};

export const escapeCsvCell = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  if (/[",;\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
};

// RFC 4180 CSV parser supporting custom or auto-detected delimiters (, ; \t)
// and quoted multi-line fields.
export const parseCsv = (csvText: string, delimiterOverride?: string): string[][] => {
  const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  if (text.trim() === '') {
    return [];
  }

  const firstLine = text.split('\n')[0] ?? '';
  let delimiter = delimiterOverride;

  if (!delimiter) {
    const commas = (firstLine.match(/,/g) || []).length;
    const semicolons = (firstLine.match(/;/g) || []).length;
    const tabs = (firstLine.match(/\t/g) || []).length;

    if (semicolons > commas && semicolons >= tabs) {
      delimiter = ';';
    } else if (tabs > commas && tabs > semicolons) {
      delimiter = '\t';
    } else {
      delimiter = ',';
    }
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          currentCell += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if (char === '\n') {
      currentRow.push(currentCell.trim());
      currentCell = '';
      if (currentRow.some((c) => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentCell += char;
    }
  }

  currentRow.push(currentCell.trim());
  if (currentRow.some((c) => c !== '')) {
    rows.push(currentRow);
  }

  return rows;
};

// Exports products as a standard CSV string.
export const exportProductsCsv = (products: Product[], delimiter = ','): string => {
  const activeProducts = products.filter((p) => !p.archived);
  const headers = ['name', 'category', 'defaultUnit', 'typicalPurchaseQuantity', 'shelfLifeDays', 'barcode'];
  const lines = [headers.join(delimiter)];

  for (const product of activeProducts) {
    const row = [
      escapeCsvCell(product.name),
      escapeCsvCell(product.category?.toLowerCase() ?? ''),
      escapeCsvCell(product.defaultUnit ?? ''),
      escapeCsvCell(product.typicalPurchaseQuantity ?? ''),
      escapeCsvCell(product.shelfLifeDays ?? ''),
      escapeCsvCell(product.barcode ?? ''),
    ];

    lines.push(row.join(delimiter));
  }

  return lines.join('\r\n') + '\r\n';
};

const HEADER_ALIASES = {
  name: ['name', 'product', 'produkt', 'title', 'artikel', 'item', 'bezeichnung'],
  category: ['category', 'kategorie', 'bereich', 'abteilung'],
  defaultUnit: ['unit', 'defaultunit', 'einheit', 'packungseinheit'],
  typicalPurchaseQuantity: [
    'typicalpurchasequantity',
    'typicalquantity',
    'quantity',
    'menge',
    'standardmenge',
    'typischemenge',
  ],
  shelfLifeDays: ['shelflifedays', 'shelflife', 'haltbarkeit', 'haltbarkeitstage', 'tagehaltbar'],
  barcode: ['barcode', 'ean', 'gtin', 'upc'],
};

const findColumnIndex = (headers: string[], aliases: string[]): number =>
  headers.findIndex((h) => aliases.includes(h.toLowerCase().replace(/[\s_-]+/g, '')));

// Parses a CSV string into structured product inputs.
// Handles headers flexibly or falls back to column positions: 0=name, 1=category, 2=unit.
export const parseProductsCsv = (csvText: string): ParsedProductInput[] => {
  const rows = parseCsv(csvText);

  if (rows.length === 0) {
    return [];
  }

  const firstRow = rows[0];
  const nameIndex = findColumnIndex(firstRow, HEADER_ALIASES.name);
  let dataRows: string[][];
  let colName = 0;
  let colCategory = 1;
  let colUnit = 2;
  let colQuantity = 3;
  let colShelfLife = 4;
  let colBarcode = 5;

  if (nameIndex !== -1) {
    // Has header row
    colName = nameIndex;
    colCategory = findColumnIndex(firstRow, HEADER_ALIASES.category);
    colUnit = findColumnIndex(firstRow, HEADER_ALIASES.defaultUnit);
    colQuantity = findColumnIndex(firstRow, HEADER_ALIASES.typicalPurchaseQuantity);
    colShelfLife = findColumnIndex(firstRow, HEADER_ALIASES.shelfLifeDays);
    colBarcode = findColumnIndex(firstRow, HEADER_ALIASES.barcode);
    dataRows = rows.slice(1);
  } else {
    dataRows = rows;
  }

  const results: ParsedProductInput[] = [];

  for (const row of dataRows) {
    const rawName = row[colName] ?? '';
    const name = toDisplayName(rawName.trim());

    if (name === '') {
      continue;
    }

    const rawCategory = colCategory !== -1 ? row[colCategory] : undefined;
    const rawUnit = colUnit !== -1 ? row[colUnit] : undefined;
    const rawQuantity = colQuantity !== -1 ? row[colQuantity] : undefined;
    const rawShelfLife = colShelfLife !== -1 ? row[colShelfLife] : undefined;
    const rawBarcode = colBarcode !== -1 ? row[colBarcode] : undefined;

    const parsedQty = rawQuantity ? Number(rawQuantity.replace(',', '.')) : null;
    const typicalPurchaseQuantity = parsedQty && Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : null;

    const parsedShelf = rawShelfLife ? parseInt(rawShelfLife, 10) : null;
    const shelfLifeDays = parsedShelf && Number.isFinite(parsedShelf) && parsedShelf > 0 ? parsedShelf : null;

    results.push({
      name,
      category: matchCategory(rawCategory),
      defaultUnit: rawUnit && rawUnit.trim() !== '' ? rawUnit.trim() : null,
      typicalPurchaseQuantity,
      shelfLifeDays,
      barcode: rawBarcode && rawBarcode.trim() !== '' ? rawBarcode.trim() : null,
    });
  }

  return results;
};
