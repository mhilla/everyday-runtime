import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineLogicFunction } from 'twenty-sdk/define';
import type { RoutePayload } from 'twenty-sdk/logic-function';

import { LIST_UPDATE_ROUTE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { createHouseholdActions } from 'src/data/household-actions';
import { createHouseholdRepository } from 'src/data/household-repository';
import { parseListRequest, runListRequest } from 'src/data/list-requests';
import { buildListView } from 'src/domain/list-view';

// POST /s/list/items  {"action": "add", "name": "2 Milch"}
//                     {"action": "complete" | "reopen" | "remove", "id": "<item id>"}
// Answers with the result and the updated list.
const handler = async (event: RoutePayload) => {
  const request = parseListRequest(event.body);

  if (!request) {
    return {
      ok: false,
      error: 'Send {"action": "add", "name": "Milch"} or {"action": "complete" | "reopen" | "remove", "id": "…"}.',
    };
  }

  const repository = createHouseholdRepository(new RestApiClient());
  const actions = createHouseholdActions(repository);
  const result = await runListRequest(request, { actions, snapshot: await repository.loadSnapshot() });
  const snapshot = await repository.loadSnapshot();

  return { ...result, list: buildListView(snapshot.shoppingItems, snapshot.products, new Date()) };
};

export default defineLogicFunction({
  universalIdentifier: LIST_UPDATE_ROUTE_UNIVERSAL_IDENTIFIER,
  name: 'list-update',
  description: 'Adds, checks off, reopens or removes one shopping list item.',
  timeoutSeconds: 30,
  handler,
  httpRouteTriggerSettings: {
    path: '/list/items',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
