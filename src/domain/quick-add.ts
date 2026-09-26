import type { Product } from 'src/domain/types';

export type QuickAddInput = {
  name: string;
  quantity: number | null;
};

// Accepts what people actually type: "milk", "2 milk", "2x milk", "milk x2",
// "1.5 kg apples" is kept as a name (units are not parsed in v0.1).
export const parseQuickAdd = (raw: string): QuickAddInput | null => {
  const input = raw.trim().replace(/\s+/g, ' ');

  if (input === '') {
    return null;
  }

  const leading = input.match(/^(\d+(?:[.,]\d+)?)\s*[x×]?\s+(.+)$/i);

  if (leading) {
    return { name: leading[2].trim(), quantity: Number(leading[1].replace(',', '.')) };
  }

  const trailing = input.match(/^(.+?)\s+[x×]\s*(\d+(?:[.,]\d+)?)$/i);

  if (trailing) {
    return { name: trailing[1].trim(), quantity: Number(trailing[2].replace(',', '.')) };
  }

  return { name: input, quantity: null };
};

const normalize = (name: string) => name.trim().toLocaleLowerCase();

// Finds an existing product by name, preferring active ones, so that typing
// "milk" never creates a second "Milk".
export const findProductByName = (
  products: Product[],
  name: string,
): Product | null => {
  const wanted = normalize(name);
  const matches = products.filter((product) => normalize(product.name) === wanted);

  return matches.find((product) => !product.archived) ?? matches[0] ?? null;
};

// Upper-cases the first letter only: "paper towels" -> "Paper towels".
export const toDisplayName = (name: string) => {
  const trimmed = name.trim();

  return trimmed.charAt(0).toLocaleUpperCase() + trimmed.slice(1);
};
