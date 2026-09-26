import { defineLogicFunction } from 'twenty-sdk/define';
import type { RoutePayload } from 'twenty-sdk/logic-function';

import { COMMUNITY_PRICES_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { lookupCommunityData } from 'src/integrations/open-food-facts';

// GET /s/community-prices?barcode=3057640257773&unit=l
// Product data and recent community prices from Open Food Facts / Open
// Prices. Runs server-side so the browser sandbox never calls third parties.
const handler = async (event: RoutePayload) => {
  const barcode = (event.queryStringParameters?.barcode ?? '').trim();
  const unit = event.queryStringParameters?.unit?.trim() || null;

  try {
    return await lookupCommunityData(barcode, unit);
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error), product: null, prices: [] };
  }
};

export default defineLogicFunction({
  universalIdentifier: COMMUNITY_PRICES_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'community-prices',
  description: 'Looks up product data and community prices for a barcode (Open Food Facts / Open Prices).',
  timeoutSeconds: 20,
  handler,
  httpRouteTriggerSettings: {
    path: '/community-prices',
    httpMethod: 'GET',
    isAuthRequired: true,
  },
});
