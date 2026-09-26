import { selectProbablyNeeded } from 'src/domain/shopping';
import { summarizeCount } from 'src/domain/presentation';
import { EmptyState, NeedCard, QuickAddForm } from 'src/ui/components';
import type { Household } from 'src/ui/use-household';

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
  const toCheck = overview.filter((entry) => entry.assessment.basis === 'CONFLICT');
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

      {toCheck.length > 0 && (
        <section aria-labelledby="er-check-title">
          <h2 className="er-section-title" id="er-check-title">
            Please check
          </h2>
          <div className="er-need-grid">
            {toCheck.map((entry) => (
              <NeedCard key={entry.product.id} overview={entry} busy={busyKey === entry.product.id}>
                <button
                  type="button"
                  className="er-btn er-btn-small"
                  disabled={busyKey !== null}
                  onClick={() => run(entry.product.id, (actions) => actions.markEmpty(entry), `${entry.product.name} marked empty`)}
                >
                  It’s empty
                </button>
                <button
                  type="button"
                  className="er-btn er-btn-small"
                  disabled={busyKey !== null}
                  onClick={() => run(entry.product.id, (actions) => actions.markInStock(entry), `Noted: you still have ${entry.product.name}`)}
                >
                  Still have it
                </button>
              </NeedCard>
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
