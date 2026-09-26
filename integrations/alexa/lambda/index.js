// Everyday Runtime for Alexa: turns an intent into one plain sentence and
// sends it to POST /s/talk of your Twenty workspace. All understanding and
// every decision stay in Everyday Runtime; this file only translates.
// No dependencies: runs on AWS Lambda or as an Alexa-hosted skill (Node 18+).

import { readFileSync } from 'node:fs';

const TIMEOUT_MS = 7000; // Alexa waits 8 seconds for an answer.

// Sentences Everyday Runtime's parser understands, per intent and language.
export const SENTENCES = {
  de: {
    EmptyIntent: (item) => `${item} ist leer`,
    AddIntent: (item) => `${item} auf die Liste`,
    BoughtIntent: (item) => `${item} gekauft`,
    InStockIntent: (item) => `Wir haben noch ${item}`,
    StockQuestionIntent: (item) => `Haben wir noch ${item}?`,
    PriceIntent: (item) => `Was kostet ${item}?`,
    NeedsIntent: () => 'Was brauchen wir?',
  },
  en: {
    EmptyIntent: (item) => `We're out of ${item}`,
    AddIntent: (item) => `Add ${item} to the list`,
    BoughtIntent: (item) => `Bought ${item}`,
    InStockIntent: (item) => `We still have ${item}`,
    StockQuestionIntent: (item) => `Do we have ${item}?`,
    PriceIntent: (item) => `Price of ${item}?`,
    NeedsIntent: () => 'What do we need?',
  },
};

const TEXTS = {
  de: {
    welcome: 'Was gibt’s? Sag zum Beispiel: Milch ist leer, oder: Was brauchen wir?',
    reprompt: 'Noch etwas? Sag zum Beispiel: Kaffee gekauft.',
    more: 'Noch etwas?',
    help: 'Sag mir, was leer ist, was du gekauft hast oder was auf die Liste soll. Oder frag: Was brauchen wir? Haben wir noch Milch?',
    bye: 'Bis dann.',
    missingItem: 'Welches Produkt meinst du?',
    fallback: 'Das habe ich nicht verstanden. Sag zum Beispiel: Milch ist leer.',
    notConfigured: 'Der Skill ist noch nicht eingerichtet. Trag die Twenty-Adresse und den API-Schlüssel ein.',
    unreachable: 'Ich erreiche Everyday gerade nicht. Versuch es gleich noch einmal.',
    rejected: 'Twenty hat den API-Schlüssel abgelehnt.',
  },
  en: {
    welcome: 'What’s up? Say something like: we’re out of milk, or: what do we need?',
    reprompt: 'Anything else? For example: bought coffee.',
    more: 'Anything else?',
    help: 'Tell me what ran out, what you bought or what goes on the list. Or ask: what do we need? Do we have milk?',
    bye: 'Bye.',
    missingItem: 'Which product do you mean?',
    fallback: 'Sorry, I didn’t get that. Try: we’re out of milk.',
    notConfigured: 'This skill is not set up yet. Add your Twenty address and API key.',
    unreachable: 'I can’t reach Everyday right now. Please try again in a moment.',
    rejected: 'Twenty rejected the API key.',
  },
};

export const languageOf = (locale) => (String(locale ?? '').toLowerCase().startsWith('de') ? 'de' : 'en');

// Environment variables (AWS Lambda) or config.json next to this file
// (Alexa-hosted skills have no environment variables).
export const loadConfig = (env = process.env) => {
  let file = {};

  try {
    file = JSON.parse(readFileSync(new URL('./config.json', import.meta.url), 'utf8'));
  } catch {
    // No config.json: environment variables only.
  }

  let url = String(env.TWENTY_URL ?? file.twentyUrl ?? '').trim();

  while (url.endsWith('/')) {
    url = url.slice(0, -1);
  }

  return {
    url,
    apiKey: env.TWENTY_API_KEY ?? file.twentyApiKey ?? '',
    skillId: env.ALEXA_SKILL_ID ?? file.alexaSkillId ?? '',
  };
};

// Replies are written for screens; make them pleasant to listen to.
export const toSpeech = (reply, lang) =>
  reply
    .split('\n')
    .map((line) => line.trim().replace(/[.:!?]$/, ''))
    .filter(Boolean)
    .join('. ')
    .split(/[ \t]/)
    .filter(Boolean)
    .join(' ')
    .replaceAll(' — ', ', ')
    .replaceAll(' · ', ', ')
    .replaceAll('·', ',')
    .replaceAll('~ ', '~')
    .replaceAll('~', lang === 'de' ? 'etwa ' : 'about ')
    .replace(/[“”„"]/g, '')
    .concat('.');

export const slotValue = (intent, name) => {
  const slot = intent?.slots?.[name];
  const resolved = slot?.slotValue?.value ?? slot?.value;

  return typeof resolved === 'string' && resolved.trim() !== '' ? resolved.trim() : null;
};

// The sentence for an intent request, or null when a product is missing.
export const sentenceFor = (intent, lang) => {
  if (intent?.name === 'TalkIntent') {
    return slotValue(intent, 'text');
  }

  const build = SENTENCES[lang][intent?.name];

  if (!build) {
    return null;
  }
  if (intent.name === 'NeedsIntent') {
    return build();
  }

  const item = slotValue(intent, 'item');

  return item ? build(item) : null;
};

const respond = (text, { endSession, reprompt, attributes } = {}) => ({
  version: '1.0',
  sessionAttributes: attributes ?? {},
  response: {
    outputSpeech: { type: 'PlainText', text },
    card: { type: 'Simple', title: 'Everyday', content: text },
    ...(reprompt ? { reprompt: { outputSpeech: { type: 'PlainText', text: reprompt } } } : {}),
    shouldEndSession: endSession ?? true,
  },
});

export const talk = async (sentence, config, fetchImpl = fetch) => {
  const response = await fetchImpl(`${config.url}/s/talk`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: sentence }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (response.status === 401 || response.status === 403) {
    return { rejected: true };
  }
  if (!response.ok) {
    throw new Error(`POST /s/talk answered ${response.status}`);
  }

  return response.json();
};

export const createHandler =
  ({ config = loadConfig(), fetchImpl = fetch } = {}) =>
  async (event) => {
    const request = event?.request ?? {};
    const lang = languageOf(request.locale);
    const text = TEXTS[lang];
    const applicationId =
      event?.context?.System?.application?.applicationId ?? event?.session?.application?.applicationId;

    if (config.skillId && applicationId !== config.skillId) {
      throw new Error('Request for another skill');
    }

    // A conversation started with "Alexa, open …" stays open; a one-shot
    // command ("Alexa, tell … milk is empty") ends after the answer.
    const inConversation = Boolean(event?.session?.attributes?.conversation);
    const attributes = { conversation: inConversation };
    const done = (speech) =>
      inConversation
        ? respond(`${speech} ${text.more}`, { endSession: false, reprompt: text.reprompt, attributes })
        : respond(speech);

    if (request.type === 'LaunchRequest') {
      return respond(text.welcome, { endSession: false, reprompt: text.reprompt, attributes: { conversation: true } });
    }
    if (request.type === 'SessionEndedRequest') {
      return { version: '1.0', response: {} };
    }
    if (request.type !== 'IntentRequest') {
      return respond(text.fallback);
    }

    const name = request.intent?.name;

    if (name === 'AMAZON.StopIntent' || name === 'AMAZON.CancelIntent' || name === 'AMAZON.NoIntent') {
      return respond(text.bye);
    }
    if (name === 'AMAZON.HelpIntent') {
      return respond(text.help, { endSession: false, reprompt: text.reprompt, attributes });
    }
    if (name === 'AMAZON.FallbackIntent') {
      return respond(text.fallback, { endSession: false, reprompt: text.reprompt, attributes });
    }

    const sentence = sentenceFor(request.intent, lang);

    if (!sentence) {
      return respond(text.missingItem, { endSession: false, reprompt: text.missingItem, attributes });
    }
    if (!config.url || !config.apiKey) {
      return respond(text.notConfigured);
    }

    try {
      const result = await talk(sentence, config, fetchImpl);

      if (result.rejected) {
        return respond(text.rejected);
      }

      return done(toSpeech(String(result.reply || result.error || text.fallback), lang));
    } catch {
      return respond(text.unreachable);
    }
  };

export const handler = createHandler();
