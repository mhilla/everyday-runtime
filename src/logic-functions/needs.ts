import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineLogicFunction } from 'twenty-sdk/define';

import { NEEDS_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { createHouseholdRepository } from 'src/data/household-repository';
import { buildNeedsReport } from 'src/domain/needs-report';
import { buildOverview } from 'src/domain/shopping';

// GET /s/needs — what the household probably needs right now, as JSON.
// Runs the same deterministic engine as the UI, as the calling person.
const handler = async () => {
  const repository = createHouseholdRepository(new RestApiClient());
  const snapshot = await repository.loadSnapshot();
  const now = new Date();

  return buildNeedsReport(buildOverview(snapshot, now), now);
};

export default defineLogicFunction({
  universalIdentifier: NEEDS_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'needs',
  description: 'Returns the products the household probably needs, with confidence and reason.',
  timeoutSeconds: 20,
  handler,
  httpRouteTriggerSettings: {
    path: '/needs',
    httpMethod: 'GET',
    isAuthRequired: true,
  },
});
