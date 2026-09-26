import { addDays } from 'src/domain/time';
import type { Product, ShoppingItem } from 'src/domain/types';

export type ListViewItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  status: 'OPEN' | 'PURCHASED';
  suggested: boolean;
  reason: string | null;
  updatedAt: string;
};

export type ListView = {
  generatedAt: string;
  openCount: number;
  items: ListViewItem[];
};

export const RECENTLY_PURCHASED_DAYS = 7;

// The shopping list as external to-do lists see it (Home Assistant, widgets):
// open items first, then what was checked off in the last few days, so a
// check-off can still be undone there. Removed items are left out.
export const buildListView = (
  items: ShoppingItem[],
  products: Product[],
  now: Date,
): ListView => {
  const since = addDays(now, -RECENTLY_PURCHASED_DAYS);
  const unitOf = (item: ShoppingItem) =>
    products.find((product) => product.id === item.productId)?.defaultUnit ?? null;
  const toView = (item: ShoppingItem, status: ListViewItem['status']): ListViewItem => ({
    id: item.id,
    name: item.name,
    quantity: item.requestedQuantity,
    unit: unitOf(item),
    status,
    suggested: item.origin === 'INFERRED',
    reason: item.explanation,
    updatedAt: (status === 'PURCHASED' && item.purchasedAt ? item.purchasedAt : item.createdAt).toISOString(),
  });
  const open = items
    .filter((item) => item.status === 'OPEN')
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((item) => toView(item, 'OPEN'));
  const purchased = items
    .filter((item) => item.status === 'PURCHASED' && item.purchasedAt !== null && item.purchasedAt >= since)
    .sort((a, b) => (b.purchasedAt?.getTime() ?? 0) - (a.purchasedAt?.getTime() ?? 0))
    .map((item) => toView(item, 'PURCHASED'));

  return { generatedAt: now.toISOString(), openCount: open.length, items: [...open, ...purchased] };
};
