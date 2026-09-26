import { selectDeals } from 'src/domain/deals';
import { formatMoney } from 'src/domain/prices';
import { selectQuestions } from 'src/domain/questions';
import { selectProbablyNeeded } from 'src/domain/shopping';
import { summarizeCount } from 'src/domain/presentation';
import { EmptyState, NeedCard, QuickAddForm } from 'src/ui/components';
import type { Household } from 'src/ui/use-household';
import { useSkippedQuestions } from 'src/ui/use-skipped-questions';

export type Tab = 'now' | 'list' | 'products' | 'activity';

const MAX_CARDS = 6;

export const WelcomeState = ({
  household,
}: {
  household: Household;
}) => (
  <EmptyState
    title="Welcome to Everyday Runtime"
    actions={
      <button
        type="button"
        className="er-btn er-btn-primary"
        disabled={household.busyKey !== null}
        onClick={() =>
          household.run(
            'demo',
            (actions) => actions.loadDemoHousehold(household.snapshot?.products ?? []),
            'Demo household loaded',
          )
        }
      >
        {household.busyKey === 'demo' ? 'Loading…' : 'Load demo household'}
      </button>
    }
  >
    Tell the app what you buy, what runs out and what you still have. It learns your
    rhythm and suggests what you probably need — with a reason for every guess. Start
    by adding something below, or load a small demo household to see how it works.
  </EmptyState>
);

export const NowScreen = ({
  household,
  onNavigate,
}: {
  household: Household;
  onNavigate: (tab: Tab) => void;
}) => {
  const { overview, busyKey, run, snapshot } = household;
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
          label="Add to shopping list"
          placeholder="Add something… e.g. 2 milk"
          submitLabel="Add"
          busy={busyKey !== null}
          onSubmit={(value) =>
            run('quick-add', (actions) =>
              actions.quickAddToList(value, snapshot?.products ?? [], openItems),
            'Added to your list')
          }
        />
      </div>
    );
  }

  return (
    <div className="er-stack">
      <section className="er-card er-hero" aria-labelledby="er-now-title">
        <p className="er-hero-eyebrow">SHOPPING</p>
        <h2 className="er-hero-title" id="er-now-title">
          {summarizeCount(needed.length)}
        </h2>
        <p className="er-hero-sub">
          {needed.length === 0
            ? 'Nothing looks low. We will tell you when something probably runs out.'
            : `${onList} on your list · ${suggested} suggested`}
        </p>
        <button
          type="button"
          className="er-btn er-btn-primary er-btn-block"
          onClick={() => onNavigate('list')}
        >
          Open shopping list
        </button>
      </section>

      {deals.length > 0 && (
        <section aria-labelledby="er-deals-title">
          <h2 className="er-section-title" id="er-deals-title">
            Good prices for you
          </h2>
          <div className="er-need-grid">
            {deals.map((deal) => {
              const unit = deal.overview.product.defaultUnit;

              return (
                <article key={deal.overview.product.id} className="er-card er-deal" aria-label={`Price for ${deal.overview.product.name}`}>
                  <div className="er-row-top">
                    <h3 className="er-name">{deal.overview.product.name}</h3>
                    <span className="er-percent er-tone-low">
                      {formatMoney(deal.point.unitPrice, deal.point.currency)}
                      {unit ? <span className="er-percent-label">per {unit}</span> : null}
                    </span>
                  </div>
                  <p className="er-reason">
                    {deal.alertTriggered ? 'Your price alert: ' : ''}
                    {deal.judgement.reason}
                    {deal.point.store ? ` At ${deal.point.store}.` : ''}
                  </p>
                  {deal.plan && <p className="er-headline">{deal.plan.reason}</p>}
                  <div className="er-chips">
                    <span className="er-chip er-chip-estimate">Estimate from your price history</span>
                  </div>
                  {deal.overview.openItem === null && (
                    <div className="er-actions">
                      <button
                        type="button"
                        className="er-btn er-btn-primary er-btn-small"
                        disabled={busyKey !== null}
                        onClick={() =>
                          run(deal.overview.product.id, (actions) => actions.addManually(deal.overview), `${deal.overview.product.name} added to your list`)
                        }
                      >
                        Add to list
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
            Quick questions
          </h2>
          <div className="er-need-grid">
            {questions.map(({ overview: entry, reason }) => (
              <article
                key={entry.product.id}
                className="er-card er-question"
                aria-label={`Question about ${entry.product.name}`}
              >
                <h3 className="er-name">Still enough {entry.product.name.toLocaleLowerCase()}?</h3>
                <p className="er-reason">{reason}</p>
                <div className="er-actions">
                  <button
                    type="button"
                    className="er-btn er-btn-small"
                    disabled={busyKey !== null}
                    onClick={() =>
                      run(entry.product.id, (actions) => actions.markInStock(entry), `Thanks — noted you still have ${entry.product.name}`)
                    }
                  >
                    Yes, enough
                  </button>
                  <button
                    type="button"
                    className="er-btn er-btn-primary er-btn-small"
                    disabled={busyKey !== null}
                    onClick={() =>
                      run(entry.product.id, (actions) => actions.markEmpty(entry), `${entry.product.name} added to your list`)
                    }
                  >
                    Running out
                  </button>
                  <button
                    type="button"
                    className="er-btn er-btn-ghost er-btn-small"
                    onClick={() => skipQuestion(entry.product.id)}
                  >
                    Not now
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
            Probably needed
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
                      run(entry.product.id, (actions) => actions.acceptSuggestion(entry), `${entry.product.name} added to your list`)
                    }
                  >
                    Add to list
                  </button>
                )}
                <button
                  type="button"
                  className="er-btn er-btn-small"
                  disabled={busyKey !== null}
                  onClick={() =>
                    run(entry.product.id, (actions) => actions.markInStock(entry), `Noted: you still have ${entry.product.name}`)
                  }
                >
                  Still have it
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
              Show all {needed.length}
            </button>
          )}
        </section>
      )}

      <section aria-labelledby="er-quick-title">
        <h2 className="er-section-title" id="er-quick-title">
          Need something else?
        </h2>
        <QuickAddForm
          label="Add to shopping list"
          placeholder="Add something… e.g. 2 milk"
          submitLabel="Add"
          busy={busyKey !== null}
          onSubmit={(value) =>
            run('quick-add', (actions) =>
              actions.quickAddToList(value, snapshot?.products ?? [], openItems),
            'Added to your list')
          }
        />
      </section>
    </div>
  );
};
