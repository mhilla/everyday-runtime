import { selectDeals } from 'src/domain/deals';
import { selectQuestions } from 'src/domain/questions';
import { moneyText, renderMessage } from 'src/domain/messages';
import { selectProbablyNeeded } from 'src/domain/shopping';
import { summarizeCount } from 'src/domain/presentation';
import { EmptyState, NeedCard, QuickAddForm } from 'src/ui/components';
import type { Household } from 'src/ui/use-household';
import { useI18n } from 'src/ui/i18n';
import { useSkippedQuestions } from 'src/ui/use-skipped-questions';

export type Tab = 'now' | 'list' | 'products' | 'activity';

const MAX_CARDS = 6;

export const WelcomeState = ({
  household,
}: {
  household: Household;
}) => {
  const { t, lang } = useI18n();

  return (
  <EmptyState
    title={t('Welcome to Everyday Runtime')}
    actions={
      <button
        type="button"
        className="er-btn er-btn-primary"
        disabled={household.busyKey !== null}
        onClick={() =>
          household.run(
            'demo',
            (actions) => actions.loadDemoHousehold(household.snapshot?.products ?? [], lang),
            t('Demo household loaded'),
          )
        }
      >
        {household.busyKey === 'demo' ? t('Loading…') : t('Load demo household')}
      </button>
    }
  >
    {t('Tell the app what you buy, what runs out and what you still have. It learns your rhythm and suggests what you probably need — with a reason for every guess. Start by adding something below, or load a small demo household to see how it works.')}
  </EmptyState>
  );
};

export const NowScreen = ({
  household,
  onNavigate,
}: {
  household: Household;
  onNavigate: (tab: Tab) => void;
}) => {
  const { overview, busyKey, run, snapshot } = household;
  const { t, lang } = useI18n();
  const needed = selectProbablyNeeded(overview);
  const onList = needed.filter((entry) => entry.openItem !== null).length;
  const suggested = needed.length - onList;
  const [skipped, skipQuestion] = useSkippedQuestions(household.now);
  const questions = selectQuestions(overview, household.now, skipped);
  const deals = selectDeals(overview, household.prices, household.now);
  const openItems = (snapshot?.shoppingItems ?? []).filter((item) => item.status === 'OPEN');

  if (overview.length === 0) {
    return (
      <div className="er-stack">
        <WelcomeState household={household} />
        <QuickAddForm
          label={t('Add to shopping list')}
          placeholder={t('Add something… e.g. 2 milk')}
          submitLabel={t('Add')}
          busy={busyKey !== null}
          onSubmit={(value) =>
            run('quick-add', (actions) =>
              actions.quickAddToList(value, snapshot?.products ?? [], openItems),
            t('Added to your list'))
          }
        />
      </div>
    );
  }

  return (
    <div className="er-stack">
      <section className="er-card er-hero" aria-labelledby="er-now-title">
        <p className="er-hero-eyebrow">{t('SHOPPING')}</p>
        <h2 className="er-hero-title" id="er-now-title">
          {summarizeCount(needed.length, lang)}
        </h2>
        <p className="er-hero-sub">
          {needed.length === 0
            ? t('Nothing looks low. We will tell you when something probably runs out.')
            : t('{onList} on your list · {suggested} suggested', { onList, suggested })}
        </p>
        <button
          type="button"
          className="er-btn er-btn-primary er-btn-block"
          onClick={() => onNavigate('list')}
        >
          {t('Open shopping list')}
        </button>
      </section>

      {deals.length > 0 && (
        <section aria-labelledby="er-deals-title">
          <h2 className="er-section-title" id="er-deals-title">
            {t('Good prices for you')}
          </h2>
          <div className="er-need-grid">
            {deals.map((deal) => {
              const unit = deal.overview.product.defaultUnit;

              return (
                <article key={deal.overview.product.id} className="er-card er-deal" aria-label={t('Price for {name}', { name: deal.overview.product.name })}>
                  <div className="er-row-top">
                    <h3 className="er-name">{deal.overview.product.name}</h3>
                    <span className="er-percent er-tone-low">
                      {moneyText(deal.point.unitPrice, deal.point.currency, lang)}
                      {unit ? <span className="er-percent-label">{t('per {unit}', { unit })}</span> : null}
                    </span>
                  </div>
                  <p className="er-reason">
                    {deal.alertTriggered ? t('Your price alert: ') : ''}
                    {renderMessage(deal.judgement.reasonMessage, lang)}
                    {deal.point.store ? t(' At {store}.', { store: deal.point.store }) : ''}
                  </p>
                  {deal.plan && <p className="er-headline">{renderMessage(deal.plan.reasonMessage, lang)}</p>}
                  <div className="er-chips">
                    <span className="er-chip er-chip-estimate">{t('Estimate from your price history')}</span>
                  </div>
                  {deal.overview.openItem === null && (
                    <div className="er-actions">
                      <button
                        type="button"
                        className="er-btn er-btn-primary er-btn-small"
                        disabled={busyKey !== null}
                        onClick={() =>
                          run(deal.overview.product.id, (actions) => actions.addManually(deal.overview), t('{name} added to your list', { name: deal.overview.product.name }))
                        }
                      >
                        {t('Add to list')}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {questions.length > 0 && (
        <section aria-labelledby="er-questions-title">
          <h2 className="er-section-title" id="er-questions-title">
            {t('Quick questions')}
          </h2>
          <div className="er-need-grid">
            {questions.map(({ overview: entry, reasonMessage }) => (
              <article
                key={entry.product.id}
                className="er-card er-question"
                aria-label={t('Question about {name}', { name: entry.product.name })}
              >
                <h3 className="er-name">{t('Still enough {name}?', { name: entry.product.name })}</h3>
                <p className="er-reason">{renderMessage(reasonMessage, lang)}</p>
                <div className="er-actions">
                  <button
                    type="button"
                    className="er-btn er-btn-small"
                    disabled={busyKey !== null}
                    onClick={() =>
                      run(entry.product.id, (actions) => actions.markInStock(entry), t('Thanks — noted you still have {name}', { name: entry.product.name }))
                    }
                  >
                    {t('Yes, enough')}
                  </button>
                  <button
                    type="button"
                    className="er-btn er-btn-primary er-btn-small"
                    disabled={busyKey !== null}
                    onClick={() =>
                      run(entry.product.id, (actions) => actions.markEmpty(entry), t('{name} added to your list', { name: entry.product.name }))
                    }
                  >
                    {t('Running out')}
                  </button>
                  <button
                    type="button"
                    className="er-btn er-btn-ghost er-btn-small"
                    onClick={() => skipQuestion(entry.product.id)}
                  >
                    {t('Not now')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {needed.length > 0 && (
        <section aria-labelledby="er-needed-title">
          <h2 className="er-section-title" id="er-needed-title">
            {t('Probably needed')}
          </h2>
          <div className="er-need-grid">
            {needed.slice(0, MAX_CARDS).map((entry) => (
              <NeedCard key={entry.product.id} overview={entry} busy={busyKey === entry.product.id}>
                {entry.openItem === null && (
                  <button
                    type="button"
                    className="er-btn er-btn-primary er-btn-small"
                    disabled={busyKey !== null}
                    onClick={() =>
                      run(entry.product.id, (actions) => actions.acceptSuggestion(entry), t('{name} added to your list', { name: entry.product.name }))
                    }
                  >
                    {t('Add to list')}
                  </button>
                )}
                <button
                  type="button"
                  className="er-btn er-btn-small"
                  disabled={busyKey !== null}
                  onClick={() =>
                    run(entry.product.id, (actions) => actions.markInStock(entry), t('Noted: you still have {name}', { name: entry.product.name }))
                  }
                >
                  {t('Still have it')}
                </button>
              </NeedCard>
            ))}
          </div>
          {needed.length > MAX_CARDS && (
            <button
              type="button"
              className="er-btn er-btn-ghost er-btn-block"
              onClick={() => onNavigate('list')}
            >
              {t('Show all {count}', { count: needed.length })}
            </button>
          )}
        </section>
      )}

      <section aria-labelledby="er-quick-title">
        <h2 className="er-section-title" id="er-quick-title">
          {t('Need something else?')}
        </h2>
        <QuickAddForm
          label={t('Add to shopping list')}
          placeholder={t('Add something… e.g. 2 milk')}
          submitLabel={t('Add')}
          busy={busyKey !== null}
          onSubmit={(value) =>
            run('quick-add', (actions) =>
              actions.quickAddToList(value, snapshot?.products ?? [], openItems),
            t('Added to your list'))
          }
        />
      </section>
    </div>
  );
};
