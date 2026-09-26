import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineLogicFunction } from 'twenty-sdk/define';

import { LIST_ROUTE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { createHouseholdRepository } from 'src/data/household-repository';
import { buildListView } from 'src/domain/list-view';

// GET /s/list — the shopping list for external to-do lists (Home Assistant).
const handler = async () => {
  const snapshot = await createHouseholdRepository(new RestApiClient()).loadSnapshot();

  return buildListView(snapshot.shoppingItems, snapshot.products, new Date());
};

export default defineLogicFunction({
  universalIdentifier: LIST_ROUTE_UNIVERSAL_IDENTIFIER,
  name: 'list',
  description: 'Returns the shopping list: open items and what was checked off in the last 7 days.',
  timeoutSeconds: 20,
  handler,
  httpRouteTriggerSettings: {
    path: '/list',
    httpMethod: 'GET',
    isAuthRequired: true,
  },
});
