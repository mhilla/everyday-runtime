import { describe, expect, it } from 'vitest';

import { createHouseholdActions } from 'src/data/household-actions';
import { createHouseholdRepository } from 'src/data/household-repository';
import { parseListRequest, runListRequest } from 'src/data/list-requests';
import type { HouseholdSnapshot } from 'src/domain/shopping';

import { daysAgo, NOW, product, shoppingItem } from 'src/domain/__tests__/fixtures';
import { createFakeTransport } from './fake-transport';

const milk = product();
const snapshot: HouseholdSnapshot = {
  products: [milk],
  observations: [],
  shoppingItems: [
    shoppingItem({ id: 'open', requestedQuantity: 2 }),
    shoppingItem({ id: 'done', status: 'PURCHASED', purchasedAt: daysAgo(1) }),
  ],
};

const setup = () => {
  const { transport, calls } = createFakeTransport();
  const actions = createHouseholdActions(createHouseholdRepository(transport), () => NOW);

  return { calls, run: (body: unknown) => runListRequest(parseListRequest(body)!, { actions, snapshot }) };
};

describe('parseListRequest', () => {
  it('accepts only well-formed requests', () => {
    expect(parseListRequest({ action: 'add', name: ' 2 Milch ' })).toEqual({ action: 'add', name: '2 Milch' });
    expect(parseListRequest({ action: 'complete', id: 'open' })).toEqual({ action: 'complete', id: 'open' });
    expect(parseListRequest({ action: 'add', name: '' })).toBeNull();
    expect(parseListRequest({ action: 'delete', id: 'open' })).toBeNull();
    expect(parseListRequest(null)).toBeNull();
  });
});

describe('runListRequest', () => {
  it('checking off records a purchase so the engine learns from it', async () => {
    const { run, calls } = setup();

    expect(await run({ action: 'complete', id: 'open' })).toEqual({ ok: true, message: 'purchased' });
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      'PATCH /rest/shoppingItems/open',
      'POST /rest/purchases',
      'POST /rest/observations',
    ]);
    expect(calls[1].body).toMatchObject({ quantity: 2 });
  });

  it('removes, reopens and ignores repeats', async () => {
    const { run, calls } = setup();

    expect(await run({ action: 'remove', id: 'open' })).toEqual({ ok: true, message: 'removed' });
    expect(calls[0].body).toMatchObject({ status: 'DISMISSED' });
    expect(await run({ action: 'reopen', id: 'done' })).toEqual({ ok: true, message: 'reopened' });
    expect(calls[1].body).toMatchObject({ status: 'OPEN', purchasedAt: null, dismissedAt: null });
    expect(await run({ action: 'complete', id: 'done' })).toEqual({ ok: true, message: 'nothing to do' });
    expect(await run({ action: 'complete', id: 'missing' })).toEqual({ ok: false, error: 'No such item on the list.' });
    expect(calls).toHaveLength(2);
    expect(await run({ action: 'remove', id: 'done' })).toEqual({ ok: true, message: 'removed' });
    expect(calls[2]).toMatchObject({ path: '/rest/shoppingItems/done', body: { status: 'DISMISSED' } });
  });

  it('adds through the same quick add as the app', async () => {
    const { run } = setup();

    expect(await run({ action: 'add', name: 'Milk' })).toEqual({ ok: true, message: 'already on the list' });
    expect(await run({ action: 'add', name: 'Butter' })).toEqual({ ok: true, message: 'added' });
  });
});
