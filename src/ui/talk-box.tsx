import { useState } from 'react';
import type { FormEvent } from 'react';

import { executeCommand } from 'src/data/command-executor';
import { renderMessage } from 'src/domain/messages';
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

  const submit = (event: FormEvent) => {
    event.preventDefault();

    const said = text.trim();

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

  return (
    <section className="er-card er-talk" aria-labelledby="er-talk-title">
      <h2 className="er-section-title" id="er-talk-title">
        {t('Talk to your list')}
      </h2>
      <form className="er-form" onSubmit={submit} aria-label={t('Talk to your list')}>
        <label className="er-visually-hidden" htmlFor="er-talk-input">
          {t('What happened?')}
        </label>
        <input
          id="er-talk-input"
          className="er-input"
          placeholder={t('e.g. “milk is empty” or “what do we need?”')}
          value={text}
          autoComplete="off"
          enterKeyHint="send"
          onChange={(event) => setText(event.target.value)}
        />
        <button type="submit" className="er-btn er-btn-primary" disabled={busyKey !== null || text.trim() === ''}>
          {busyKey === 'talk' ? '…' : t('Send')}
        </button>
      </form>
      <p className="er-fine-print">{t('Tip: use the microphone on your phone keyboard to speak.')}</p>
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
