import { IconMessageChatbot, IconMicrophone, IconSend } from '@tabler/icons-react';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { executeCommand } from 'src/data/command-executor';
import { renderMessage } from 'src/domain/messages';
import { selectProbablyNeeded } from 'src/domain/shopping';
import { Icon } from 'src/ui/design';
import { useI18n } from 'src/ui/i18n';
import type { Household } from 'src/ui/use-household';

type Exchange = { id: number; said: string; replies: string[] };

const MAX_EXCHANGES = 4;

// "Talk to your list": free, deterministic understanding of everyday
// sentences. Voice works through the phone keyboard's dictation button.
export const TalkBox = ({ household }: { household: Household }) => {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const { snapshot, overview, prices, busyKey, run } = household;
  const busy = busyKey !== null;

  const send = (sentence: string) => {
    const said = sentence.trim();

    if (said === '' || !snapshot) {
      return;
    }
    setText('');
    run('talk', async (actions) => {
      const result = await executeCommand(said, { actions, snapshot, overview, prices });

      setExchanges((current) =>
        [
          {
            id: Date.now(),
            said,
            replies: result.replies.map((reply) => renderMessage(reply, result.command.lang)),
          },
          ...current,
        ].slice(0, MAX_EXCHANGES),
      );
    });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    send(text);
  };

  // Suggestions use the household's own products: ask about the most likely
  // *estimate* (a confirmed report needs no question) and about a price.
  const estimate = selectProbablyNeeded(overview).find(
    (entry) => entry.openItem === null && entry.assessment.state !== 'CONFIRMED',
  )?.product.name;
  const priced = [...prices.keys()]
    .map((id) => overview.find((entry) => entry.product.id === id)?.product.name)
    .find(Boolean);
  const suggestions = [
    t('What do we need?'),
    ...(estimate ? [t('Enough {name} left?', { name: estimate })] : []),
    ...(priced ? [t('Price of {name}?', { name: priced })] : []),
  ];

  return (
    <section className="er-card er-talk" aria-labelledby="er-talk-title">
      <div className="er-talk-head">
        <span className="er-talk-badge" aria-hidden="true">
          <IconMessageChatbot size={22} stroke={1.75} aria-hidden="true" />
        </span>
        <div>
          <h2 className="er-talk-title" id="er-talk-title">
            {t('Just tell it')}
          </h2>
          <p className="er-talk-hint">{t('“We\'re out of milk”, “What do we need?” — or tap the mic on your keyboard.')}</p>
        </div>
      </div>
      <form className="er-talk-bar" onSubmit={submit} aria-label={t('Just tell it')}>
        <Icon icon={IconMicrophone} size={20} />
        <label className="er-visually-hidden" htmlFor="er-talk-input">
          {t('What happened?')}
        </label>
        <input
          id="er-talk-input"
          className="er-talk-input"
          placeholder={t('We\'re out of milk…')}
          value={text}
          autoComplete="off"
          enterKeyHint="send"
          onChange={(event) => setText(event.target.value)}
        />
        <button
          type="submit"
          className="er-talk-send"
          aria-label={t('Send')}
          disabled={busy || text.trim() === ''}
        >
          <IconSend size={20} stroke={2} aria-hidden="true" />
        </button>
      </form>
      <div className="er-suggestions" aria-label={t('Suggestions')}>
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="er-suggestion"
            disabled={busy}
            onClick={() => send(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
      {exchanges.length > 0 && (
        <ol className="er-talk-log" role="log" aria-live="polite" aria-label={t('Conversation')}>
          {exchanges.map((exchange) => (
            <li key={exchange.id}>
              <p className="er-talk-said">{exchange.said}</p>
              {exchange.replies.map((reply, index) => (
                <p key={index} className="er-talk-reply">
                  {reply}
                </p>
              ))}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
