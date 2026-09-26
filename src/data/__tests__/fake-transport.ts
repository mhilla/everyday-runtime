import type { RestTransport } from 'src/data/household-repository';

export type RecordedCall = {
  method: 'GET' | 'POST' | 'PATCH';
  path: string;
  body?: unknown;
  query?: Record<string, unknown>;
};

const singular: Record<string, string> = {
  products: 'Product',
  observations: 'Observation',
  shoppingItems: 'ShoppingItem',
  purchases: 'Purchase',
};

// In-memory stand-in for Twenty's REST API: answers creates with the posted
// body plus an id, and lists from the `lists` fixture (paged by `pages`).
export const createFakeTransport = (
  lists: Record<string, Record<string, unknown>[][]> = {},
) => {
  const calls: RecordedCall[] = [];
  let nextId = 1;

  const transport: RestTransport = {
    async get<T>(path: string, options?: { query?: Record<string, unknown> }) {
      calls.push({ method: 'GET', path, query: options?.query });

      const name = path.replace('/rest/', '');
      const pages = lists[name] ?? [[]];
      const cursor = options?.query?.starting_after;
      const pageIndex = typeof cursor === 'string' ? Number(cursor) : 0;

      return {
        data: { [name]: pages[pageIndex] ?? [] },
        pageInfo: {
          hasNextPage: pageIndex + 1 < pages.length,
          endCursor: String(pageIndex + 1),
        },
      } as T;
    },
    async post<T>(path: string, body?: unknown) {
      calls.push({ method: 'POST', path, body });

      const isBatch = path.startsWith('/rest/batch/');
      const name = path.replace('/rest/batch/', '').replace('/rest/', '');
      const key = `create${singular[name]}${isBatch ? 's' : ''}`;
      const withId = (record: unknown) => ({
        ...(record as Record<string, unknown>),
        id: `id-${nextId++}`,
      });

      return {
        data: {
          [key]: isBatch ? (body as unknown[]).map(withId) : withId(body),
        },
      } as T;
    },
    async patch<T>(path: string, body?: unknown) {
      calls.push({ method: 'PATCH', path, body });

      return { data: {} } as T;
    },
  };

  return { transport, calls };
};
