import {
  IconAlertTriangle,
  IconCircleCheck,
  IconListCheck,
  IconPlus,
  IconShoppingCart,
  IconTrendingDown,
} from '@tabler/icons-react';

import { selectDeals } from 'src/domain/deals';
import { selectQuestions } from 'src/domain/questions';
import { moneyText, renderMessage } from 'src/domain/messages';
import { selectProbablyNeeded } from 'src/domain/shopping';
import { summarizeCount } from 'src/domain/presentation';
import { EmptyState, NeedCard, QuickAddForm } from 'src/ui/components';
import type { Household } from 'src/ui/use-household';
import { useI18n } from 'src/ui/i18n';
import { ProductAvatar } from 'src/ui/design';
import { TalkBox } from 'src/ui/talk-box';
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
    title={t('Never run out of the basics again.')}
    actions={
      <button
        type="button"
        className="er-btn er-btn-primary"
        disabled={household.busyKey !== null}
        onClick={() =>
          household.run(
            'demo',
            (actions) => actions.loadDemoHousehold(household.snapshot?.products ?? [], lang),
            t('Demo household is ready'),
          )
        }
      >
        {household.busyKey === 'demo' ? t('Loading…') : t('Try the demo household')}
      </button>
    }
  >
    {t('Tell it what you buy and what\'s running low. It learns your household\'s rhythm and gives you a heads-up before things run out — always with the why. Add your first item below, or take the demo household for a spin.')}
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
          placeholder={t('Add anything — e.g. 2 milk')}
          submitLabel={t('Add')}
          busy={busyKey !== null}
          onSubmit={(value) =>
            run('quick-add', (actions) =>
              actions.quickAddToList(value, snapshot?.products ?? [], openItems),
            t('On your list'))
          }
        />
      </div>
    );
  }

  return (
    <div className="er-stack">
      <section className="er-card er-hero" aria-labelledby="er-now-title">
        <p className="er-hero-eyebrow">
          <IconShoppingCart size={16} stroke={2} aria-hidden="true" />
          {t('YOUR SHOPPING')}
        </p>
        <h2 className="er-hero-title" id="er-now-title">
          {summarizeCount(needed.length, lang)}
        </h2>
        <p className="er-hero-sub">
          {needed.length === 0
            ? t('You\'re all set. We\'ll give you a heads-up before anything runs out.')
            : t('{onList} on your list · {suggested} smart picks', { onList, suggested })}
        </p>
        <button
          type="button"
          className="er-btn er-btn-primary er-btn-block"
          onClick={() => onNavigate('list')}
        >
          <IconListCheck size={18} stroke={2} aria-hidden="true" />
          {t('View shopping list')}
        </button>
      </section>

      <TalkBox household={household} />

      {deals.length > 0 && (
        <section aria-labelledby="er-deals-title">
          <h2 className="er-section-title" id="er-deals-title">
            {t('Deals worth grabbing')}
          </h2>
          <div className="er-need-grid">
            {deals.map((deal) => {
              const unit = deal.overview.product.defaultUnit;

              return (
                <article key={deal.overview.product.id} className="er-card er-deal" aria-label={t('Price for {name}', { name: deal.overview.product.name })}>
                  <div className="er-need-top">
                    <ProductAvatar category={deal.overview.product.category} />
                    <div className="er-need-text">
                      <h3 className="er-name">{deal.overview.product.name}</h3>
                      {deal.judgement.discount !== null && deal.judgement.discount > 0 && (
                        <span className="er-save">
                          <IconTrendingDown size={14} stroke={2} aria-hidden="true" />
                          {t('{percent}% cheaper', { percent: Math.round(deal.judgement.discount * 100) })}
                        </span>
                      )}
                    </div>
                    <div className="er-deal-price">
                      <strong>{moneyText(deal.point.unitPrice, deal.point.currency, lang)}</strong>
                      {deal.usualUnitPrice !== null && deal.usualUnitPrice > deal.point.unitPrice && (
                        <span className="er-strike">{moneyText(deal.usualUnitPrice, deal.point.currency, lang)}</span>
                      )}
                      {unit ? <span className="er-percent-label">{t('per {unit}', { unit })}</span> : null}
                    </div>
                  </div>
                  <p className="er-reason">
                    {deal.alertTriggered ? t('Price alert hit: ') : ''}
                    {renderMessage(deal.judgement.reasonMessage, lang)}
                    {deal.point.store ? t(' At {store}.', { store: deal.point.store }) : ''}
                  </p>
                  {deal.plan && <p className="er-headline">{renderMessage(deal.plan.reasonMessage, lang)}</p>}
                  <div className="er-chips">
                    <span className="er-chip er-chip-estimate">{t('Based on your price history')}</span>
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
                        <IconPlus size={18} stroke={2} aria-hidden="true" />
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
            {t('Quick check')}
          </h2>
          <div className="er-need-grid">
            {questions.map(({ overview: entry, reasonMessage }) => (
              <article
                key={entry.product.id}
                className="er-card er-question"
                aria-label={t('Question about {name}', { name: entry.product.name })}
              >
                <div className="er-need-top">
                  <ProductAvatar category={entry.product.category} size={40} />
                  <h3 className="er-name">{t('Still enough {name}?', { name: entry.product.name })}</h3>
                </div>
                <p className="er-reason">{renderMessage(reasonMessage, lang)}</p>
                <div className="er-actions">
                  <button
                    type="button"
                    className="er-btn er-btn-small"
                    disabled={busyKey !== null}
                    onClick={() =>
                      run(entry.product.id, (actions) => actions.markInStock(entry), t('Got it — {name} is still stocked', { name: entry.product.name }))
                    }
                  >
                    <IconCircleCheck size={18} stroke={2} aria-hidden="true" />
                    {t('Yes, plenty')}
                  </button>
                  <button
                    type="button"
                    className="er-btn er-btn-primary er-btn-small"
                    disabled={busyKey !== null}
                    onClick={() =>
                      run(entry.product.id, (actions) => actions.markEmpty(entry), t('{name} added to your list', { name: entry.product.name }))
                    }
                  >
                    <IconAlertTriangle size={18} stroke={2} aria-hidden="true" />
                    {t('Running low')}
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
            {t('Running low')}
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
                    <IconPlus size={18} stroke={2} aria-hidden="true" />
                    {t('Add to list')}
                  </button>
                )}
                <button
                  type="button"
                  className="er-btn er-btn-small"
                  disabled={busyKey !== null}
                  onClick={() =>
                    run(entry.product.id, (actions) => actions.markInStock(entry), t('Got it — {name} is still stocked', { name: entry.product.name }))
                  }
                >
                  <IconCircleCheck size={18} stroke={2} aria-hidden="true" />
                  {t('Still have some')}
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
              {t('See all {count}', { count: needed.length })}
            </button>
          )}
        </section>
      )}

      <section aria-labelledby="er-quick-title">
        <h2 className="er-section-title" id="er-quick-title">
          {t('Anything else?')}
        </h2>
        <QuickAddForm
          label={t('Add to shopping list')}
          placeholder={t('Add anything — e.g. 2 milk')}
          submitLabel={t('Add')}
          busy={busyKey !== null}
          onSubmit={(value) =>
            run('quick-add', (actions) =>
              actions.quickAddToList(value, snapshot?.products ?? [], openItems),
            t('On your list'))
          }
        />
      </section>
    </div>
  );
};
