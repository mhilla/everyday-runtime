import { defineLogicFunction } from 'twenty-sdk/define';
import type { RoutePayload } from 'twenty-sdk/logic-function';

import { TALK_ROUTE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { executeCommand } from 'src/data/command-executor';
import { loadServerHousehold } from 'src/data/server-household';
import { renderMessage } from 'src/domain/messages';

// POST /s/talk  { "text": "Milch ist leer" }
// One sentence in, the same result as the in-app talk box out. Meant for
// automations: phone shortcuts, Home Assistant, n8n, chat bots, NFC tags.
const handler = async (event: RoutePayload) => {
  const body = (event.body ?? {}) as { text?: unknown };
  const text = typeof body.text === 'string' ? body.text.trim().slice(0, 500) : '';

  if (text === '') {
    return { ok: false, error: 'Send JSON like {"text": "Milch ist leer"}.' };
  }

  const result = await executeCommand(text, await loadServerHousehold());
  const lang = result.command.lang;

  return {
    ok: result.command.intent !== 'UNKNOWN',
    intent: result.command.intent,
    language: lang,
    changed: result.changed,
    reply: result.replies.map((message) => renderMessage(message, lang)).join('\n'),
  };
};

export default defineLogicFunction({
  universalIdentifier: TALK_ROUTE_UNIVERSAL_IDENTIFIER,
  name: 'talk',
  description: 'Understands one sentence ("Milch ist leer", "what do we need?") and answers or records it.',
  timeoutSeconds: 30,
  handler,
  httpRouteTriggerSettings: {
    path: '/talk',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
