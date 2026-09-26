import { afterAll, describe, expect, it } from 'vitest';
import { RestApiClient } from 'twenty-client-sdk/rest';

import needsTool from 'src/logic-functions/everyday-needs.tool';
import productTool from 'src/logic-functions/everyday-product.tool';
import updateTool from 'src/logic-functions/everyday-update.tool';
import talkRoute from 'src/logic-functions/talk';

// The AI tools run exactly as Twenty's AI chat would call them, against the
// real server installed by global-setup.
const client = new RestApiClient({
  baseUrl: process.env.TWENTY_API_URL,
  token: process.env.TWENTY_API_KEY,
});
const name = `Testkaffee ${Date.now()}`;

type Handler = (params: Record<string, unknown>) => Promise<Record<string, unknown>>;
const call = (tool: { config: { handler: unknown } }, params: Record<string, unknown>) =>
  (tool.config.handler as Handler)(params);

afterAll(async () => {
  const found = await client.get<{ data: { products: { id: string; name: string }[] } }>(
    '/rest/products',
    { query: { filter: `name[eq]:"${name}"` } },
  );

  for (const product of found.data.products) {
    await client.delete(`/rest/products/${product.id}`, { query: { soft_delete: false } });
  }
});

describe('AI tools', () => {
  it('records a purchase in German', async () => {
    const result = await call(updateTool, {
      action: 'bought',
      products: `2 ${name}`,
      price: 9.98,
      store: 'Discounter',
      language: 'de',
    });

    expect(result).toEqual({
      ok: true,
      done: [`Top — 2 ${name} gekauft für 9,98 € bei Discounter.`],
    });
  });

  it('marks it empty and reports it as needed with a reason', async () => {
    await call(updateTool, { action: 'empty', products: name, language: 'de' });

    const needs = (await call(needsTool, { language: 'de' })) as {
      probablyNeeded: { product: string; status: string; confirmedByPerson: boolean; reason: string; onShoppingList: boolean }[];
    };
    const entry = needs.probablyNeeded.find((item) => item.product === name);

    expect(entry).toMatchObject({
      status: 'Leer',
      confirmedByPerson: true,
      reason: 'heute als leer gemeldet',
      onShoppingList: true,
    });
  });

  it('answers status and price questions', async () => {
    const result = (await call(productTool, { products: name, language: 'en' })) as {
      status: string[];
      prices: string[];
    };

    expect(result.status[0]).toMatch(new RegExp(`^${name}: Empty \\(95%\\)`));
    expect(result.prices[0]).toBe(`${name} usually costs 4.99 €.`);
  });

  it('understands a sentence over POST /s/talk', async () => {
    const result = await call(talkRoute, { body: { text: `${name} ist noch da` } });

    expect(result).toMatchObject({
      ok: true,
      intent: 'IN_STOCK',
      language: 'de',
      changed: true,
      reply: `Alles klar — ${name} ist noch da.`,
    });
  });

  it('rejects unknown actions without writing', async () => {
    expect(await call(updateTool, { action: 'teleport', products: name })).toMatchObject({ ok: false });
  });
});
