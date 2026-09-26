import { defineLogicFunction } from 'twenty-sdk/define';
import { jsonSchemaToInputSchema } from 'twenty-sdk/logic-function';
import type { InputJsonSchema } from 'twenty-sdk/logic-function';

import { NEEDS_TOOL_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { loadServerHousehold } from 'src/data/server-household';
import { selectDeals } from 'src/domain/deals';
import { renderMessage } from 'src/domain/messages';
import type { Lang } from 'src/domain/messages';
import { describeNeed } from 'src/domain/presentation';
import { selectOpenItems, selectProbablyNeeded } from 'src/domain/shopping';

// AI tool: what the household probably needs, what is on the list, and
// current good prices — compact, with reasons, in the requested language.
const handler = async (params: { language?: string }) => {
  const lang: Lang = params.language === 'de' ? 'de' : 'en';
  const { overview, prices, snapshot, now } = await loadServerHousehold();

  return {
    probablyNeeded: selectProbablyNeeded(overview).slice(0, 12).map((entry) => ({
      product: entry.product.name,
      status: describeNeed(entry.assessment, lang).label,
      likelyNeededPercent: Math.round(entry.assessment.needScore * 100),
      confirmedByPerson: !describeNeed(entry.assessment).isEstimate,
      reason: renderMessage(entry.assessment.reasonMessage, lang),
      onShoppingList: entry.openItem !== null,
    })),
    shoppingList: selectOpenItems(snapshot.shoppingItems).map((item) => ({
      product: item.name,
      quantity: item.requestedQuantity,
    })),
    goodPrices: selectDeals(overview, prices, now).map((deal) => ({
      product: deal.overview.product.name,
      unitPrice: Math.round(deal.point.unitPrice * 100) / 100,
      store: deal.point.store,
      judgement: renderMessage(deal.judgement.reasonMessage, lang),
      recommendation: deal.plan ? renderMessage(deal.plan.reasonMessage, lang) : null,
    })),
    note: 'Estimates, not stock counts. Always pass on the reason.',
  };
};

const inputSchema: InputJsonSchema = {
  type: 'object',
  properties: {
    language: { type: 'string', enum: ['en', 'de'], description: 'Language of labels and reasons; use the language the person speaks.' },
  },
};

export default defineLogicFunction({
  universalIdentifier: NEEDS_TOOL_UNIVERSAL_IDENTIFIER,
  name: 'everyday-needs',
  description:
    'Everyday Runtime: what the household probably needs to buy (with likelihood and reason), the current shopping list, and current good prices. Read-only.',
  timeoutSeconds: 20,
  handler,
  toolTriggerSettings: { inputSchema },
  workflowActionTriggerSettings: {
    label: 'Everyday: what do we need?',
    icon: 'IconShoppingCart',
    inputSchema: jsonSchemaToInputSchema(inputSchema),
  },
});
