import { defineLogicFunction } from 'twenty-sdk/define';
import { jsonSchemaToInputSchema } from 'twenty-sdk/logic-function';
import type { InputJsonSchema } from 'twenty-sdk/logic-function';

import { UPDATE_TOOL_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { executeCommand } from 'src/data/command-executor';
import { loadServerHousehold } from 'src/data/server-household';
import { splitItems } from 'src/domain/commands';
import type { CommandIntent } from 'src/domain/commands';
import { renderMessage } from 'src/domain/messages';
import type { Lang } from 'src/domain/messages';

const ACTIONS: Record<string, CommandIntent> = {
  empty: 'EMPTY',
  in_stock: 'IN_STOCK',
  add_to_list: 'ADD',
  bought: 'BOUGHT',
};

// AI tool: record what happened. Uses exactly the same actions as the app's
// buttons, so every change shows up in Activity and feeds the estimates.
const handler = async (params: {
  action: string;
  products: string;
  price?: number;
  store?: string;
  language?: string;
}) => {
  const lang: Lang = params.language === 'de' ? 'de' : 'en';
  const intent = ACTIONS[params.action];
  const items = splitItems(params.products ?? '');

  if (!intent || items.length === 0) {
    return { ok: false, error: 'Use action empty | in_stock | add_to_list | bought and at least one product.' };
  }

  const household = await loadServerHousehold();
  const result = await executeCommand(
    {
      intent,
      items,
      price: typeof params.price === 'number' && params.price > 0 ? params.price : null,
      store: params.store?.trim() || null,
      lang,
      text: `${params.action}: ${params.products}`,
    },
    household,
  );

  return { ok: true, done: result.replies.map((message) => renderMessage(message, lang)) };
};

const inputSchema: InputJsonSchema = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['empty', 'in_stock', 'add_to_list', 'bought'],
      description: 'What happened.',
    },
    products: {
      type: 'string',
      description: 'Comma-separated products, optionally with quantity, e.g. "2 Milch, Eier".',
    },
    price: { type: 'number', description: 'Total price paid (only for bought, only for a single product).' },
    store: { type: 'string', description: 'Store name (only for bought).' },
    language: { type: 'string', enum: ['en', 'de'], description: 'Language of the confirmation.' },
  },
  required: ['action', 'products'],
};

export default defineLogicFunction({
  universalIdentifier: UPDATE_TOOL_UNIVERSAL_IDENTIFIER,
  name: 'everyday-update',
  description:
    'Everyday Runtime: record what happened in the household — products that are empty, still in stock, should go on the shopping list, or were bought (optional quantity, total price and store).',
  timeoutSeconds: 30,
  handler,
  toolTriggerSettings: { inputSchema },
  workflowActionTriggerSettings: {
    label: 'Everyday: record what happened',
    icon: 'IconChecklist',
    inputSchema: jsonSchemaToInputSchema(inputSchema),
  },
});
