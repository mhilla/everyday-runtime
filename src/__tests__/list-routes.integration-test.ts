import { afterAll, describe, expect, it } from 'vitest';
import { RestApiClient } from 'twenty-client-sdk/rest';

import listRoute from 'src/logic-functions/list';
import listUpdateRoute from 'src/logic-functions/list-update';

// The routes the Home Assistant integration uses, against the real server.
const client = new RestApiClient({
  baseUrl: process.env.TWENTY_API_URL,
  token: process.env.TWENTY_API_KEY,
});
const name = `Testmilch ${Date.now()}`;

type Handler = (params: Record<string, unknown>) => Promise<Record<string, unknown>>;
const call = (route: { config: { handler: unknown } }, params: Record<string, unknown>) =>
  (route.config.handler as Handler)(params);
type Item = { id: string; name: string; status: string };

afterAll(async () => {
  const found = await client.get<{ data: { products: { id: string }[] } }>('/rest/products', {
    query: { filter: `name[eq]:"${name}"` },
  });

  for (const product of found.data.products) {
    await client.delete(`/rest/products/${product.id}`, { query: { soft_delete: false } });
  }
});

describe('list routes', () => {
  it('adds, checks off and reopens an item', async () => {
    const added = (await call(listUpdateRoute, { body: { action: 'add', name } })) as {
      ok: boolean;
      list: { items: Item[] };
    };

    expect(added.ok).toBe(true);
    const item = added.list.items.find((entry) => entry.name === name);

    expect(item?.status).toBe('OPEN');

    const completed = (await call(listUpdateRoute, { body: { action: 'complete', id: item!.id } })) as {
      message: string;
    };

    expect(completed.message).toBe('purchased');
    const list = (await call(listRoute, {})) as { items: Item[] };

    expect(list.items.find((entry) => entry.id === item!.id)?.status).toBe('PURCHASED');

    await call(listUpdateRoute, { body: { action: 'reopen', id: item!.id } });
    const reopened = (await call(listRoute, {})) as { items: Item[] };

    expect(reopened.items.find((entry) => entry.id === item!.id)?.status).toBe('OPEN');
  });

  it('explains a malformed request', async () => {
    expect(await call(listUpdateRoute, { body: { action: 'delete' } })).toMatchObject({ ok: false });
  });
});
