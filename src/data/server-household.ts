import { RestApiClient } from 'twenty-client-sdk/rest';

import { createHouseholdActions } from 'src/data/household-actions';
import { createHouseholdRepository } from 'src/data/household-repository';
import { pricesByProduct, toPricePoints } from 'src/domain/deals';
import { buildOverview } from 'src/domain/shopping';

// Everything a server-side entry point (HTTP route, AI tool) needs, loaded
// as the calling person so permissions are never exceeded.
export const loadServerHousehold = async () => {
  const repository = createHouseholdRepository(new RestApiClient());
  const snapshot = await repository.loadSnapshot();
  const now = new Date();

  return {
    now,
    snapshot,
    actions: createHouseholdActions(repository),
    overview: buildOverview(snapshot, now),
    prices: pricesByProduct(toPricePoints(snapshot.purchases ?? [], snapshot.priceObservations ?? []), now),
  };
};
