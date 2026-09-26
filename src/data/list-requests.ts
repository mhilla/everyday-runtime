import type { HouseholdActions } from 'src/data/household-actions';
import type { HouseholdSnapshot } from 'src/domain/shopping';

export type ListRequest =
  | { action: 'add'; name: string }
  | { action: 'complete' | 'reopen' | 'remove'; id: string };

export type ListRequestResult = { ok: true; message: string } | { ok: false; error: string };

const ID_ACTIONS = ['complete', 'reopen', 'remove'] as const;

export const parseListRequest = (body: unknown): ListRequest | null => {
  const input = (body ?? {}) as { action?: unknown; name?: unknown; id?: unknown };

  if (input.action === 'add' && typeof input.name === 'string' && input.name.trim() !== '') {
    return { action: 'add', name: input.name.trim().slice(0, 200) };
  }
  if (
    ID_ACTIONS.includes(input.action as (typeof ID_ACTIONS)[number]) &&
    typeof input.id === 'string' &&
    input.id !== ''
  ) {
    return { action: input.action as (typeof ID_ACTIONS)[number], id: input.id };
  }

  return null;
};

// One change to the shopping list from an external to-do list. Uses the same
// actions as the app, so checking off in Home Assistant records a purchase
// and the engine learns from it.
export const runListRequest = async (
  request: ListRequest,
  { actions, snapshot }: { actions: HouseholdActions; snapshot: HouseholdSnapshot },
): Promise<ListRequestResult> => {
  const openItems = snapshot.shoppingItems.filter((item) => item.status === 'OPEN');

  if (request.action === 'add') {
    const result = await actions.quickAddToList(request.name, snapshot.products, openItems);

    return result
      ? { ok: true, message: result.alreadyOnList ? 'already on the list' : 'added' }
      : { ok: false, error: 'Could not read that item.' };
  }

  const item = snapshot.shoppingItems.find((candidate) => candidate.id === request.id);

  if (!item) {
    return { ok: false, error: 'No such item on the list.' };
  }

  if (request.action === 'reopen') {
    if (item.status !== 'OPEN') {
      await actions.reopenItem(item);
    }

    return { ok: true, message: 'reopened' };
  }

  // "Clear completed" in a to-do list removes checked-off items too; the
  // purchase itself stays recorded.
  if (request.action === 'remove') {
    if (item.status !== 'DISMISSED') {
      await actions.removeFromList(item);
    }

    return { ok: true, message: 'removed' };
  }

  if (item.status !== 'OPEN') {
    return { ok: true, message: 'nothing to do' };
  }

  const product = snapshot.products.find((candidate) => candidate.id === item.productId);

  if (!product) {
    await actions.removeFromList(item);

    return { ok: true, message: 'removed (no product to record a purchase for)' };
  }
  await actions.markPurchased(item, product, { quantity: item.requestedQuantity });

  return { ok: true, message: 'purchased' };
};
