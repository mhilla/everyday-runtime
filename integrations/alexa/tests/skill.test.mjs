import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { parseCommand } from '../../../src/domain/commands';
import { createHandler, languageOf, SENTENCES, sentenceFor, toSpeech } from '../lambda/index.js';

const model = (locale) =>
  JSON.parse(
    readFileSync(new URL(`../skill-package/interactionModels/custom/${locale}.json`, import.meta.url), 'utf8'),
  ).interactionModel.languageModel;

const EXPECTED = {
  EmptyIntent: 'EMPTY',
  AddIntent: 'ADD',
  BoughtIntent: 'BOUGHT',
  InStockIntent: 'IN_STOCK',
  StockQuestionIntent: 'ASK_PRODUCT',
  PriceIntent: 'ASK_PRICE',
  NeedsIntent: 'ASK_NEEDS',
};

const intentRequest = (name, slots = {}, { locale = 'de-DE', conversation = false } = {}) => ({
  session: { attributes: conversation ? { conversation: true } : {}, application: { applicationId: 'amzn1.ask.skill.test' } },
  context: { System: { application: { applicationId: 'amzn1.ask.skill.test' } } },
  request: {
    type: 'IntentRequest',
    locale,
    intent: {
      name,
      slots: Object.fromEntries(Object.entries(slots).map(([key, value]) => [key, { name: key, value }])),
    },
  },
});

const fakeServer = (reply, status = 200) => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });

    return { status, ok: status < 400, json: async () => ({ ok: true, changed: true, reply }) };
  };

  return { calls, fetchImpl };
};

const config = { url: 'https://crm.example.com', apiKey: 'secret', skillId: 'amzn1.ask.skill.test' };

describe('Alexa sentences', () => {
  // Every intent × every example product in the interaction model must reach
  // Everyday Runtime's parser as the intended command for that product.
  for (const locale of ['de-DE', 'en-US']) {
    const lang = languageOf(locale);
    const items = model(locale).types.find((type) => type.name === 'EVERYDAY_ITEM').values.map((v) => v.name.value);

    it(`are understood by the parser (${locale})`, () => {
      for (const [intent, expected] of Object.entries(EXPECTED)) {
        for (const item of intent === 'NeedsIntent' ? ['-'] : items) {
          const sentence = sentenceFor({ name: intent, slots: { item: { value: item } } }, lang);
          const command = parseCommand(sentence);

          expect({ sentence, intent: command.intent }).toEqual({ sentence, intent: expected });
          expect(command.lang).toBe(lang);
          if (intent !== 'NeedsIntent') {
            expect(command.items.length, sentence).toBeGreaterThan(0);
          }
        }
      }
    });

    it(`has a sentence for every custom intent (${locale})`, () => {
      const custom = model(locale).intents.map((intent) => intent.name).filter((name) => !name.startsWith('AMAZON.'));

      expect(custom.sort()).toEqual([...Object.keys(SENTENCES[lang]), 'TalkIntent'].sort());
    });
  }

  it('reads replies aloud without screen punctuation', () => {
    expect(
      toSpeech('Das braucht ihr wahrscheinlich (2):\nKaffee — Leer (95 %), steht auf der Liste\nMilch — Wahrscheinlich knapp (86 %) · üblicher Abstand ~5 Tage', 'de'),
    ).toBe(
      'Das braucht ihr wahrscheinlich (2). Kaffee, Leer (95 %), steht auf der Liste. Milch, Wahrscheinlich knapp (86 %), üblicher Abstand etwa 5 Tage.',
    );
  });
});

describe('Alexa handler', () => {
  it('sends a one-shot command and ends the session', async () => {
    const server = fakeServer('Alles klar — Milch ist alle und steht auf der Liste.');
    const response = await createHandler({ config, fetchImpl: server.fetchImpl })(intentRequest('EmptyIntent', { item: 'Milch' }));

    expect(server.calls).toHaveLength(1);
    expect(server.calls[0].url).toBe('https://crm.example.com/s/talk');
    expect(server.calls[0].init.headers.Authorization).toBe('Bearer secret');
    expect(server.calls[0].body).toEqual({ text: 'Milch ist leer' });
    expect(response.response.outputSpeech.text).toBe('Alles klar, Milch ist alle und steht auf der Liste.');
    expect(response.response.shouldEndSession).toBe(true);
  });

  it('keeps a conversation open after "open"', async () => {
    const handler = createHandler({ config, fetchImpl: fakeServer('Got it — milk is out and on your list.').fetchImpl });
    const launch = await handler({ ...intentRequest('x', {}, { locale: 'en-US' }), request: { type: 'LaunchRequest', locale: 'en-US' } });

    expect(launch.response.shouldEndSession).toBe(false);
    expect(launch.sessionAttributes).toEqual({ conversation: true });

    const next = await handler(intentRequest('EmptyIntent', { item: 'milk' }, { locale: 'en-US', conversation: true }));

    expect(next.response.outputSpeech.text).toBe('Got it, milk is out and on your list. Anything else?');
    expect(next.response.shouldEndSession).toBe(false);
  });

  it('passes free sentences through TalkIntent', async () => {
    const server = fakeServer('Top — 2 Pck. Kaffee gekauft für 9,98 €.');

    await createHandler({ config, fetchImpl: server.fetchImpl })(
      intentRequest('TalkIntent', { text: 'hab zwei Kaffee für 9,98 gekauft' }),
    );
    expect(server.calls[0].body).toEqual({ text: 'hab zwei Kaffee für 9,98 gekauft' });
  });

  it('asks for the product when the slot is empty', async () => {
    const server = fakeServer('');
    const response = await createHandler({ config, fetchImpl: server.fetchImpl })(intentRequest('EmptyIntent'));

    expect(server.calls).toHaveLength(0);
    expect(response.response.outputSpeech.text).toBe('Welches Produkt meinst du?');
    expect(response.response.shouldEndSession).toBe(false);
  });

  it('explains setup problems instead of failing silently', async () => {
    const unconfigured = await createHandler({ config: { url: '', apiKey: '', skillId: '' } })(intentRequest('NeedsIntent'));

    expect(unconfigured.response.outputSpeech.text).toMatch(/noch nicht eingerichtet/);

    const rejected = await createHandler({ config, fetchImpl: fakeServer('', 401).fetchImpl })(intentRequest('NeedsIntent'));

    expect(rejected.response.outputSpeech.text).toBe('Twenty hat den API-Schlüssel abgelehnt.');

    const down = await createHandler({
      config,
      fetchImpl: async () => {
        throw new Error('offline');
      },
    })(intentRequest('NeedsIntent'));

    expect(down.response.outputSpeech.text).toMatch(/erreiche Everyday gerade nicht/);
  });

  it('refuses requests for another skill', async () => {
    const other = intentRequest('NeedsIntent');

    other.context.System.application.applicationId = 'amzn1.ask.skill.someone-else';
    await expect(createHandler({ config, fetchImpl: fakeServer('').fetchImpl })(other)).rejects.toThrow('another skill');
  });

  it('says goodbye on stop', async () => {
    const response = await createHandler({ config })(intentRequest('AMAZON.StopIntent', {}, { locale: 'en-US' }));

    expect(response.response.outputSpeech.text).toBe('Bye.');
  });
});
