import { defineLogicFunction } from 'twenty-sdk/define';

import { PRODUCT_TOOL_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { loadServerHousehold } from 'src/data/server-household';
import { renderMessage } from 'src/domain/messages';
import type { Lang } from 'src/domain/messages';
import { answerQuestion } from 'src/domain/talk';

// AI tool: status and price knowledge for named products.
const handler = async (params: { products?: string; language?: string }) => {
  const lang: Lang = params.language === 'de' ? 'de' : 'en';
  const { overview, prices } = await loadServerHousehold();
  const names = (params.products ?? '').split(',').map((name) => name.trim()).filter(Boolean);
  const items = names.map((name) => ({ name, quantity: null }));
  const base = { items, price: null, store: null, lang, text: params.products ?? '' };
  const status = answerQuestion({ ...base, intent: 'ASK_PRODUCT' }, overview, prices, lang) ?? [];
  const price = answerQuestion({ ...base, intent: 'ASK_PRICE' }, overview, prices, lang) ?? [];

  return {
    status: status.map((message) => renderMessage(message, lang)),
    prices: price.map((message) => renderMessage(message, lang)),
  };
};

export default defineLogicFunction({
  universalIdentifier: PRODUCT_TOOL_UNIVERSAL_IDENTIFIER,
  name: 'everyday-product',
  description:
    'Everyday Runtime: for named products, whether they are probably needed (with reason) and what they usually cost / the lowest recent price and store. Read-only.',
  timeoutSeconds: 20,
  handler,
  toolTriggerSettings: {
    inputSchema: {
      type: 'object',
      properties: {
        products: { type: 'string', description: 'Comma-separated product names, e.g. "Milch, Kaffee".' },
        language: { type: 'string', enum: ['en', 'de'], description: 'Language of the answer.' },
      },
      required: ['products'],
    },
  },
});
