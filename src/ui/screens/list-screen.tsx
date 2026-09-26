import { useState } from 'react';

import { formatPercent, formatQuantity } from 'src/domain/presentation';
import { selectOpenItems, selectSuggestions } from 'src/domain/shopping';
import { daysBetween, formatAgo } from 'src/domain/time';
import type { Product, ShoppingItem } from 'src/domain/types';
import { ariaBool, BuyPanel, EmptyState, NeedCard, QuickAddForm } from 'src/ui/components';
import type { Household } from 'src/ui/use-household';

const RECENTLY_BOUGHT_DAYS = 7;

const OriginChip = ({ item }: { item: ShoppingItem }) =>
  item.origin === 'INFERRED' ? (
    <span className="er-chip er-chip-estimate" title="Suggested by the app">
      Suggested{item.confidence !== null ? ` · ${formatPercent(item.confidence)}` : ''}
    </span>
  ) : (
    <span className="er-chip er-chip-confirmed">Added by you</span>
  );

const ListItemRow = ({
  item,
  product,
  household,
}: {
  item: ShoppingItem;
  product: Product | null;
  household: Household;
}) => {
  const [isBuying, setIsBuying] = useState(false);
  const { busyKey, run } = household;
  const busy = busyKey === item.id;

  return (
    <li className="er-card" aria-busy={ariaBool(busy)}>
      <div className="er-item">
        <button
          type="button"
          className="er-check"
          aria-label={`Mark ${item.name} as bought`}
          aria-expanded={ariaBool(isBuying)}
          disabled={product === null}
          onClick={() => setIsBuying((value) => !value)}
        >
          ✓
        </button>
        <div className="er-item-body">
          <h3 className="er-name">
            {item.name}{' '}
            <span className="er-qty">
              · {formatQuantity(item.requestedQuantity, product?.defaultUnit ?? null)}
            </span>
          </h3>
          {item.explanation && <p className="er-reason">{item.explanation}</p>}
          <div className="er-chips">
            <OriginChip item={item} />
          </div>
        </div>
        <button
          type="button"
          className="er-btn er-btn-ghost er-btn-small"
          aria-label={`Remove ${item.name} from the list`}
          disabled={busyKey !== null}
          onClick={() => run(item.id, (actions) => actions.removeFromList(item), `${item.name} removed`)}
        >
          ✕
        </button>
      </div>
      {isBuying && product && (
        <BuyPanel
          product={product}
          initialQuantity={item.requestedQuantity}
          busy={busy}
          onCancel={() => setIsBuying(false)}
          onConfirm={(details) =>
            run(item.id, (actions) => actions.markPurchased(item, product, details), `${item.name} bought`)
          }
        />
      )}
    </li>
  );
};

export const ListScreen = ({ household }: { household: Household }) => {
  const { snapshot, overview, busyKey, run, now } = household;
  const items = snapshot?.shoppingItems ?? [];
  const products = snapshot?.products ?? [];
  const productsById = new Map(products.map((product) => [product.id, product]));
  const openItems = selectOpenItems(items);
  const suggestions = selectSuggestions(overview);
  const recentlyBought = items
    .filter(
      (item) =>
        item.status === 'PURCHASED' &&
        item.purchasedAt !== null &&
        daysBetween(item.purchasedAt, now) <= RECENTLY_BOUGHT_DAYS,
    )
    .sort((a, b) => (b.purchasedAt?.getTime() ?? 0) - (a.purchasedAt?.getTime() ?? 0))
    .slice(0, 5);

  return (
    <div className="er-stack">
      <QuickAddForm
        label="Add to shopping list"
        placeholder="Add something… e.g. 2 milk"
        submitLabel="Add"
        busy={busyKey !== null}
        onSubmit={(value) =>
          run('quick-add', (actions) => actions.quickAddToList(value, products, openItems), 'Added to your list')
        }
      />

      <section aria-labelledby="er-tobuy-title">
        <h2 className="er-section-title" id="er-tobuy-title">
          To buy ({openItems.length})
        </h2>
        {openItems.length === 0 ? (
          <EmptyState title="Your list is empty">
            {suggestions.length > 0
              ? 'Nothing added yet — the suggestions below are what probably runs out next.'
              : 'Add what you need above. The app will also suggest things that probably run out.'}
          </EmptyState>
        ) : (
          <ul className="er-stack" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {openItems.map((item) => (
              <ListItemRow
                key={item.id}
                item={item}
                product={item.productId ? (productsById.get(item.productId) ?? null) : null}
                household={household}
              />
            ))}
          </ul>
        )}
      </section>

      {suggestions.length > 0 && (
        <section aria-labelledby="er-suggest-title">
          <h2 className="er-section-title" id="er-suggest-title">
            Suggested for you
          </h2>
          <div className="er-need-grid">
            {suggestions.map((entry) => (
              <NeedCard key={entry.product.id} overview={entry} busy={busyKey === entry.product.id}>
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
                <button
                  type="button"
                  className="er-btn er-btn-small"
                  disabled={busyKey !== null}
                  onClick={() =>
                    run(entry.product.id, (actions) => actions.dismissSuggestion(entry), 'Okay — not suggesting it for now')
                  }
                >
                  Not now
                </button>
              </NeedCard>
            ))}
          </div>
        </section>
      )}

      {recentlyBought.length > 0 && (
        <section aria-labelledby="er-bought-title">
          <h2 className="er-section-title" id="er-bought-title">
            Recently bought
          </h2>
          <ul className="er-card er-timeline">
            {recentlyBought.map((item) => (
              <li key={item.id}>
                <span className="er-dot" data-tone="low" aria-hidden="true" />
                <div>
                  <strong>{item.name}</strong>
                  <div className="er-time">
                    {item.purchasedAt ? formatAgo(item.purchasedAt, now) : ''}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
